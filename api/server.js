/* eslint-disable no-console */
/* eslint-disable no-console */
const express = require('express')
const helmet = require('helmet')
const cookieSession = require('cookie-session')
const bodyParser = require('body-parser')
const cors = require('cors')
const webpack = require('webpack')
const webpackDevMiddleware = require('webpack-dev-middleware')
const path = require('path')

const dotenv = require('dotenv')
dotenv.config({ path: `${path.resolve(__dirname, '..')}/.env` })

const app = express()

const metadata = require('./metadata/routes')
const radiks = require('./radiks/routes')
const proofs = require('./proofs/routes')
const invoice = require('./invoice/routes')
const node = require('./node/routes')
const port = process.env.PORT || 3000

app.set('trust proxy', 1)

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(cors())
app.use(helmet())

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

let config
if (process.env.ENVIRONMENT === 'production')
  config = require('../webpack-prod.config.js')(process.env)
else config = require('../webpack.config.js')(process.env)

console.log(`Starting ${process.env.ENVIRONMENT || 'development'} server`)

if (
  process.env.ENVIRONMENT !== 'production' &&
  process.env.ENVIRONMENT !== 'prod'
) {
  const compiler = webpack(config)
  app.use(
    webpackDevMiddleware(compiler, {
      publicPath: '/',
      hot: true,
      host: 'localhost',
    })
  )
  app.use('*', function(req, res, next) {
    var filename = path.join(compiler.outputPath, 'index.html')
    compiler.outputFileSystem.readFile(filename, function(err, result) {
      if (err) {
        return next(err)
      }
      res.set('content-type', 'text/html')
      res.send(result)
      res.end()
    })
  })
} else app.use(express.static('public'))

app.listen(port, () => console.log(`Prism server listening on port ${port}`))
