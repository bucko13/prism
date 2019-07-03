import { Map, List } from 'immutable'

import {
  SET_DOCUMENT_LIST,
  SET_CURRENT_DOC,
  CLEAR_CURRENT_DOC,
  SET_CURRENT_CONTENT,
  UPDATE_DOCUMENT,
} from '../constants'

const init = Map({
  currentDoc: Map({
    title: '',
    content: '',
    author: '',
    docId: '',
    locked: true,
    node: '', // uri of payment node
    // the following will also be saved on the document list items
    proofId: '', // id of associated proof
    rawProof: '', // raw proof data, saved as reference for evaluating
    proofData: {}, // object of height, merkleRoot, and submittedAt
  }),
  documentList: List([]),
})

export default (state = init, action) => {
  const { type, payload } = action

  switch (type) {
    case SET_DOCUMENT_LIST: {
      return state.set('documentList', List(payload))
    }

    case SET_CURRENT_DOC: {
      return state.mergeDeep({ currentDoc: payload })
    }

    case CLEAR_CURRENT_DOC:
      return state.set('currentDoc', init.get('currentDoc'))

    case SET_CURRENT_CONTENT: {
      const { content, locked } = payload
      return state.mergeDeep({
        currentDoc: { content: content, locked: locked },
      })
    }

    case UPDATE_DOCUMENT: {
      const { docId, data } = payload
      // we need to replace a doc with the matching id in the array
      const index = state
        .get('documentList')
        .findIndex(doc => doc._id === docId)
      let documentList = state.get('documentList')
      documentList = documentList.update(index, oldDoc => ({
        ...oldDoc,
        ...data,
      }))
      return state.set('documentList', documentList)
    }

    default:
      return state
  }
}
