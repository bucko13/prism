const { Router } = require('express')
const { MacaroonsBuilder } = require('macaroons.js')
const request = require('request-promise-native')

const { INVOICE_TYPES } = require('../constants')

const router = Router()
/**
 * Must compose a root macaroon and retrieve an invoice
 * to send back in the response.
 * @param {String} req.body.docId - id of document client would like to pay for
 * @param {String} req.body.time - amount of time to purchase
 * @param {String} req.body.nodeUri - location of node endpoint for retrieving invoice
 * @param {String} req.body.title - title of document being requested
 * @returns {String} res.session.macaroon - serialized macaroon for client to satisfy
 */
async function createInvoice(req, res) {
  let { docId, amount, nodeUri, title, type, tipCount } = req.body

  // defaults to Prism's own boltwall
  if (!nodeUri) nodeUri = process.env.BOLTWALL_URI

  // if still none set then we need to return an error
  if (!nodeUri) {
    // eslint-disable-next-line no-console
    console.error('Missing fallback BOLTWALL_URI for payments')
    return res.status(500).json({ message: 'Problem generating invoice' })
  }

  if (type && type === INVOICE_TYPES.TIP) title = `Tips for "${title}"`

  // first need to forward the request to retrieve the invoice
  const invoice = await request({
    method: 'POST',
    uri: `${nodeUri}/api/invoice`,
    body: { docId, amount, title, appName: 'Prism Reader' },
    json: true,
  })

  const location = req.headers['x-now-deployment-url'] || req.headers.host
  const secret = process.env.SESSION_SECRET
  const publicIdentifier = 'session secret'
  const builder = new MacaroonsBuilder(
    location,
    secret,
    publicIdentifier
  ).add_first_party_caveat(`docId = ${docId}`)

  if (type === INVOICE_TYPES.TIP) {
    // this will be cumulative number of likes and dislikes
    builder.add_first_party_caveat(`tipCount = ${tipCount}`)
  }

  const macaroon = builder.getMacaroon()

  req.session.macaroon = macaroon.serialize()
  res.json(invoice)
}

router.route('/api/invoice').post(createInvoice)

module.exports = router
