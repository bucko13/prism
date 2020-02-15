// reducer for managing the state of an invoice modal

import { Map } from 'immutable'

import {
  SET_MODAL_VISIBILITY,
  INITIALIZE_MODAL,
  SET_INVOICE,
  CHANGE_SECONDS,
  SET_STATUS,
  SET_MACAROON,
  SET_STATUS_PAID,
  SET_RATE,
} from '../constants'

let init = Map({
  seconds: 30,
  visible: false,
  invoice: '',
  invoiceId: '',
  rate: 1,
  status: null,
  macaroon: '',
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

    case SET_MACAROON:
      return state.set('macaroon', payload)

    case SET_STATUS_PAID:
      return state.merge({ status: 'paid', macaroon: payload })

    case SET_RATE:
      return state.set('rate', payload)

    default:
      return state
  }
}
