import assert from 'bsert'
import { get, post } from 'axios'

import {
  SET_MODAL_VISIBILITY,
  INITIALIZE_MODAL,
  SET_INVOICE,
  CHANGE_SECONDS,
  SET_STATUS,
  SET_STATUS_PAID,
  SET_MACAROON,
} from '../constants'
import { sleep } from '../../utils'

export function changeSeconds(seconds) {
  return {
    type: CHANGE_SECONDS,
    payload: seconds,
  }
}

export function setInvoice({ invoice, invoiceId, status }) {
  assert(invoice && invoice.length)
  return {
    type: SET_INVOICE,
    payload: { invoice, invoiceId, status },
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
    dispatch(clearInvoice())
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
    const docId = getState().documents.getIn(['currentDoc', '_id'])
    const nodeUri = getState().documents.getIn(['currentDoc', 'node'])

    if (typeof seconds !== 'number') time = parseInt(time, 10)
    assert(typeof time === 'number' && time > 0)

    const { data } = await post('/api/invoice', {
      time,
      title,
      docId,
      nodeUri,
    })
    const {
      lightning_invoice: { payreq: invoice },
      id,
      status,
    } = data
    dispatch(setInvoice({ invoice, invoiceId: id, status }))
    dispatch(checkInvoiceStatus())
  }
}

/* recursive call to check status of invoice
 * associated with current session
 * This means that currently a client can only support one
 * payment request at a time
 * @params {Number} tries - number of times to recursively make the call
 * @params {<Promise>} - will either set status to paid, failed, or call itself recursively
 */
export function checkInvoiceStatus(tries = 50, timeout = 750) {
  return async (dispatch, getState) => {
    let nodeUri = getState().documents.getIn(['currentDoc', 'node'])
    let invoiceId = getState().invoice.get('invoiceId')

    assert(
      invoiceId,
      'Missing invoiceId in state. Must request the invoice before checking status'
    )

    if (!nodeUri) nodeUri = process.env.LN_URI

    // if we still don't have a nodeUri, we should just return with an error
    if (!nodeUri)
      throw new Error(
        'No node uri associated with the post and no default payment gateway set. \
Contact site admin to create one with ln-builder.'
      )

    const response = await get(`${nodeUri}/api/invoice?id=${invoiceId}`)
    if (response.status === 200 && response.data.status === 'paid') {
      dispatch(closeModal())
      dispatch(setStatusPaid(response.data.discharge))
    } else if (tries > 0) {
      await sleep(timeout)
      return dispatch(checkInvoiceStatus(tries - 1))
    } else {
      return dispatch(setStatus('failed'))
    }
  }
}

function setStatusPaid(macaroon) {
  assert(macaroon, 'need a macaroon to update status to paid')
  if (window && localStorage) localStorage.setItem('invoiceMacaroon', macaroon)
  return {
    type: SET_STATUS_PAID,
    payload: macaroon,
  }
}

export function clearMacaroon() {
  return dispatch => {
    if (window && localStorage) localStorage.removeItem('invoiceMacaroon')
    dispatch(setMacaroon(''))
  }
}

export function setMacaroon(macaroon) {
  return {
    type: SET_MACAROON,
    payload: macaroon,
  }
}

export function setStatus(status) {
  return {
    type: SET_STATUS,
    payload: status,
  }
}

export function clearInvoice() {
  return dispatch => {
    dispatch(clearMacaroon())
    dispatch({
      type: SET_INVOICE,
      payload: {
        invoice: '',
        invoiceId: '',
      },
    })
  }
}
