import { Map } from 'immutable'

import {
  SET_WORD_COUNT,
  SET_DOC_INFO,
  UPDATE_TEXT,
  SET_INVOICE,
  UPDATE_READ_COUNT,
} from '../constants'

const init = Map({
  text: '',
  nextText: '',
  wordCount: 0,
  readCount: 0,
  readIndex: 0,
  title: '',
  filename: '',
  invoice: '',
})

export default (state = init, action) => {
  const { payload, type } = action
  switch (type) {
    case SET_WORD_COUNT:
      return state.set('wordCount', payload)
    case SET_DOC_INFO: {
      const { title, filename, wordCount } = payload
      return state.merge({
        title,
        filename,
        wordCount,
      })
    }
    case UPDATE_TEXT: {
      let { text, nextText, readIndex } = payload
      if (!readIndex) readIndex = state.get('readIndex')
      return state.merge({
        text,
        nextText,
        readIndex,
      })
    }
    case SET_INVOICE:
      return state.set('invoice', payload)
    case UPDATE_READ_COUNT:
      return state.set('readCount', payload)
    default:
      return state
  }
}
