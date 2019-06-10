const createLnRpc = require('@radar/lnrpc')

export let node

export async function initNode() {
  return await createLnRpc({
    server: process.env.LND_GRPC_URL,
    cert: new Buffer(process.env.LND_TLS_CERT, 'base64').toString('ascii'),
    macaroon: new Buffer(process.env.LND_MACAROON, 'base64').toString('hex'),
  })
}
