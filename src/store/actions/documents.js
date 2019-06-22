import assert from 'bsert'
import { get } from 'axios'

import { Document } from '../../models'
import {
  SET_CURRENT_DOC,
  SET_DOCUMENT_LIST,
  CLEAR_CURRENT_DOC,
} from '../constants'

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
    const list = documents.map(({ attrs: { _id, author, title } }) => ({
      docId: _id,
      author,
      title,
    }))
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
 * Gets the document that matches the ID. In current iteration
 * this will _always_ return decrypted document.
 * TODO: Update to go through payment flow
 * @param {String} docId - id of document to retrieve
 * @returns {void} will dispatch an action to populate the state
 */
export function setCurrentDoc(docId) {
  return async dispatch => {
    try {
      const {
        data: { author, _id, title, decryptedContent },
      } = await get(`/api/radiks/document/${docId}`)
      assert(decryptedContent, 'Document did not return decrypted content')
      return dispatch({
        type: SET_CURRENT_DOC,
        payload: {
          author,
          docId: _id,
          title,
          content: decryptedContent,
        },
      })
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Problem setting document:', e.message)
    }
  }
}

export function clearCurrentDoc() {
  return {
    type: CLEAR_CURRENT_DOC,
  }
}
