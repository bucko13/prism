const { Router } = require('express')

const router = Router()

const { boltwall, getFirstPartyCaveatFromMacaroon } = require('boltwall')
const { getDB } = require('radiks-server')
const { COLLECTION } = require('radiks-server/app/lib/constants')
const request = require('request-promise-native')
const lnService = require('ln-service')
const { once } = require('events')
const { promisify } = require('util')

const { getDocument, getAuthUri } = require('../helpers')

const delay = promisify(setTimeout)

let mongo

// flat processing fee of 10 satoshis
const PROCESSING_FEE = 10

const PAYMENT_RATE = 10

const initMeta = {
  likes: 0,
  dislikes: 0,
}

function getRates(req, res) {
  res.status(200).json({
    tips: {
      rate: PAYMENT_RATE,
      units: 'satoshis/tip',
      fee: PROCESSING_FEE,
    },
  })
}

async function verifyPost(req, res, next) {
  if (!mongo) mongo = await getDB(process.env.MONGODB_URI)

  const { post } = req.params

  // if there is an id in the request
  // then we want to make sure that document exists before continuing in the request
  if (post) {
    const radiksData = mongo.collection(COLLECTION)
    const doc = await radiksData.findOne({
      radiksType: 'Document',
      _id: post,
    })
    if (!doc)
      return res
        .status(404)
        .json({ message: `No post with the id ${post} found.` })
    if (!doc.boltwall || !doc.boltwall.length)
      // eslint-disable-next-line no-console
      console.error(
        'Requested post does not support payments because it has no lightning node.'
      )

    // if we do have it, let's save it for other middleware to reference
    req.doc = doc
  }
  next()
}

async function getMetadata(req, res) {
  const { post } = req.params

  const metaDb = mongo.collection('metadata')
  let [metadata, document] = await Promise.all([
    metaDb.findOne({ post }),
    getDocument(post),
  ])

  const boltwall = await getAuthUri(document.userId)

  if (!metadata) {
    metadata = { ...initMeta, post }
    await metaDb.insertOne(metadata)
  }
  const {
    title,
    author,
    _id,
    createdAt,
    updatedAt,
    wordCount,
    requirePayment,
  } = document

  const body = {
    ...metadata,
    title,
    author,
    _id,
    createdAt,
    updatedAt,
    requirePayment,
    wordCount,
    boltwall,
  }

  return res.status(200).json(body)
}

async function verifyInvoice(req, res, next) {
  // on the path to prepare the hodl invoice
  if (req.path === '/hodl' && (req.method === 'POST' || req.method === 'PUT')) {
    if ((req.body && !req.body.paymentHash) || !req.body)
      return res.status(400).json({
        message:
          'Need payment hash in order to create the payment. \
Must be associated with an invoice belonging to the post owner.',
      })
    try {
      const { paymentHash } = req.body
      // if either is included then we can check with the doc owner's node
      // if the corresponding invoice actually exists. If it doesn't then we may
      // not be able to settle our payment
      const { node } = req.doc
      const { payreq, amount } = await request({
        method: 'GET',
        uri: `${node}/api/invoice?id=${paymentHash}`,
        json: true,
      })

      if (!payreq)
        return res.status(400).json({
          message:
            'Could not find an invoice at the receiving node that matches the payment hash',
        })

      // finally we need to bump the amount to cover our fee
      // fee is a flat processing fee for now
      req.body.amount = amount + PROCESSING_FEE
    } catch (e) {
      // this is in the event of an lnservice based error which comes as an array
      if (Array.isArray(e))
        return res
          .status(e[0])
          .json({ message: e[1], details: e[2].err.details })

      return res
        .status(500)
        .json({ message: 'Problem processing new hodl invoice' })
    }
  }
  next()
}

