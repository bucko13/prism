import { Map } from 'immutable'
import { SET_BOLTWALL_URI } from '../constants'

const init = Map({ boltwall: '' })

export default (state = init, action) => {
  const { type, payload } = action
  switch (type) {
    case SET_BOLTWALL_URI:
      return state.set('boltwall', payload)
    default:
      return state
  }
}
