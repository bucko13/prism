import assert from 'bsert'
import { Key } from '../../models'
import { SET_PUB_KEY, SET_AES_KEY } from '../constants'

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
      console.warn('Fetching new aesKey when one is already set in store')

    // TODO: key should be setup in such a way that there
    // is only one per user. For now just pulling the first one off the list
    let [key] = await Key.fetchOwnList()

    // if no key already stored then let's generate a new one
    if (!key) {
      key = new Key()
      // generates a random key and saves it on the model
      key.generateKey()
      // now encrypt it with app pubKey
      // this gets saved unencrypted to Gaia
      // so that the app can get the aesKey at any time to decrypt content
      const pubKey = getState().app.get('pubKey')
      key.encryptKey(pubKey)
      await key.save()
    }

    dispatch(setAESKey(key.attrs.aesKey))
  }
}

export function setAESKey(aesKey) {
  assert(typeof aesKey === 'string')
  return {
    type: SET_AES_KEY,
    payload: aesKey,
  }
}
