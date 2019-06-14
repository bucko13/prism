import { Map } from 'immutable'

import { SET_WORD_COUNT } from '../constants'

const init = Map({
  text: null,
  nextText: null,
  wordCount: 0,
  readCount: 0,
  readIndex: 0,
  doc: {},
})

export default (state = init, action) => {
  const { payload, type } = action
  switch (type) {
    case SET_WORD_COUNT:
      return state.set('wordCount', payload)
    default:
      return state
  }
}
