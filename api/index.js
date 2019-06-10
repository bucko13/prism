const express = require('express')
const helmet = require('helmet')
const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const session = require('express-session')
const bodyParser = require('body-parser')
const MemoryStore = require('memorystore')(session)

const createLnRpc = require('@radar/lnrpc')

const app = express()

const DOCS_DIR = path.resolve(__dirname, '../docs')

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(helmet())

app.use(
  session({
    cookie: { maxAge: 86400000 },
    store: new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
    rolling: false,
    secret: process.env.SESSION_SECRET || 'i_am_satoshi_08',
  })
)

app.post('/api/invoice/request', async (req, res) => {
  const { time, user } = req.body // time in seconds
  const { expiration } = req.session
  const milli = time * 1000

  const lnrpc = await createLnRpc({
    server: process.env.LND_GRPC_URL,
    cert: new Buffer(process.env.LND_TLS_CERT, 'base64').toString('ascii'),
    macaroon: new Buffer(process.env.LND_MACAROON, 'base64').toString('hex'),
  })
  // const client = await initNode()
  // console.log(await client.getInfo())
  req.session.expiration = new Date(Date.now() + milli)
  res.status(200).json({ expiration: req.session.expiration })
})

app.get('/api/docs', async (req, res) => {
  const docs = await getDocTitles()
  res.status(200).json(docs)
})

app.get('/api/doc/:filename', async (req, res, next) => {
  const filename = req.params.filename
  const { pages, expiration } = req.session
  if (new Date(expiration) < Date.now() || !expiration) {
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
