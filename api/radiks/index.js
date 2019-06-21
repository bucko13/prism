const { setup } = require('radiks-server')
const { aes } = require('bcrypto')
const app = require('../index.js')
const {
  getPublicKey,
  getUsersList,
  getUserKey,
  getDocument,
} = require('./helpers')
const { decryptECIES } = require('blockstack/lib/encryption')

let RadiksController

app.use('/api/radiks', async (req, res, next) => {
  if (!RadiksController)
    RadiksController = await setup({
      mongoDBUrl: process.env.MONGODB_URI,
    })
  return RadiksController(req, res, next)
})

app.get('/api/radiks/key', async (req, res) => {
  const pubKey = getPublicKey(req.query.id)
  res.json({ pubKey })
})

app.get('/api/radiks/key/:username', async (req, res) => {
  const key = await getUserKey(req.params.username)
  res.json({ key })
})

app.get('/api/radiks/document/:docId', async (req, res) => {
  const document = await getDocument(req.params.docId)
  const { encryptedContent, aesKey } = document
  const [encryptedData, iv] = encryptedContent.split(':::')
  const decryptedKey = decryptECIES(process.env.APP_PRIVATE_KEY, aesKey)
  const decryptedContent = aes.decipher(
    Buffer.from(encryptedData, 'hex'),
    Buffer.from(decryptedKey, 'hex'),
    Buffer.from(iv, 'hex')
  )
  res.json({ ...document, decryptedContent: decryptedContent.toString() })
})

app.get('/api/radiks/users', async (req, res) => {
  const users = await getUsersList()
  res.json({ users })
})

module.exports = app
