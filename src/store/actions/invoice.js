import assert from 'bsert'
import { get, post } from 'axios'

import {
  SET_MODAL_VISIBILITY,
  INITIALIZE_MODAL,
  SET_INVOICE,
  CHANGE_SECONDS,
  SET_STATUS,
} from '../constants'
import { sleep } from '../../utils'

export function changeSeconds(seconds) {
  return {
    type: CHANGE_SECONDS,
    payload: seconds,
  }
}

export function setInvoice({ invoice, invoiceId }) {
  assert(invoice && invoice.length)
  return {
    type: SET_INVOICE,
    payload: { invoice, invoiceId },
  }
}

export function showModal() {
  return {
    type: SET_MODAL_VISIBILITY,
    payload: true,
  }
}

export function closeModal() {
  return {
    type: SET_MODAL_VISIBILITY,
    payload: false,
  }
}

export function initializeModal(modalState) {
  return async dispatch => {
    const res = await get('/api/node/exchange')
    const { BTCUSD: rate } = res.data
    dispatch({
      type: INITIALIZE_MODAL,
      payload: { ...modalState, visible: true, rate },
    })
  }
}

export function requestInvoice() {
  return async (dispatch, getState) => {
    let time = getState().invoice.get('seconds')
    const title = getState().documents.getIn(['currentDoc', 'title'])
    const docId = getState().documents.getIn(['currentDoc', 'docId'])
    if (typeof seconds !== 'number') time = parseInt(time, 10)
    assert(typeof time === 'number' && time > 0)
    const {
      data: {
        lightning_invoice: { payreq: invoice },
        id,
        status,
      },
    } = await post('/api/node/invoice', {
      time,
      filename: title,
      docId,
    })
    dispatch(setInvoice({ invoice, invoiceId: id, status }))
    dispatch(checkInvoiceStatus(10))
  }
}

/* recursive call to check status of invoice
 * associated with current session
 * This means that currently a client can only support one
 * payment request at a time
 * @params {Number} tries - number of times to recursively make the call
 * @params {<Promise>} - will either set status to paid, failed, or call itself recursively
 */
export function checkInvoiceStatus(tries = 10, timeout = 750) {
  return async dispatch => {
    const response = await get('/api/node/invoice')
    if (response.status === 200 && response.data.status === 'paid') {
      dispatch(closeModal())
      dispatch(setStatus('paid'))
      dispatch(clearInvoice())
    } else if (tries > 0) {
      await sleep(timeout)
      return dispatch(checkInvoiceStatus(tries - 1))
    } else {
      return dispatch(setStatus('failed'))
    }
  }
}

export function setStatus(status) {
  return {
    type: SET_STATUS,
    payload: status,
  }
}

export function clearInvoice() {
  return {
    type: SET_INVOICE,
    payload: {
      invoice: '',
      invoiceId: '',
    },
  }
}
