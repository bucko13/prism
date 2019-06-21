import assert from 'bsert'
import { getConfig } from 'radiks'

import { Key, User } from '../../models'
import { SET_PUB_KEY, SET_AES_KEY, SET_USER } from '../constants'

export function setPubKey(pubkey) {
  assert(typeof pubkey === 'string')
  return {
    type: SET_PUB_KEY,
    payload: pubkey,
  }
}

export function getAESKey() {
  return async (dispatch, getState) => {
    let aesKey = getState().app.get('aesKey')
    if (aesKey.length)
      // eslint-disable-next-line no-console
      console.warn('creating new aesKey when one is already set in store')

    // TODO: key should be setup in such a way that there
    // is only one per user. For now just pulling the first one off the list
    let [key] = await Key.fetchOwnList()

    // if no key already stored then let's generate a new one

    if (!key) {
      const pubKey = getState().app.get('pubKey')
      key = await generateKey(pubKey)
    }

    dispatch(setAESKey(key.attrs.aesKey))
    return key
  }
}

export function saveUser() {
  return async (dispatch, getState) => {
    const { userSession } = getConfig()
    const { username } = userSession.loadUserData()
    let [user] = await User.fetchOwnList({ username })
    if (!user) {
      const pubKey = getState().app.get('pubKey')
      const key = await generateKey(pubKey)
      user = new User({ keyId: key._id })
    }
    // run user.save to set the key property which runs after every `save` call
    await user.save()

    // sanity check to make sure everything is setup correctly
    assert(user.key, 'AES Key not set on user')
    dispatch(
      setUser({
        username: user.attrs.username,
        userId: user._id,
        name: user.attrs.name,
      })
    )
    dispatch(setAESKey(user.key.attrs.aesKey))
  }
}

export function setUser({ username, userId, name }) {
  assert(username && userId, 'Must pass username and id to set user info')
  return {
    type: SET_USER,
    payload: {
      username,
      userId,
      name,
    },
  }
}

/*
 * creates and saves a new key model, this should generally
 * only be run if a User does not already have a key associated with it
 * @returns {<Promise>} resolves to a saved key model
 */
async function generateKey(pubKey) {
  const key = new Key()
  // generates a random key and saves it on the model
  key.generateKey()
  // now encrypt it with app pubKey
  // this gets saved unencrypted to Gaia
  // so that the app can get the aesKey at any time to decrypt content
  key.encryptKey(pubKey)
  return await key.save()
}

export function setAESKey(aesKey) {
  assert(typeof aesKey === 'string')
  return {
    type: SET_AES_KEY,
    payload: aesKey,
  }
}
