/* eslint-disable no-console */
const dotenv = require('dotenv')
dotenv.config({ path: '../.env' })
const metadataApp = require('./metadata/index')
const radiksApp = require('./radiks/index')
const proofsApp = require('./proofs/index')
const invoiceApp = require('./invoice/index')
const nodeApp = require('./node/index')
const port = process.env.PORT || 3001

const server = process.argv[2]
switch (server) {
  case 'metadata':
    metadataApp.listen(port, () =>
      console.log(`metadata server listening on port ${port}!`)
    )
    break

  case 'radiks':
    radiksApp.listen(port, () =>
      console.log(`radiks server listening on port ${port}!`)
    )
    break

  case 'proofs':
    proofsApp.listen(port, () =>
      console.log(`proofs server listening on port ${port}!`)
    )
    break

  case 'invoice':
    invoiceApp.listen(port, () =>
      console.log(`invoice server listening on port ${port}!`)
    )
    break

  case 'node':
    nodeApp.listen(port, () =>
      console.log(`node server listening on port ${port}!`)
    )
    break

  default:
    console.log('Could not find app by name:', server)
    break
}
