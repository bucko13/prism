const express = require('express')
const helmet = require('helmet')
const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const session = require('express-session')
const bodyParser = require('body-parser')
const MemoryStore = require('memorystore')(session)

const app = express()

const DOCS_DIR = path.resolve(__dirname, '../docs')

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(helmet())

app.use(
  session({
    cookie: { maxAge: 86400000 },
    store: new MemoryStore({
      checkPeriod: 21600000, // prune expired entries every 6h
    }),
    rolling: false,
    secret: process.env.SESSION_SECRET || 'i_am_satoshi_08',
  })
)

app.post('/api/invoice', async (req, res) => {
  const { time } = req.body // time in seconds
  const { expiration } = req.session

  const opennode = require('opennode')
  opennode.setCredentials(process.env.OPEN_NODE_KEY, 'dev')

  try {
    const {
      BTCUSD: { USD: rate },
    } = await opennode.listRates()
    console.log('creating invoice')
    const invoice = await opennode.createCharge({
      description: `${time} seconds in the lightning reader`,
      amount: time,
      auto_settle: false,
    })

    req.session.pendingTime = time
    req.session.invoiceId = invoice.id
    req.session.expiration = Date.now() // initializing the value on the session
    res.status(200).json(invoice)
  } catch (error) {
    console.error(`${error.status} | ${error.message}`)
    res.status(400).json()
  }
})

app.get('/api/invoice', async (req, res) => {
  const { invoiceId, pendingTime: time } = req.session
  const opennode = require('opennode')
  const milli = time * 1000

  if (!invoiceId)
    return res.status(404).json({ message: 'no invoice for that user' })

  opennode.setCredentials(process.env.OPEN_NODE_KEY, 'dev')

  try {
    console.log('checking for invoiceId:', req.session.invoiceId)
    const data = await opennode.chargeInfo(req.session.invoiceId)
    const status = data.status
    if (status === 'paid') {
      req.session.pendingTime = null
      // add 1 second of "free time" as a buffer
      req.session.expiration = new Date(Date.now() + milli + 1000)
      return res.status(200).json({ expiration: req.session.expiration })
    } else if (status === 'processing' || status === 'unpaid') {
      console.log('still processing...')
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

app.get('/api/exchange', async (req, res) => {
  const opennode = require('opennode')
  opennode.setCredentials(process.env.OPEN_NODE_KEY, 'dev')
  const {
    BTCUSD: { USD },
  } = await opennode.listRates()
  res.status(200).json({ BTCUSD: USD })
})

app.get('/api/docs', async (req, res) => {
  const docs = await getDocTitles()
  console.log('docs:', docs)
  res.status(200).json(docs)
})

app.get('/api/node', async (req, res) => {
  res.status(200).json({
    identityPubkey:
      '02eadbd9e7557375161df8b646776a547c5cbc2e95b3071ec81553f8ec2cea3b8c@18.191.253.246:9735',
  })
})

app.get('/api/doc/:filename', async (req, res, next) => {
  const filename = req.params.filename
  const { pages, expiration } = req.session

  if (new Date(expiration) < Date.now() || (!expiration && !req.query.count)) {
    console.log('Session has expired for', req.sessionID)
    req.session.destroy()
    return res
      .status(402)
      .json({ message: 'Time has expired. New payment required' })
  }

  const count = parseInt(req.query.count, 10) || 0
  const filePath = path.resolve(DOCS_DIR, filename)

  if (!req.session.pages) req.session.pages = 0
  req.session.pages++

  try {
    let doc = fs.readFileSync(filePath, 'utf8')
    doc = JSON.parse(doc)
    if (!doc.text) return next('No text for ', doc.title)
    const text = doc.text[count]
    doc.text = text
    res.status(200).json(doc)
  } catch (e) {
    next(e)
  }
})

module.exports = app

async function getDocTitles() {
  const files = await fs.readdirSync(DOCS_DIR)
  return files.map((file, index) => {
    const { title, subtitle } = require(path.resolve(DOCS_DIR, file))
    return { title, subtitle, file, id: index }
  })
}
