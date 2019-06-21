const {
  AppConfig,
  UserSession,
  getPublicKeyFromPrivate,
} = require('blockstack')
const { InstanceDataStore } = require('blockstack/lib/auth/sessionStore')
const { getDB } = require('radiks-server')
const { COLLECTION } = require('radiks-server/app/lib/constants')

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

async function getUserKey(username) {
  const mongo = await getDB(process.env.MONGODB_URI)
  const radiksData = mongo.collection(COLLECTION)
  const key = await radiksData.findOne(
    {
      radiksType: 'Key',
      username,
    },
    {
      projection: {
        encryptedKey: 1,
      },
    }
  )
  return key
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

exports.getAppUserSession = getAppUserSession
exports.getPublicKey = getPublicKey
exports.getUsersList = getUsersList
exports.getUserKey = getUserKey
