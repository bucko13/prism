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

// const metadataApp = require('./metadata/index')
// const radiksApp = require('./radiks/index')
// const proofsApp = require('./proofs/index')
// const invoiceApp = require('./invoice/index')
// const nodeApp = require('./node/index')

// const server = process.argv[2]
// switch (server) {
//   case 'metadata':
//     metadataApp.listen(port, () =>
//       console.log(`metadata server listening on port ${port}!`)
//     )
//     break

//   case 'radiks':
//     radiksApp.listen(port, () =>
//       console.log(`radiks server listening on port ${port}!`)
//     )
//     break

//   case 'proofs':
//     proofsApp.listen(port, () =>
//       console.log(`proofs server listening on port ${port}!`)
//     )
//     break

//   case 'invoice':
//     invoiceApp.listen(port, () =>
//       console.log(`invoice server listening on port ${port}!`)
//     )
//     break

//   case 'node':
//     nodeApp.listen(port, () =>
//       console.log(`node server listening on port ${port}!`)
//     )
//     break

//   default:
//     console.log('Could not find app by name:', server)
//     break
// }
