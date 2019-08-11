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

    keyId: {
      type: String,
      decrypted: true,
    },

    proofId: {
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

    // this is the endpoint where the app can request invoices from
    node: {
      type: String,
      decrypted: true,
    },

    requirePayment: {
      type: Boolean,
      decrypted: true,
    },

    // this is used for managing third party macaroons
    // between the remote lightning node that protects
    // this document and the app server that checks auth.
    // Similar to the content, this is saved in a decrypted state
    // but is similarly encrypted with the app pub key.
    caveatKey: {
      type: String,
      decrypted: true,
    },
  }

  async afterFetch() {
    await this.setupKey()
  }

  // this will encrypt the content as well as the caveat key
  // both of which need to be secretly shared with the app server
  async encryptContent() {
    const { content } = this.attrs
    await this.setupKey()
    assert(
      this.attrs.aesKey,
      'Must set an aesKey on document to encrypt content'
    )
    const encryptedContent = encryptWithKey(this.attrs.aesKey, content)
    this.update({ encryptedContent })

    // lets confirm that there is also a caveat key
    // (the ln node server passphrase) saved if we have a node
    const { node, caveatKey } = this.attrs
    if (node) {
      assert(caveatKey, 'Must have a caveat key when setting a node.')
      const encryptedCaveat = encryptWithKey(this.attrs.aesKey, caveatKey)
      this.update({ caveatKey: encryptedCaveat })
    }
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
    assert(this.attrs.userId, 'No associated userId added with this document')
    // can skip if already set
    if (this.attrs.aesKey) return

    const user = await User.findById(this.attrs.userId)
    assert(user, 'No user found matching the id connected with this document.')
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
