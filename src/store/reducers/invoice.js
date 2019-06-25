// reducer for managing the state of an invoice modal

import { Map } from 'immutable'

import {
  SET_MODAL_VISIBILITY,
  INITIALIZE_MODAL,
  SET_INVOICE,
  CHANGE_SECONDS,
  SET_STATUS,
} from '../constants'

const init = Map({
  seconds: 30,
  visible: false,
  invoice: '',
  invoiceId: '',
  rate: 1,
  status: null,
})

export default (state = init, action) => {
  const { type, payload } = action

  switch (type) {
    case SET_MODAL_VISIBILITY:
      return state.set('visible', payload)

    case INITIALIZE_MODAL:
      return state.merge(payload)

    case SET_INVOICE:
      return state.merge(payload)

    case CHANGE_SECONDS:
      return state.set('seconds', payload)

    case SET_STATUS:
      return state.set('status', payload)

    default:
      return state
  }
}