async function manageHodlInvoice(req, res, next) {
  const macaroon = req.session.macaroon
  // eslint-disable-next-line no-console
  console.log('Payment authorized to submit tips...')
  try {
    // this is the invoice id of the hodl invoice paid to prism
    // this is what we will settle with the secret once we pay the associated
    // invoice
    const hodlInvoiceId = getFirstPartyCaveatFromMacaroon(macaroon)

    let { is_confirmed, tokens } = await lnService.getInvoice({
      lnd: req.lnd,
      id: hodlInvoiceId,
    })

    // if the hodl invoice is already confirmed, then an old macaroon was used
    // and we should send them back with a 402
    if (is_confirmed) {
      req.session = null
      return res
        .status(402)
        .json({ message: 'Expired payment. Please send a new request.' })
    }

    // we should be able to retrieve an invoice with the same id
    // on the post's node since the id is what was used as the preimage to
    // create the hodl invoice
    const { node } = req.doc
    const { payreq, status, amount } = await request({
      method: 'GET',
      uri: `${node}/api/invoice?id=${hodlInvoiceId}`,
      json: true,
    })

    // let's make sure the payment amount matches the tips
    const likes = parseInt(req.body.likes, 10) || 0
    const dislikes = parseInt(req.body.dislikes, 10) || 0
    if (likes + dislikes !== amount / PAYMENT_RATE)
      return res.status(400).json({
        message: `Problem with payment. Amount paid did not match tips given. Payment is for ${amount /
          PAYMENT_RATE} tips.`,
      })

    // if the hodl invoice paid by client to prism is less than the
    // amount Prism is paying to the document owner, then we want to reject
    // since the difference is the fee collected by Prism
    // difference should be no less than our processing fee
    if (tokens - amount < PROCESSING_FEE)
      return res.status(400).json({
        message: `Insufficient fee. Expected payment of at least ${amount +
          PROCESSING_FEE}`,
      })

    // eslint-disable-next-line no-console
    if (status === 'paid') console.log('Invoice already paid to post owner')

    // now we are going to pay the request in order to get the secret
    const { secret } = await lnService.pay({ lnd: req.lnd, request: payreq })
    if (!secret) throw new Error('No secret returned by node for payment')

    // not awaiting since we want to catch its state changes
    lnService.settleHodlInvoice({ lnd: req.lnd, secret })

    // loop to wait for invoice to change state
    let counter = 0
    while (counter < 10 && !is_confirmed) {
      const subscription = lnService.subscribeToInvoice({
        lnd: req.lnd,
        id: hodlInvoiceId,
      })
      const [invoice] = await once(subscription, 'invoice_updated')
      is_confirmed = invoice.is_confirmed
      counter++
      await delay(500)
    }

    if (!is_confirmed) throw new Error('Hodl invoice failed to settle.')

    // eslint-disable-next-line no-console
    console.log('Hodl invoice to prism settled')

    // pass this along to the metadata updating route
    // so we can be sure that payment corresponds to the amount paid
    req.amount = amount

    // otherwise, if it was successful, we can go to the next route
    return next()
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("there was a problem paying the post owner's invoice", e)

    if (Array.isArray(e)) return res.status(e[0]).json({ message: e[1] })

    return res
      .status(500)
      .json({ message: 'There was a problem processing the payment' })
  }
}

/**
 * This route is protected by boltwall and will only pass if
 * payment has been successfully made. Afterwhich it will
 * update the metadata accordingly
 * @params { Number } req.body.likes - number to increment likes by
 * @params { Number } req.body.dislikes - number to decrement likes by
 */
async function updateTips(req, res) {
  const { post } = req.params

  const myboltwall = process.env.BOLTWALL_URI

  if (!myboltwall) throw new Error('No payment uri for Prism')

  const metaDb = mongo.collection('metadata')
  const metadata = await metaDb.findOne({ post: post })

  try {
    let newMeta
    if (!metadata) {
      newMeta = { ...initMeta, post, ...req.body }
      await metaDb.insertOne(newMeta)
    } else {
      newMeta = { ...metadata }
      const likes = parseInt(req.body.likes, 10) || 0
      const dislikes = parseInt(req.body.dislikes, 10) || 0
      if (likes) newMeta.likes = parseInt(metadata.likes, 10) + likes
      if (dislikes)
        newMeta.dislikes = parseInt(metadata.dislikes, 10) + dislikes

      await metaDb.updateOne({ post }, { $set: newMeta })
    }

    return res.status(200).json(newMeta)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`Problem updating metadata for post ${post}:`, e)
    return res.sendStatus(500)
  }
}

router.get('/api/metadata/rates', getRates)

router.use('/api/metadata/:post', verifyPost)
router.get('/api/metadata/:post', getMetadata)

// verify invoice for boltwall
router.use('/api/metadata/:post/tips', verifyInvoice)
// run boltwall protections and checks
router.use('/api/metadata/:post/tips', boltwall())
// if we got this far then that means we expect a hodl invoice
// to be held but not settled. We want to settle that before moving to the next route
router.use('/api/metadata/:post/tips', manageHodlInvoice)
// all boltwall checks have passed, invoices paid, now we can allow updating of tips
router.put('/api/metadata/:post/tips', updateTips)

module.exports = router
