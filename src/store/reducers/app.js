import { Map } from 'immutable'

import { SET_PUB_KEY, SET_AES_KEY, SET_USER, SET_NODE_INFO } from '../constants'

const init = Map({ pubKey: '', aesKey: '', node: '' })

export default (state = init, action) => {
  const { type, payload } = action

  switch (type) {
    case SET_PUB_KEY:
      return state.set('pubKey', payload)

    case SET_AES_KEY:
      return state.set('aesKey', payload)

    case SET_USER:
      return state.merge({
        username: payload.username,
        userId: payload.userId,
        name: payload.name,
      })

    case SET_NODE_INFO:
      return state.set('node', payload)

    default:
      return state
  }
}
