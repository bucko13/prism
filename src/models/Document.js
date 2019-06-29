import { Model } from 'radiks'
import assert from 'bsert'
import { encryptWithKey } from '../utils'
import { User, Key } from './index'

export default class Document extends Model {
  static className = 'Document'

  static schema = {
    // userId is used to get associated username and
    // encryption key information associated with our user
    // this is used for symmetrically encrypting and
    // decrypting the content. Will want to store a
    // decrypted version too that is asymmetrically
    // encrypted w/ app's pubKey
    userId: {
      type: String,
      decrypted: true,
    },

    title: {
      type: String,
      decrypted: true,
    },

    encryptedContent: {
      type: String,
      // even though this defaults to decrypted
      // we want to use different encryption scheme for
      // the content so it can be symmetrically decrypted by
      // the app server
      decrypted: true,
    },

    // content encrypted by user's private key
    // this way it is always readable by the user
    // for other users to conditionally read we have
    // the encryptedContent attr above
    content: String,

    // human-readable author name
    author: {
      type: String,
      decrypted: true,
    },

    link: {
      type: String,
      decrypted: true,
    },

    // this gets encrypted but can be retrieved by the app
    // by looking up the keyId and decrypting
    aesKey: String,

    keyId: {
      type: String,
      decrypted: true,
    },

    // this is the endpoint where the app can request invoices from
    node: {
      type: String,
      decrypted: true,
    },
  }

  async afterFetch() {
    await this.setupKey()
  }

  async encryptContent() {
    const { content } = this.attrs
    await this.setupKey()
    assert(this.attrs.aesKey, 'must set an aesKey on Document to encrypt')
    const encryptedContent = encryptWithKey(this.attrs.aesKey, content)
    await this.update({ encryptedContent })
  }

  async beforeSave() {
    assert(
      this.attrs.userId,
      'Document must have a User model associated with it. \
Make sure you pass userId attr when saving a Document model.'
    )

    // set user information and aesKey on save
    await this.setupKey()
  }

  async setupKey() {
    // can skip if already set
    if (this.attrs.aesKey) return

    const user = await User.findById(this.attrs.userId)

    // fetch the key information from the server
    const key = await Key.findById(user.attrs.keyId)
    if (!key)
      // eslint-disable-next-line no-console
      console.warn(
        `No key associated with id ${user.keyId} for user ${user.username}`
      )
    else {
      await this.update({ aesKey: key.attrs.aesKey, keyId: key._id })
    }
  }
}
