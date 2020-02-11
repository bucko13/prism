const { Router } = require('express')
const { setup } = require('radiks-server')
const { boltwall, TIME_CAVEAT_CONFIG } = require('boltwall')

const {
  getPublicKey,
  getUsersList,
  getDocument,
  getDocumentsList,
  decryptWithAES,
  getProof,
  getDecryptedContentPreview,
  getAuthUri,
} = require('../helpers')

const router = Router()

let RadiksController

router.use('/api/radiks', async (req, res, next) => {
  if (!RadiksController)
    RadiksController = await setup({
      mongoDBUrl: process.env.MONGODB_URI,
    })
  return RadiksController(req, res, next)
})

router.get('/api/radiks/key', async (req, res) => {
  const pubKey = getPublicKey(req.query.id)
  res.json({ pubKey })
})

router.get('/api/radiks/preview/:docId', async (req, res) => {
  const { docId } = req.params
  const document = await getDocument(docId)

  if (!document)
    return res
      .status(404)
      .json({ message: `No document found for id ${docId}` })

  // if the request is just for a preview then we don't need to check authorization
  const { encryptedContent, keyId, requirePayment } = document
  const boltwallUri = await getAuthUri(document.userId)

  const contentPreview = await getDecryptedContentPreview(
    encryptedContent,
    keyId
  )
  // destructure what we need fromm the document
  const { title, author, _id, createdAt, updatedAt, node, wordCount } = document

  // send relevant information for content preview
  return res.json({
    title,
    author,
    _id,
    createdAt,
    updatedAt,
    requirePayment,
    node,
    wordCount,
    decryptedContent: contentPreview,
    boltwall: boltwallUri,
  })
})

// get documents list without radiks client on the front end
// useful for providing documents to users that are not signed in
router.get('/api/radiks/documents', async (req, res) => {
  const { limit = 10 } = req.query
  const documents = await getDocumentsList(limit)
  res.json({ documents })
})

router.get('/api/radiks/proof', async (req, res) => {
  const { id } = req.query
  const proof = await getProof(id)
  res.json(proof)
})

router.get('/api/radiks/users', async (req, res) => {
  const users = await getUsersList()
  res.json({ users })
})

router.get('/api/radiks/document/:docId', async (req, res, next) => {
  const { docId } = req.params
  const document = await getDocument(docId)

  if (!document)
    return res
      .status(404)
      .json({ message: `No document found for id ${docId}` })

  // if the request is just for a preview then we don't need to check authorization
  const { encryptedContent, keyId, requirePayment } = document

  // if no payment is required then just send decrypted content
  if (!requirePayment) {
    const decryptedContent = await decryptWithAES(encryptedContent, keyId)
    return res.json({ ...document, decryptedContent })
  }

  if (!encryptedContent && document.title)
    return res.status(202).json({
      title: document.title,
      author: document.author,
      _id: document._id,
      decryptedContent: '[Content is protected]',
    })
  else if (!encryptedContent)
    return res
      .status(404)
      .json({ message: 'no encrypted content for requested document' })

  // if the post does require payment, then we need to pass it through boltwall
  boltwall({ ...TIME_CAVEAT_CONFIG, oauth: true })(req, res, next)

  // if we've gotten this far we know that we have a valid LSAT
  // and can
  try {
    const decryptedContent = await decryptWithAES(encryptedContent, keyId)
    return res.json({ ...document, decryptedContent })
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('There was a problem decrypting content:', e.message)
    return res.status(500).json({ message: e.message })
  }
})

module.exports = router
