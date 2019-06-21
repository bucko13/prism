import { Model, getConfig } from 'radiks'
import assert from 'bsert'
import { encryptWithKey } from '../utils'
import Key from './Key'

export default class Document extends Model {
  static className = 'Document'

  static schema = {
    // this is used for symmetrically encrypting and
    // decrypting the content. Will want to store a
    // decrypted version too that is asymmetrically
    // encrypted w/ app's pubKey
    keyId: {
      type: String,
      decrypted: true,
    },

    title: {
      type: String,
      decrypted: true,
    },

    content: {
      type: String,
      // even though this defaults to decrypted
      // we want to use different encryption scheme for
      // the content so it can be symmetrically decrypted by
      // the app server
      decrypted: true,
    },

    // human-readable author name
    author: {
      type: String,
      decrypted: true,
    },

    username: {
      type: String,
      decrypted: true,
    },

    link: {
      type: String,
      decrypted: true,
    },
  }

  async afterFetch() {
    // fetch the key information from the server
    const key = await Key.fetch(this.attrs.keyId)
    assert(key, `No key associated with id ${this.attrs.keyId}`)
    this.key = key.attrs.aesKey
  }

  encryptContent() {
    const { content } = this.attrs

    assert(this.aesKey, 'must set an aesKey on Document to encrypt')
    const encryptedContent = encryptWithKey(this.aesKey, content)
    this.update({ content: encryptedContent })
  }

  beforeSave() {
    const { userSession } = getConfig()
    const { username } = userSession.loadUserData()
    this.update({ username })
  }
}
