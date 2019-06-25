/* eslint-disable no-console */

const app = require('../index.js')

app.post('/api/node/invoice', async (req, res) => {
  const { time, filename, docId } = req.body // time in seconds
  const paymentConfig = req.session['payment-config']
  const opennode = require('opennode')
  opennode.setCredentials(process.env.OPEN_NODE_KEY, 'dev')

  try {
    console.log('creating invoice')
    const invoice = await opennode.createCharge({
      description: `${time} seconds in the lightning reader for ${filename}`,
      amount: time,
      auto_settle: false,
    })

    req.session['payment-config'] = {
      ...paymentConfig,
      invoiceId: invoice.id,
      pendingTime: time,
      filename,
      docId,
    }
    res.status(200).json(invoice)
  } catch (error) {
    console.error(`${error.status} | ${error.message}`)
    res.status(400).json()
  }
})

app.get('/api/node/invoice', async (req, res) => {
  const opennode = require('opennode')
  const { invoiceId, pendingTime } = req.session['payment-config']
  const milli = pendingTime * 1000

  if (!invoiceId)
    return res.status(404).json({ message: 'no invoice for that user' })

  opennode.setCredentials(process.env.OPEN_NODE_KEY, 'dev')

  try {
    console.log('checking for invoiceId:', invoiceId)
    const data = await opennode.chargeInfo(invoiceId)
    const status = data.status
    if (status === 'paid') {
      // add 1 second of "free time" as a buffer
      req.session['payment-config'].expiration = new Date(
        Date.now() + milli + 1000
      )
      // remove "pending" status
      req.session['payment-config'].pendingTime = null
      console.log(`Invoice ${invoiceId} has been paid`)
      return res
        .status(200)
        .json({ status, expiration: req.session['payment-config'].expiration })
    } else if (status === 'processing' || status === 'unpaid') {
      console.log('still processing invoice %s...', invoiceId)
      return res.status(202).json({ status })
    } else {
      return res
        .status(400)
        .json({ message: `unknown invoice status ${status}` })
    }
  } catch (error) {
    console.error(`${error.status} | ${error.message}`)
    res.status(400).json({ message: error.message })
  }
})

app.get('/api/node/exchange', async (req, res) => {
  const opennode = require('opennode')
  opennode.setCredentials(process.env.OPEN_NODE_KEY, 'dev')
  const {
    BTCUSD: { USD },
  } = await opennode.listRates()
  res.status(200).json({ BTCUSD: USD })
})

app.get('/api/node', async (req, res) => {
  res.status(200).json({
    identityPubkey:
      '02eadbd9e7557375161df8b646776a547c5cbc2e95b3071ec81553f8ec2cea3b8c@18.191.253.246:9735',
  })
})

module.exports = app
