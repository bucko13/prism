const {
  AppConfig,
  UserSession,
  getPublicKeyFromPrivate,
} = require('blockstack')
const { InstanceDataStore } = require('blockstack/lib/auth/sessionStore')
const { getDB } = require('radiks-server')
const { COLLECTION } = require('radiks-server/app/lib/constants')
const { decryptECIES } = require('blockstack/lib/encryption')
const { aes } = require('bcrypto')
const assert = require('bsert')

function getAppUserSession({ origin = 'localhost:3000' }) {
  const appConfig = new AppConfig(
    ['store_write'],
    origin /* your app origin -> req.headers['x-now-deployment-url'] */
  )

  const dataStore = new InstanceDataStore({
    userData: {
      /* A user's app private key, in this case a user representing the app*/
      appPrivateKey: process.env.APP_PRIVATE_KEY,
      hubUrl: 'https://hub.blockstack.org',
    },
  })

  return new UserSession({
    appConfig: appConfig,
    sessionStore: dataStore,
  })
}

function getPublicKey() {
  return getPublicKeyFromPrivate(process.env.APP_PRIVATE_KEY)
}

/**
 * Helper function to find the auth_uri associated with a user.
 * This is necessary for prism to facilitate 3rd party authentication
 * @param {String} userId - userId to retrieve auth_uri (boltwall) for
 * @returns {String} the authorization URI needed to create oauth LSAT
 */
async function getAuthUri(userId) {
  const mongo = await getDB(process.env.MONGODB_URI)
  const radiksData = mongo.collection(COLLECTION)
  const { boltwall: boltwallUri } = await radiksData.findOne(
    {
      radiksType: 'User',
      _id: userId,
    },
    {
      projection: {
        boltwall: 1,
      },
    }
  )
  return boltwallUri
}

async function getUserKey(id) {
  const mongo = await getDB(process.env.MONGODB_URI)
  const radiksData = mongo.collection(COLLECTION)
  const key = await radiksData.findOne(
    {
      radiksType: 'Key',
      _id: id,
    },
    {
      projection: {
        encryptedKey: 1,
      },
    }
  )
  return key
}

async function getDocument(id) {
  const mongo = await getDB(process.env.MONGODB_URI)
  const radiksData = mongo.collection(COLLECTION)
  return await radiksData.findOne({
    radiksType: 'Document',
    _id: id,
  })
}

async function getDocumentsList(limit = 10) {
  if (typeof limit === 'string') limit = parseInt(limit, 10)

  const mongo = await getDB(process.env.MONGODB_URI)
  const radiksData = mongo.collection(COLLECTION)
  return await radiksData
    .find(
      {
        radiksType: 'Document',
      },
      {
        limit,
        projection: {
          title: 1,
          author: 1,
          proofId: 1,
          rawProof: 1,
          proofData: 1,
        },
      }
    )
    .toArray()
}

async function getUsersList() {
  const mongo = await getDB(process.env.MONGODB_URI)
  const radiksData = mongo.collection(COLLECTION)
  return await radiksData
    .find({
      radiksType: 'BlockstackUser',
    })
    .toArray()
}

async function getProof(id) {
  const mongo = await getDB(process.env.MONGODB_URI)
  const radiksData = mongo.collection(COLLECTION)
  return await radiksData.findOne({
    radiksType: 'Proof',
    _id: id,
  })
}

/**
 * Given previously symmetrically encrypted data and a key id
 * Retrieve key information, decrypt the aes key at the given keyId
 * and use it to decrypt the data
 * @param {String} data - encrypted data, cipher and iv split w/ string ':::'
 * @param {String} keyId - id of key to retrieve from Radiks db
 * @returns {String} decrypted data
 */
async function decryptWithAES(data, keyId) {
  assert(typeof data === 'string' && data.length, 'Missing content to decrypt')
  assert(data.indexOf(':::') > -1, 'Content encrypted in unknown format')
  assert(
    typeof keyId === 'string' && keyId.length,
    'Missing keyId for decryption'
  )
  // retrieve key object that has encrypted aesKey
  const { encryptedKey: encryptedAES } = await getUserKey(keyId)

  // TODO: the below fails if content was never encrypted
  const [encryptedContent, iv] = data.split(':::')

  // we need to decrypt the AES Key w/ our app's priv key
  const decryptedAES = decryptECIES(process.env.APP_PRIVATE_KEY, encryptedAES)

  const decryptedContent = aes.decipher(
    Buffer.from(encryptedContent, 'hex'),
    Buffer.from(decryptedAES, 'hex'),
    Buffer.from(iv, 'hex')
  )

  return decryptedContent.toString()
}

/**
 * Decrypts the content and returns a truncated version for displaying previews
 * @param {String} encryptedContent - encrypted data, cipher and iv split w/ string ':::'
 * @param {String} keyId - id of key to retrieve from Radiks db
 * @param {Number} [wordCount=150] - number of words to return
 * @returns {String} - returns decrypted content of no more than word count passed in
 */
async function getDecryptedContentPreview(
  encryptedContent,
  keyId,
  wordCount = 75
) {
  const decryptedContent = await decryptWithAES(encryptedContent, keyId)

  // get an array of all of the words
  const words = decryptedContent.split(' ')

  // if it's already less than the word count, then just return as is
  if (words.length < wordCount) return decryptedContent

  // then slice off just the words we need, join them back into a sentence and concat an elipses
  return words
    .slice(0, wordCount)
    .join(' ')
    .concat('...')
}

exports.getDecryptedContentPreview = getDecryptedContentPreview
exports.getAppUserSession = getAppUserSession
exports.getPublicKey = getPublicKey
exports.getDocumentsList = getDocumentsList
exports.getUsersList = getUsersList
exports.getProof = getProof
exports.getUserKey = getUserKey
exports.getDocument = getDocument
exports.decryptWithAES = decryptWithAES
exports.getAuthUri = getAuthUri
