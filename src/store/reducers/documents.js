import { Map, List } from 'immutable'

import {
  SET_DOCUMENT_LIST,
  SET_CURRENT_DOC,
  CLEAR_CURRENT_DOC,
  SET_CURRENT_CONTENT,
  UPDATE_DOCUMENT,
  SET_DOCS_LOADING,
  SET_CURRENT_LIKES,
  SET_CURRENT_DISLIKES,
} from '../constants'

const init = Map({
  currentDoc: Map({
    title: '',
    content: '',
    author: '',
    _id: '',
    locked: true,
    // the following will also be saved on the document list items
    proofId: '', // id of associated proof
    rawProof: '', // raw proof data, saved as reference for evaluating
    proofData: {}, // object of height, merkleRoot, and submittedAt
    requirePayment: false,
    wordCount: 0,
    likes: 0,
    dislikes: 0,
    boltwall: '',
  }),
  documentList: List([]),
  loading: true,
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

    case SET_CURRENT_LIKES: {
      const { likes } = payload
      return state.setIn(['currentDoc', 'likes'], likes)
    }

    case SET_CURRENT_DISLIKES: {
      const { dislikes } = payload
      return state.setIn(['currentDoc', 'dislikes'], dislikes)
    }

    case UPDATE_DOCUMENT: {
      const { docId, data } = payload
      // we need to replace a doc with the matching id in the array
      const index = state
        .get('documentList')
        .findIndex(doc => doc._id === docId)
      let documentList = state.get('documentList')

      // skip if not found
      if (index < 0) return state

      documentList = documentList.update(index, oldDoc => ({
        ...oldDoc,
        ...data,
      }))

      return state.set('documentList', documentList)
    }

    case SET_DOCS_LOADING:
      return state.set('loading', payload)

    default:
      return state
  }
}
