import assert from 'bsert'
import { get } from 'axios'

import { Document, Proof } from '../../models'
import {
  SET_CURRENT_DOC,
  SET_DOCUMENT_LIST,
  CLEAR_CURRENT_DOC,
  SET_CURRENT_CONTENT,
} from '../constants'
import { clearInvoice } from './invoice'

/*
 * Gets a list of document models from Radiks server
 * @param {Number} [count=10] - number of documents to populate state with
 * @returns {void} will dispatch an action to populate the state
 */
export function getDocumentList(count = 10) {
  return async dispatch => {
    const documents = await Document.fetchList({
      limit: count,
    })
    dispatch(setDocsFromModelList(documents))
    dispatch(getProofs())
  }
}

export function getOwnDocuments(count = 10) {
  return async dispatch => {
    const documents = await Document.fetchOwnList({
      limit: count,
    })
    dispatch(setDocsFromModelList(documents))
    dispatch(updateDocumentProofs())
  }
}

function setDocsFromModelList(documents) {
  return dispatch => {
    const list = documents.map(
      ({ attrs: { _id, author, title, proofId, rawProof, proofData } }) => ({
        docId: _id,
        author,
        title,
        proofId,
        rawProof,
        proofData,
      })
    )
    dispatch(setDocumentList(list))
  }
}

export function setDocumentList(documents) {
  assert(Array.isArray(documents), 'Must pass an array to set document list')
  return {
    type: SET_DOCUMENT_LIST,
    payload: documents,
  }
}

/*
 * Gets the document that matches the ID. Only retrieves metadata
 * not the content
 * TODO: Update to go through payment flow
 * @param {String} docId - id of document to retrieve
 * @returns {void} will dispatch an action to populate the state
 */
export function setCurrentDoc(docId) {
  return async dispatch => {
    try {
      const {
        data: { author, _id, title, decryptedContent, node },
      } = await get(`/api/radiks/document/${docId}`)

      return dispatch({
        type: SET_CURRENT_DOC,
        payload: {
          author,
          docId: _id,
          title,
          content: decryptedContent || '',
          node,
        },
      })
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Problem setting document:', e.message)
    }
  }
}

/*
 * Request permission and get cookie to read a document
 * @params {String} docId - id of document requesting permission for
 * @returns {void} dispatch action to set doc content
 */

export function getContent() {
  return async (dispatch, getState) => {
    try {
      const docId = getState().documents.getIn(['currentDoc', 'docId'])
      const macaroon = getState().invoice.get('macaroon')

      // can't set content without a macaroon
      if (!macaroon) return dispatch(setCurrentDoc(docId))

      // if request is successful then we should have the cookie
      // and can request the document content
      const {
        data: { decryptedContent },
      } = await get(
        `/api/radiks/document/${docId}?content=true&dischargeMacaroon=${macaroon}`
      )

      // TODO: cleanup
      if (!decryptedContent) throw new Error('expected to not get this far')

      dispatch({
        type: SET_CURRENT_CONTENT,
        payload: {
          content: decryptedContent,
          locked: false,
        },
      })
    } catch (e) {
      if (e.response && e.response.status === 402) {
        // eslint-disable-next-line no-console
        console.warn('Attempted to retrieve document that requires payment')
        // want to make sure to clear the macaroon if we get a 402
        // since this only would have been returned if we had
        // one set but it was expired
        dispatch(clearInvoice())
        dispatch({
          type: SET_CURRENT_CONTENT,
          payload: {
            content: '',
            locked: true,
          },
        })
      }
      // eslint-disable-next-line no-console
      else console.error('Problem unlocking content: ', e.message)
    }
  }
}

/*
 * An action creator that will get the proof for each document in the
 * store's current list, run a getProofs, and if that proof has a btc/tbtc anchor
 * evaluate it and update the document with the height, merkleRoot, and submittedAt
 * TODO: try and optimize this in such a way that it's non-blocking
 * i.e it would be nice if as each proof comes in that doc gets updated
 * possibly with a Promise.all
 * NOTE: this should only be run by the user who owns the document. Saving the proof
 * otherwise should actually fail since `beforeSave` updates the document, which shouldn't work
 * for a user that doesn't own the document
 */

export function updateDocumentProofs() {
  return async (dispatch, getState) => {
    const documents = getState().documents.get('documentList')
    const updated = []
    for (let doc of documents) {
      // first if there's no proofId then we need to create a new proof
      // and save it w/ the document this will start the anchoring process
      if (!doc.proofId) {
        const proof = new Proof({ docId: doc.docId })
        await proof.save()
        updated.push({ ...doc, proofId: proof._id })
      } else if (!doc.proofData) {
        // if no proof data then we need to retrieve the associated proof
        const proof = await Proof.findById(doc.proofId)

        // if the proof has no raw proof attr attached to it
        // then we need to get that assuming it does have a proof handles
        if (!proof.attrs.proof) await proof.getProofs()

        // evaluate the raw proof to extract the relevant data
        const proofData = proof.evaluateProof()
        updated.push({ ...doc, rawProof: proof.attrs.proof, proofData })
      }
    }

    if (updated.length) dispatch(setDocumentList(updated))
  }
}

/*
 * This will primarily be for updating document list for proof data
 * but not actually creating the proofs
 */
export function getProofs() {
  return async (dispatch, getState) => {
    const documents = getState().documents.get('documentList')
    const updated = []
    for (let doc of documents) {
      // if no proofId then the owner still needs to update it themselves
      // so we will add this doc to the list as is
      // if it has proofData then we don't need to update it
      if (!doc.proofId || doc.proofData) updated.push(doc)
      // no raw proof but there is a proofId, so we can add this locally ourselves
      else if (!doc.rawProof && !doc.proofData) {
        const proof = await Proof.findById(doc.proofId)
        const rawProof = proof.attrs.proof
        const proofData = proof.evaluateProof()
        updated.push({ ...doc, rawProof, proofData })
      }
    }

    dispatch(setDocumentList(updated))
  }
}

export function clearCurrentDoc() {
  return {
    type: CLEAR_CURRENT_DOC,
  }
}

export function clearDocumentList() {
  return dispatch => dispatch(setDocumentList([]))
}
