const { setup } = require('radiks-server')
const app = require('../index.js')
const { getPublicKey, getUsersList, getUserKey } = require('./helpers')
// const { decryptECIES } = require('blockstack/lib/encryption')

let RadiksController
app.use('/api/radiks', async (req, res, next) => {
  if (!RadiksController)
    RadiksController = await setup({
      mongoDBUrl: process.env.MONGODB_URI,
    })
  return RadiksController(req, res, next)
})

app.get('/api/radiks/key', async (req, res) => {
  const pubKey = getPublicKey()
  res.json({ pubKey })
})

app.get('/api/radiks/users/:username', async (req, res) => {
  const key = await getUserKey(req.params.username)
  res.json({ key })
})

app.get('/api/radiks/users', async (req, res) => {
  const users = await getUsersList()
  res.json({ users })
})

module.exports = app
