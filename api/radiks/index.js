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

app.get('/api/radiks/document/:docId', async (req, res) => {
  const docId = req.params.docId
  const document = await getDocument(req.params.docId)
  const { content } = req.query
  const paymentConfig = req.session['payment-config']

  const { encryptedContent: data, keyId } = document
  const { encryptedKey: aesKey } = await getUserKey(keyId)

  // if no request for content then just return metadata
  if (!content)
    return res.status(200).json({
      title: document.title,
      author: document.author,
      _id: document._id,
    })
  // request for content but hasn't been authenticated for matching docId
  // or the expiration has passed then return payment required
  else if (
    content &&
    paymentConfig &&
    (!paymentConfig.expiration ||
      (paymentConfig.expiration &&
        new Date(paymentConfig.expiration) < Date.now()))
  )
    return res.status(402).json({ message: 'Payment required to view content' })
  else if (!data && document.title)
    return res.status(202).json({
      title: document.title,
      author: document.author,
      _id: document._id,
      decryptedContent: '[Content is protected]',
    })
  else if (paymentConfig && paymentConfig.docId !== docId) {
    return res
      .status(404)
      .json({ message: 'request for doc did not match existing payment' })
  } else if (!data)
    return res
      .status(404)
      .json({ message: 'no encrypted content for requested document' })

  // TODO: the below fails if content was never encrypted
  const [encryptedContent, iv] = data.split(':::')

  const decryptedKey = decryptECIES(process.env.APP_PRIVATE_KEY, aesKey)
  const decryptedContent = aes.decipher(
    Buffer.from(encryptedContent, 'hex'),
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
