import assert from 'bsert'
import { get } from 'axios'
import { getConfig } from 'radiks'

import { User } from '../../models'

import { SET_BOLTWALL_URI } from '../constants'

/**
 * @description This sets the boltwall uri for the currently logged in user. This URI
 * will be associated with posts by this user that require payment.
 * @param {string} uri
 */
export function saveBoltwallUri(uri) {
  return async dispatch => {
    try {
      assert(typeof uri === 'string', 'Must pass a string as uri')

      const { userSession } = getConfig()
      const { username } = userSession.loadUserData()
      // test to make sure this is a valid boltwall uri
      const url = new URL('api/node', uri)
      await get(url.href)
      let [user] = await User.fetchOwnList({ username })
      assert(user, 'No user available in current session')
      user.update({ boltwall: uri })
      await user.save()
      dispatch(setBoltwallUri(uri))
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('There was a problem contacting the boltwall endpoint', e)
    }
  }
}

/**
 * @description Gets the boltwall URI for the currently logged in User.
 * Useful for preparing the profile view
 */
export function getBoltwallUri() {
  return async dispatch => {
    const { userSession } = getConfig()
    const { username } = userSession.loadUserData()
    let [user] = await User.fetchOwnList({ username })
    if (user && user.attrs.boltwall) {
      dispatch(setBoltwallUri(user.attrs.boltwall))
    }
  }
}

export function setBoltwallUri(uri) {
  assert(typeof uri === 'string', 'Boltwall URI must be a string')
  return {
    type: SET_BOLTWALL_URI,
    payload: uri,
  }
}
