const app = require('../index.js')
const { MacaroonsBuilder } = require('macaroons.js')
const request = require('request-promise-native')

/*
 * Must compose a root macaroon and retrieve an invoice
 * to send back in the response.
 * @params {String} req.body.docId - id of document client would like to pay for
 * @params {String} req.body.time - amount of time to purchase
 * @params {String} req.body.nodeUri - location of node endpoint for retrieving invoice
 * @params {String} req.body.title - title of document being requested
 * @returns {String} res.session.macaroon - serialized macaroon for client to satisfy
 * must include 3rd party caveat
 */
app.post('/api/invoice', async (req, res) => {
  let { docId, time, nodeUri, title } = req.body

  // TODO: remove hard coded node uri
  if (!nodeUri) nodeUri = 'https://ln-builder.bucko.now.sh'

  // first need to forward the request to retrieve the invoice
  const invoice = await request({
    method: 'POST',
    uri: `${nodeUri}/api/invoice`,
    body: { docId, time, title },
    json: true,
  })

  const location = req.headers['x-now-deployment-url']
  const secret = process.env.SESSION_SECRET
  const publicIdentifier = 'session secret'
  const builder = new MacaroonsBuilder(
    location,
    secret,
    publicIdentifier
  ).add_first_party_caveat(`docId = ${docId}`)

  const macaroon = builder
    .add_third_party_caveat(nodeUri, process.env.CAVEAT_KEY, invoice.id)
    .getMacaroon()

  req.session.macaroon = macaroon.serialize()
  res.json(invoice)
})

module.exports = app
