/* eslint-disable no-console */
/* eslint-disable no-console */
const express = require('express')
// const helmet = require('helmet')
const cookieSession = require('cookie-session')
const bodyParser = require('body-parser')
const cors = require('cors')
const webpack = require('webpack')
const webpackDevMiddleware = require('webpack-dev-middleware')

const config = require('../webpack.config.js')
const compiler = webpack(config)
const app = express()

const dotenv = require('dotenv')
dotenv.config({ path: '../.env' })

const metadata = require('./metadata/routes')
const radiks = require('./radiks/routes')
const proofs = require('./proofs/routes')
const invoice = require('./invoice/routes')
const node = require('./node/routes')
const port = process.env.PORT || 5000

app.set('trust proxy', 1)

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(cors())
// app.use(helmet())

app.use(
  cookieSession({
    name: 'macaroon',
    maxAge: 86400000,
    secret: process.env.SESSION_SECRET || 'i_am_satoshi_08',
    overwrite: false,
    signed: true,
  })
)

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`)
  next()
})

app.use(node)
app.use(radiks)
app.use(invoice)
app.use(proofs)
app.use(metadata)
app.use(
  webpackDevMiddleware(compiler, {
    publicPath: config.output.publicPath,
  })
)

app.listen(port, () => console.log(`Prism server listening on port ${port}`))
