const { Router } = require('express')
const { getDB } = require('radiks-server')
const { COLLECTION } = require('radiks-server/app/lib/constants')

const { getAuthUri } = require('../helpers')

const router = Router()
let mongo

const initMeta = {
  likes: 0,
  dislikes: 0,
}

async function verifyPost(req, res, next) {
  if (!mongo) mongo = await getDB(process.env.MONGODB_URI)

  const { post } = req.params

  // if there is an id in the request
  // then we want to make sure that document exists before continuing in the request
  if (post) {
    const radiksData = mongo.collection(COLLECTION)
    const doc = await radiksData.findOne({
      radiksType: 'Document',
      _id: post,
    })

    if (!doc)
      return res
        .status(404)
        .json({ message: `No post with the id ${post} found.` })

    // if we do have it, let's save it for other middleware to reference
    req.doc = doc
  }
  next()
}

async function getMetadata(req, res, next) {
  const { post } = req.params

  const metaDb = mongo.collection('metadata')
  let metadata = await metaDb.findOne({ post })

  // if there is an id in the request
  // then we want to make sure that document exists before continuing in the request
  if (post) {
    const radiksData = mongo.collection(COLLECTION)
    const doc = await radiksData.findOne({
      radiksType: 'Document',
      _id: post,
    })

    if (!doc) {
      res.status(404)
      return next({
        message: `No post with the id ${post} found.`,
      })
    }
  } else {
    res.status(400)
    return next({
      message: 'Malformed request. Missing post id.',
    })
  }

  const boltwall = await getAuthUri(req.doc.userId)

  if (!metadata) {
    metadata = { ...initMeta, post }
    await metaDb.insertOne(metadata)
  }

  const {
    title,
    author,
    _id,
    createdAt,
    updatedAt,
    wordCount,
    requirePayment,
  } = req.doc

  const body = {
    ...metadata,
    title,
    author,
    _id,
    createdAt,
    updatedAt,
    requirePayment,
    wordCount,
    boltwall,
  }

  return res.status(200).json(body)
}

router.use('/api/metadata/:post', verifyPost)
router.get('/api/metadata/:post', getMetadata)

module.exports = router
