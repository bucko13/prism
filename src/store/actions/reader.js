import assert from 'bsert'
import { SET_WORD_COUNT } from '../constants'

export function setWordCount(count) {
  assert(typeof count === 'number')

  return {
    type: SET_WORD_COUNT,
    payload: count,
  }
}
