const { Router } = require('express')
const { boltwall } = require('boltwall')
const { getDB } = require('radiks-server')
const { COLLECTION } = require('radiks-server/app/lib/constants')
const request = require('request-promise-native')
const lnService = require('ln-service')
const { once } = require('events')
const { promisify } = require('util')
const { Lsat } = require('lsat-js')

const { getAuthUri } = require('../helpers')
const { TIPS_PAYMENT_RATE, PROCESSING_FEE } = require('../constants')
const delay = promisify(setTimeout)

const router = Router()
let mongo

const initMeta = {
  likes: 0,
  dislikes: 0,
}

function getRates(_req, res) {
  res.status(200).json({
    tips: {
      rate: TIPS_PAYMENT_RATE,
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

    doc.boltwallUri = await getAuthUri(doc.userId)

    if (!doc.boltwallUri || !doc.boltwallUri.length)
      // eslint-disable-next-line no-console
      console.error(
        'Requested post does not support payments because it has no lightning node.'
      )

    // if we do have it, let's save it for other middleware to reference
    req.doc = doc
  }
  next()
}

/**
 * @description This is a middleware that runs before boltwall and if the
 * request does not have an LSAT associated with it yet. If it doesn't have an LSAT,
 * then we need to validate the request by checking that the 3rd party's node has a matching
 * invoice by the same ID that we will use for the hodl invoice.
 * When ever thing is validated we pass the request on to the boltwall middleware.
 * If it does have an LSAT then we can just pass it to boltwall to run verifications
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
async function verifyInvoice(req, res, next) {
  // if there is an authorization header, then pass along to boltwall
  if (req.headers && req.headers.authorization) return next()

  // if the paymentHash is missing then boltwall won't be able to make the hodl invoice
  if ((req.body && !req.body.paymentHash) || !req.body)
    return res.status(400).json({
      message:
        'Need payment hash in order to create the payment. \
Must be associated with an invoice belonging to the post owner.',
    })

  // if payment hash is included then we can check with the doc owner's node
  // if the corresponding invoice actually exists. If it doesn't then we may
  // not be able to settle our payment
  try {
    const { paymentHash } = req.body

    if (!req.doc.boltwall) {
      res.status(400)
      return next({
        message:
          'No boltwall uri associated with this post. Cannot submit tips.',
      })
    }
    const { payreq, amount, status } = await request({
      method: 'GET',
      uri: `${req.doc.boltwallUri}/api/invoice?id=${paymentHash}`,
      json: true,
    })

    if (!payreq) {
      res.status(400)
      return next({
        message:
          'Could not find an invoice at the receiving node that matches the payment hash',
      })
    }

    // if the invoice was paid then we won't be able to pay and retrieve
    // preimage to redeem hodl invoice. This technically means the request
    // is invalid/expired since the tips have been paid for.
    if (status === 'paid') {
      res.status(400)
      return next({
        message:
          'Request made with a payment hash that has already been paid. Please request fresh invoice.',
      })
    }

    // finally we need to bump the amount to cover our fee
    // fee is a flat processing fee for now
    req.body.amount = amount + PROCESSING_FEE
  } catch (e) {
    // this is in the event of an lnservice based error which comes as an array
    if (Array.isArray(e))
      return res.status(e[0]).json({
        message: e[1],
        details: e[2].err.details,
      })
    return res.status(500).json({
      message: 'Problem processing new hodl invoice',
    })
  }
  // If we get here then the request is ready to go through boltwall
  // which will setup a hodl invoice LSAT for payment
  next()
}

/**
 * @description manageHodlInvoice runs after boltwall has validated a request.
 * It will verify that the invoice paid matches the amount of tips sent plus fees
 * and that the hodl invoice associated with the LSAT exists on our node. Once everything
 * has been validated, then we pay the author, get the preimage, and settle the hodl
 * invoice with it.
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
async function manageHodlInvoice(req, res, next) {
  // eslint-disable-next-line no-console
  console.log('Payment authorized to submit tips...')
  try {
    // Get the invoice id of the hodl invoice paid to prism from the LSAT.
    // This is what we will settle with the secret once we pay
    // the associated invoice
    let lsat
    try {
      lsat = Lsat.fromToken(req.headers.authorization)
    } catch (e) {
      res.status(400)
      // eslint-disable-next-line no-console
      throw new Error('Problem getting LSAT from request header %s', e.message)
    }

    const hodlInvoiceId = lsat.paymentHash

    // need to get the information for the hodl invoice to Prism
    // so we can confirm the payment amount compared to the amount
    // Prism will pay to the author.
    // TODO/OPTIMIZATION: Can this just be done with a caveat to
    // ensure the ids match? All we need is to commit the amount.
    // Satisfier could do the amount checking too
    try {
      const invoice = await lnService.getInvoice({
        lnd: req.lnd,
        id: hodlInvoiceId,
      })
      lsat.addInvoice(invoice.request)
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e)
      throw new Error('Problem getting hodl invoice from node')
    }

    const hodlAmount = lsat.invoiceAmount

    // need to get the invoice information for payment to author
    // including if it is paid and if the fee/hodl invoice amount
    // covers processing fee.
    const { payreq, status, amount } = await request({
      method: 'GET',
      uri: `${req.doc.boltwallUri}/api/invoice?id=${hodlInvoiceId}`,
      json: true,
    })

    // let's make sure the payment amount matches the tips. One will
    // always be zero.
    const likes = parseInt(req.body.likes, 10) || 0
    const dislikes = parseInt(req.body.dislikes, 10) || 0
    const expected = amount / TIPS_PAYMENT_RATE
    if (likes + dislikes !== expected)
      return res.status(400).json({
        message: `Problem with payment. Amount paid did not match tips given. Payment is for ${expected} tips.`,
      })

    // if the hodl invoice paid by client to prism is less than the
    // amount Prism is paying to the document owner, then we want to reject.
    // Since the difference is the fee collected by Prism,
    // difference should be no less than our processing fee
    if (hodlAmount - amount < PROCESSING_FEE)
      return res.status(400).json({
        message: `Insufficient fee. Expected payment of at least ${amount +
          PROCESSING_FEE} but only received ${hodlAmount}`,
      })

    // eslint-disable-next-line no-console
    if (status === 'paid') console.log('Invoice already paid to post owner')

    // now we are going to pay the request in order to get the secret
    const { secret } = await lnService.pay({
      lnd: req.lnd,
      request: payreq,
    })

    if (!secret) throw new Error('No secret returned by node for payment')

    // not awaiting since we want to catch its state changes
    lnService.settleHodlInvoice({ lnd: req.lnd, secret })

    // loop to wait for invoice to change state
    let counter = 0
    let is_confirmed = false
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

    // otherwise, if it was successful, we can go to the next route being protected
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
 * payment has been successfully made. After which it will
 * update the metadata accordingly
 * @params { Number } req.body.likes - number to increment likes by
 * @params { Number } req.body.dislikes - number to decrement likes by
 */
async function updateTips(req, res) {
  const { post } = req.params

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

/**
 * @description a boltwall config for a hodl invoice route
 * that also confirms the lsat can only be used on the same document
 * for which it was originally requested
 */
const boltwallConfig = {
  hodl: true,
  minAmount: PROCESSING_FEE,
  getCaveats: req => `documentId=${req.doc._id}`,
  caveatSatisfiers: {
    condition: 'documentId',
    satisfyFinal: (caveat, req) => {
      if (req.doc._id === caveat.value) return true
      return false
    },
  },
}

// get rates charged by Prism for tips
router.get('/api/tips/rates', getRates)

// verifies post exists and attaches information onto request object
router.use('/api/tips/:post', verifyPost)
// verify invoice for boltwall
router.use('/api/tips/:post', verifyInvoice)

// run boltwall protections and checks
// this will generate a hodl invoice for requests made with an LSAT
router.use('/api/tips/:post', boltwall(boltwallConfig))

// if we got this far then that means we expect a hodl invoice
// to be held but not settled. We want to settle that before moving to the next route
router.use('/api/tips/:post', manageHodlInvoice)

// all boltwall checks have passed, invoices paid, now we can allow updating of tips
router.put('/api/tips/:post', updateTips)

module.exports = router
