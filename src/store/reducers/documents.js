import { Map, List } from 'immutable'

import {
  SET_DOCUMENT_LIST,
  SET_CURRENT_DOC,
  CLEAR_CURRENT_DOC,
  SET_CURRENT_CONTENT,
} from '../constants'

const init = Map({
  currentDoc: Map({
    title: '',
    content: '',
    author: '',
    docId: '',
    locked: true,
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

    default:
      return state
  }
}
