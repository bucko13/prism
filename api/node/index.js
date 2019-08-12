/* eslint-disable no-console */

const app = require('../index.js')

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
    pubKey:
      '02eadbd9e7557375161df8b646776a547c5cbc2e95b3071ec81553f8ec2cea3b8c',
    socket: '18.191.253.246:9735',
  })
})

module.exports = app
