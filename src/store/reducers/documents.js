import { Map, List } from 'immutable'

import {
  SET_DOCUMENT_LIST,
  SET_CURRENT_DOC,
  CLEAR_CURRENT_DOC,
} from '../constants'

const init = Map({
  currentDoc: Map({
    title: '',
    content: '',
    author: '',
    docId: '',
  }),
  documentList: List([]),
})

export default (state = init, action) => {
  const { type, payload } = action

  switch (type) {
    case SET_DOCUMENT_LIST: {
      return state.set('documentList', List(payload))
    }

    case SET_CURRENT_DOC:
      return state.set('currentDoc', Map(payload))

    case CLEAR_CURRENT_DOC:
      return state.set('currentDoc', init.get('currentDoc'))

    default:
      return state
  }
}
