import assert from 'bsert'
import axios from 'axios'
import {
  SET_WORD_COUNT,
  SET_DOC_INFO,
  SET_INVOICE,
  UPDATE_TEXT,
  UPDATE_READ_COUNT,
} from '../constants'

export function setWordCount(count) {
  assert(typeof count === 'number')

  return {
    type: SET_WORD_COUNT,
    payload: count,
  }
}

export function getText(count) {
  return async (dispatch, getState) => {
    let filename
    try {
      if (!count && count !== 0) count = getState().reader.get('readIndex')

      filename = getState().reader.get('filename')
      if (!filename) throw new Error('No filename set')

      // text gets returned as an object that includes
      // the type (e.g. paragraph or heading). this just extracts the text
      const {
        data: { text },
      } = await axios.get(`/api/docs/${filename}/text?count=${count}`)
      return text
    } catch (e) {
      if (e.response && e.response.status === 402) {
        // eslint-disable-next-line no-console
        console.error(`Payment required to access ${filename}`)
        dispatch(resetText())
        return null
      } else console.error(e.message) // eslint-disable-line no-console
    }
  }
}

export function getDocInfo(filename) {
  return async dispatch => {
    assert(typeof filename === 'string', 'Expected a string for the filename')
    try {
      const { data } = await axios.get(`/api/docs/${filename}`)
      dispatch(
        setDocInfo({ title: data.title, filename, wordCount: data.count })
      )
      dispatch(updateText())
    } catch (e) {
      console.error(e.message) // eslint-disable-line no-console
    }
  }
}

export function setDocInfo({ title, filename, wordCount }) {
  return {
    type: SET_DOC_INFO,
    payload: {
      title,
      filename,
      wordCount,
    },
  }
}

export function updateReadCount(count) {
  return (dispatch, getState) => {
    assert(typeof count === 'number')
    const readCount = getState().reader.get('readCount')
    dispatch({
      type: UPDATE_READ_COUNT,
      payload: readCount + count,
    })
  }
}

export function updateText() {
  return async (dispatch, getState) => {
    let text = getState().reader.get('text')
    const index = getState().reader.get('readIndex')
    let count
    // if no text then the text still needs to be initialized
    if (!text) {
      text = await dispatch(getText())
      // usually this is if we hit the paywall after time runs out
      count = 0
    } else {
      // if we had text, then we replace it with the current next text
      count = text.split(/[\s\n]/g).length
      text = getState().reader.get('nextText')
    }

    const readIndex = index + 1
    // set nextText to the text at the next index, this
    // will cache the next set of text to make queries faster
    const nextText = await dispatch(getText(readIndex))

    // if nextText returns as null then we've probably hit our paywall
    if (!nextText) return

    dispatch(setText({ text, nextText, readIndex }))
    dispatch(updateReadCount(count))
  }
}

export function setText({ text, nextText, readIndex }) {
  return {
    type: UPDATE_TEXT,
    payload: {
      text,
      nextText,
      readIndex,
    },
  }
}

export function resetText() {
  return {
    type: UPDATE_TEXT,
    payload: {
      text: '',
      nextText: '',
    },
  }
}

export function setInvoice(invoice) {
  return {
    type: SET_INVOICE,
    payload: invoice,
  }
}
