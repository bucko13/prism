const { Router } = require('express')

const router = Router()
const { boltwall } = require('boltwall')

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

router.get('/api/node/exchange', getExchange).get('/api/node', boltwall())

module.exports = router
