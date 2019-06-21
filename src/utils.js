import aes from 'bcrypto/lib/aes-browser'
import { randomBytes } from 'bcrypto/lib/random'
import assert from 'bsert'

export function encryptWithKey(key, data) {
  assert(key && typeof key === 'string')
  const iv = randomBytes(16)
  const cipher = aes.encipher(Buffer.from(data), Buffer.from(key, 'hex'), iv)
  return cipher.toString('hex') + ':::' + iv.toString('hex')
}

/*
 * @param {Number} [length=32] - number of bytes to make key
 * @returns {String} key - a key of [length] random bytes
 */
export function generateRandomKey(length = 32) {
  return randomBytes(length).toString('hex')
}
