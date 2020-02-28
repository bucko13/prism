import assert from 'bsert'
import { get, post } from 'axios'
import { Lsat } from 'lsat-js'

import {
  SET_MODAL_VISIBILITY,
  INITIALIZE_MODAL,
  SET_INVOICE,
  CHANGE_SECONDS,
  SET_STATUS,
  SET_STATUS_PAID,
  SET_MACAROON,
  SET_RATE,
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
  return dispatch => {
    dispatch(clearInvoice())
    dispatch({
      type: INITIALIZE_MODAL,
      payload: { ...modalState, visible: true },
    })
    dispatch(getRate())
  }
}

export function getRate() {
  return async dispatch => {
    const res = await get('/api/node/exchange')
    const { BTCUSD: rate } = res.data
    dispatch(setRate(rate))
  }
}

function setRate(rate) {
  assert(typeof rate === 'number')
  return {
    type: SET_RATE,
    payload: rate,
  }
}

/**
 * Check session storage for macaroon and set it in state
 * if found
 * @param {String} docId
 */
export function getMacaroon(docId) {
  return dispatch => {
    assert(typeof docId === 'string')
    let macaroon
    if (window && sessionStorage) macaroon = sessionStorage.getItem(docId)
    if (macaroon) return dispatch(setMacaroon(macaroon, docId))
  }
}

export function requestInvoice() {
  return async (dispatch, getState) => {
    let amount = getState().invoice.get('seconds')
    const docId = getState().documents.getIn(['currentDoc', '_id'])
    const boltwallUri = getState().documents.getIn(['currentDoc', 'boltwall'])
    if (typeof amount !== 'number') amount = parseInt(amount, 10)
    assert(typeof amount === 'number' && amount > 0)

    try {
      await get(
        `/api/radiks/document/${docId}?auth_uri=${boltwallUri}&amount=${amount}`
      )
    } catch (e) {
      if (e.response && e.response.status === 402) {
        const lsat = Lsat.fromHeader(e.response.headers['www-authenticate'])
        dispatch(setMacaroon(lsat.baseMacaroon, docId))
        dispatch(
          setInvoice({
            invoice: lsat.invoice,
            invoiceId: lsat.paymentHash,
            status: 'unpaid',
          })
        )
        dispatch(checkInvoiceStatus(50, 750, boltwallUri, lsat.baseMacaroon))
      }
    }
  }
}

/**
 * recursive call to check status of invoice
 * associated with current session
 * This means that currently a client can only support one
 * payment request at a time
 * @param {Number} tries - number of times to recursively make the call
 * @returns {<Promise>} - will either set status to paid, failed, or call itself recursively
 */
export function checkInvoiceStatus(tries = 50, timeout = 750, boltwall, mac) {
  return async (dispatch, getState) => {
    let boltwallUri =
      boltwall || getState().documents.getIn(['currentDoc', 'boltwall'])
    let docId = getState().documents.getIn(['currentDoc', '_id'])
    let macaroon = mac || getState().invoice.get('macaroon')

    // if we still don't have a boltwallUri, we should just return with an error
    if (!boltwallUri)
      throw new Error(
        'No boltwall uri associated with the post and no default payment gateway set. \
Contact site admin to create one with now-boltwall.'
      )
    try {
      const uri = new URL('/api/token', boltwallUri)
      const response = await post(uri.href, { macaroon })
      if (response.status === 200 && response.data.macaroon) {
        dispatch(closeModal())
        dispatch(setMacaroon(response.data.macaroon, docId))
        dispatch(setStatusPaid())
      } else if (response.data.status === 'held') {
        dispatch(setStatus('held'))
      } else {
        return dispatch(setStatus('failed'))
      }
    } catch (e) {
      // if the call for the token is returned with a 402 that means the invoice
      // hasn't been paid yet and we should keep polling for an update.
      if (e.response && e.response.status === 402 && tries > 0) {
        await sleep(timeout)
        return dispatch(checkInvoiceStatus(tries - 1, timeout, boltwallUri))
      } else {
        // eslint-disable-next-line no-console
        console.error('Invoice status check failed:', e)
        return dispatch(setStatus('failed'))
      }
    }
  }
}

function setStatusPaid() {
  return {
    type: SET_STATUS_PAID,
  }
}

export function clearMacaroon(docId) {
  assert(
    typeof docId === 'string',
    'Need docId to clear macaroon from session storage'
  )
  if (window && sessionStorage) sessionStorage.removeItem(docId)
  return dispatch => {
    dispatch({
      type: SET_MACAROON,
      payload: '',
    })
  }
}

export function setMacaroon(macaroon, docId) {
  assert(typeof macaroon === 'string', 'Missing macaroon')
  assert(typeof docId === 'string', 'Missing docId')
  if (window && sessionStorage) sessionStorage.setItem(docId, macaroon)
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
  return (dispatch, getState) => {
    const docId = getState().documents.getIn(['currentDoc', '_id'])
    dispatch(clearMacaroon(docId))
    dispatch({
      type: SET_INVOICE,
      payload: {
        invoice: '',
        invoiceId: '',
      },
    })
  }
}
