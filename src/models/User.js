import { Model, getConfig } from 'radiks'
import Key from './Key'
import assert from 'bsert'

export default class User extends Model {
  static className = 'User'

  static schema = {
    // username for the current user
    // will be set automatically before save
    username: {
      type: String,
      decrypted: true,
    },

    // lookup for the associated key for this user
    keyId: {
      type: String,
      decrypted: true,
    },

    // boltwall uri for the user to receive payments
    boltwall: {
      type: String,
      decrypted: true,
    },

    name: String,
  }

  async beforeSave() {
    const { userSession } = getConfig()
    const {
      username,
      profile: { name },
    } = userSession.loadUserData()
    assert(
      !this.attrs.username || this.attrs.username === username,
      "There is already a username set that doesn't match the current usersession"
    )

    if (!this.attrs.keyId) {
      // eslint-disable-next-line no-console
      console.warn(
        'Saving a user model without an associated keyId.',
        'Will not be able to encrypt content'
      )
    } else {
      const key = await Key.findById(this.attrs.keyId)
      this.key = key
    }
    this.update({ username, name })
  }
}
