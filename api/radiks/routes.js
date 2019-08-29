const { Router } = require('express')
const { setup } = require('radiks-server')

const {
  getPublicKey,
  getUsersList,
  getDocument,
  getDocumentsList,
  validateMacaroons,
  decryptWithAES,
  getProof,
  getDecryptedContentPreview,
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

router.get('/api/radiks/document/:docId', async (req, res) => {
  const { docId } = req.params
  const document = await getDocument(docId)
  const { content, dischargeMacaroon, preview } = req.query
  const rootMacaroon = req.session.macaroon

  if (!document)
    return res
      .status(404)
      .json({ message: `No document found for id ${docId}` })

  // if no request for content, or content preview then just return metadata
  if (!content && !preview)
    return res.status(200).json({
      title: document.title,
      author: document.author,
      _id: document._id,
      requirePayment: document.requirePayment,
    })

  // if the request is just for a preview then we don't need to check authorization
  const { encryptedContent, keyId, requirePayment } = document

  if (preview) {
    const contentPreview = await getDecryptedContentPreview(
      encryptedContent,
      keyId
    )
    // destructure what we need fromm the document
    const {
      title,
      author,
      _id,
      createdAt,
      updatedAt,
      requirePayment,
      node,
      wordCount,
    } = document

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
    })
  }

  // if the document requires payment then we need to check authorizations
  // before continuing
  if (requirePayment) {
    // if requesting content but no root macaroon cookie present in request
    // then an invoice needs to be requested first to get the macaroon for auth
    if (!rootMacaroon)
      return res.status(400).json({
        message:
          'Missing macaroon. Request an invoice before requesting content',
      })
    // request for content but no discharge macaroon passed in query param
    // likely means client still needs to pay ln node and verify payment status
    else if (!dischargeMacaroon)
      return res.status(400).json({
        message:
          'Missing 3rd party macaroon from payment node. \
  Make sure invoice is paid and you have received a discharge macaroon',
      })
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

  // if we've gotten this far we know that we have all necessary
  // macaroons as well as available document data.
  try {
    if (requirePayment)
      // make sure request is authenticated by validating the macaroons
      validateMacaroons(rootMacaroon, dischargeMacaroon, docId)
  } catch (e) {
    // if throws with an error message that includes text "expired"
    // then payment is required again
    if (e.message.toLowerCase().includes('expired'))
      return res.status(402).json({ message: e.message })
    return res.status(400).json({ message: e.message })
  }

  const decryptedContent = await decryptWithAES(encryptedContent, keyId)
  res.json({ ...document, decryptedContent })
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

module.exports = router
