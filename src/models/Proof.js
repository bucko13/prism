import { Model } from 'radiks'
import assert from 'bsert'
import SHA256 from 'bcrypto/lib/sha256-browser'
import {
  submitHashes,
  getProofs,
  evaluateProofs,
} from 'chainpoint-client/dist/bundle.web'

import { Document } from './index'

export default class Proof extends Model {
  static className = 'Proof'

  static schema = {
    docId: {
      type: String,
      decrypted: true,
    },

    hash: {
      type: String,
      decrypted: true,
    },

    proofHandles: {
      type: Array,
      decrypted: true,
    },

    proof: {
      type: String,
      decrypted: true,
    },
  }

  /*
   * Handles a couple checks and updates that are needed when saving a proof
   * Throws if there is no docId in the attrs. Can't do anything without a doc!
   * If there is a hash associated with this proof, then we don't need to do anything
   * If there is no hash, then we need to get the document, create the sha256 hash,
   * submit the hash to the chainpoint network, and then update the model with the hash
   * and proof handles for future lookup.
   * If the document that was hashed has not been linked with the proof, then update
   * doc model with the id of this Proof
   */
  async beforeSave() {
    let { docId, hash } = this.attrs
    assert(docId, 'Must save a proof with an associated document ID')
    // if there's no hash but we do have the doc ID then
    // let's retrieve the doc with this id and create the hash
    if (!hash) {
      // we want the hash to be the encrypted version of content
      // even if it's our own, that way any user can verify w/o actually
      // knowing the contents
      const document = await Document.findById(docId, { decrypted: false })
      const attrs = JSON.stringify(document.attrs)

      hash = SHA256.digest(Buffer.from(attrs)).toString('hex')

      // handles are used to later retrieve proof information
      const proofHandles = await submitHashes([hash])

      // we will update with the hash but also initialize with empty
      // proof information.
      // NOTE: This means that saving a Proof with no hash will clear any other information
      // associated with the model. This is to avoid having a proof that does not match with the id
      this.update({ hash, proofHandles, proof: '' })

      // now we want to make sure that the associated document has the id of this proof model
      // assocaited with it
      if (!document.attrs.proofId || document.attrs.proofID !== this._id) {
        document.update({ proofId: this._id })
        await document.save()
      }
    }
  }

  async getProofs() {
    const { proofHandles } = this.attrs
    // skip if there are no proofHandles available
    if (!proofHandles.length) {
      // eslint-disable-next-line no-console
      console.warn('Attempted to get proofs for a proof with no proofHandles.')
      return
    }

    const proofs = await getProofs(proofHandles)

    // if no proofs yet then just return
    // TODO/TOCHECK: Do we want re-submit if there are no proofs
    // since this could be the result of cal expiring and our losing access to the proof for retrieval?
    if (!proofs || !proofs.length) return

    // only need one of the proofs and only care about the btc/tbtc proof
    let proof

    for (let { anchorsComplete, proof: rawProof } of proofs) {
      if (anchorsComplete.includes('btc') || anchorsComplete.includes('tbtc')) {
        proof = rawProof
        break
      }
    }

    if (proof) {
      // don't need the proofHandles anymore if we have a proof
      this.update({ proof, proofHandles: [] })
      await this.save()
    }
  }

  /*
   * a wrapper around the evaluate proof method from the chainpoint client
   * @returns {Object|null} proof -  if raw proof exists, will return an object with relevant data
   * @returns {Number|String} proof.height - block height where proof was anchored to
   * @returns {String} proof.merkleRoot - merkle root expected at that block height (match with block
   * to verify proof)
   * @returns {String} proof.submittedAt - the date the proof was submitted to a core
   */

  evaluateProof() {
    const { proof } = this.attrs

    // return null if no proof to evaluate
    if (!proof) return null

    const proofs = evaluateProofs([proof])

    const btcProof = proofs.find(
      ({ type }) => type === 'tbtc' || type === 'btc'
    )

    if (!btcProof) return null

    return {
      height: btcProof.anchor_id,
      merkleRoot: btcProof.expected_value,
      submittedAt: btcProof.hash_submitted_core_at,
    }
  }
}
