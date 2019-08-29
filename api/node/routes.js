const { Router } = require('express')

const router = Router()
const request = require('request-promise-native')

async function getExchange(req, res) {
  const opennode = require('opennode')
  if (!process.env.OPEN_NODE_KEY)
    return res.status(503).json({ message: 'exchange current unavailable' })

  opennode.setCredentials(process.env.OPEN_NODE_KEY, 'dev')
  const {
    BTCUSD: { USD },
  } = await opennode.listRates()
  res.status(200).json({ BTCUSD: USD })
}

async function getNode(req, res) {
  if (process.env.BOLTWALL_URI) {
    const info = await request({
      method: 'GET',
      uri: `${process.env.BOLTWALL_URI}/api/node`,
      json: true,
    })
    return res.status(200).json(info)
  }

  res.status(200).json({
    uris: [
      '02eadbd9e7557375161df8b646776a547c5cbc2e95b3071ec81553f8ec2cea3b8c@18.191.253.246:9735',
    ],
  })
}

router.get('/api/node/exchange', getExchange).get('/api/node', getNode)

module.exports = router
