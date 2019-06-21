import { Model, getConfig } from 'radiks'
import assert from 'bsert'
import { generateRandomKey } from '../utils'
import { encryptECIES } from 'blockstack/lib/encryption'

// TODO: Confirm if there's a way to make sure there's only one Key model
// for each user.
export default class Key extends Model {
  static className = 'Key'

  static schema = {
    encryptedKey: {
      type: Object,
      // even though "decrypted" is true
      // this key should be encrypted with the
      // app's public key
      decrypted: true,
    },
    // this should be added normally
    // but radiks will encrypt it
    aesKey: String,

    username: {
      type: String,
      decrypted: true,
    },
  }

  generateKey() {
    assert(
      !this.attrs.aesKey || !this.attrs.aesKey.length,
      'Attempting to overwrite an existing key. \
      If current key is not backed up, all data encrypted with it will be lost.'
    )

    const aesKey = generateRandomKey()
    this.update({ aesKey, encryptedKey: '' })
  }

  encryptKey(pubKey) {
    const { aesKey } = this.attrs
    assert(typeof pubKey === 'string', 'Need a pubkey to encrypt aesKey')
    assert(
      aesKey && aesKey.length,
      'Must have an aesKey set in order to encrypt it. Run key.generateKey() first.'
    )
    const encryptedKey = encryptECIES(pubKey, aesKey)
    this.update({ encryptedKey })
  }

  // TODO: May want to decide if this isn't automatic?
  // this likely needs to always be available at least
  // for documents that want the possibility to be public
  // otherwise the app has no way to look up the decryption key
  beforeSave() {
    const { userSession } = getConfig()
    const { username } = userSession.loadUserData()
    this.update({ username })
  }
}
