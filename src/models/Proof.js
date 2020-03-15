import { Model } from 'radiks'
import assert from 'bsert'
import SHA256 from 'bcrypto/lib/sha256-browser'
import { evaluateProofs } from 'chainpoint-client/dist/bundle.web'
import { put, post } from 'axios'

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

  /**
   * @function
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
    try {
      if (!hash) {
        hash = await this.getHash()
        await this.submitHash(hash)
      }
    } catch (e) {
      //eslint-disable-next-line no-console
      throw new Error(
        `Problem attempting to submit proof for document ${docId}: ${e.message}`
      )
    }
  }

  async getProofs() {
    const { proofHandles, hash } = this.attrs

    // skip if there are no proofHandles available
    if (!proofHandles.length && !this.attrs.proof) {
      // eslint-disable-next-line no-console
      console.warn(
        'Attempted to retrieve proofs without any proof handles. Resubmitting hash...'
      )
      await this.submitHash(hash)
      await this.save()
      return
    } else if (this.attrs.proof) {
      // if we already have a proof we want to evaluate whether or not it has expired
      // in which case we need to resubmit
      const { submittedAt } = this.evaluateProof()
      const timeSinceSubmit = Date.now() - new Date(submittedAt)
      if (timeSinceSubmit > 24 * 60 * 60 * 1000) {
        // eslint-disable-next-line no-console
        console.warn(`Calendar proof ${this._id} expired. Resubmitting...`)
        return await this.regenerateProof()
      }
    }

    const {
      data: { proofs },
    } = await put('/api/proofs', { proofHandles })

    // if no proofs but we had proof handles, then the handles probably
    // expired, so we need to re-submit the hash
    if (!proofs || !proofs.length) return await this.regenerateProof()

    // only need one of the proofs and only care about the btc/tbtc proof
    let proof
    let hasBtcProof = false
    // this will go through each proof returned from the handles
    // and save the last one or the first one that has a btc proof
    for (let { anchorsComplete, proof: rawProof } of proofs) {
      proof = rawProof
      if (anchorsComplete.includes('btc') || anchorsComplete.includes('tbtc')) {
        hasBtcProof = true
        break
      }
    }

    if (hasBtcProof) {
      // don't need the proofHandles anymore if we have a btc proof
      this.update({ proof, proofHandles: [] })
      await this.save()
    } else if (proof && proof !== this.attrs.proof) {
      // proof has been updated, usually when it newly includes a btcProof
      this.update({ proof })
      await this.save()
    } else if (!proof && proofs && proofs.length) {
      // this is usually the case when anchors have expired -
      // there is no raw proof but we did get proofs back from the endpoint

      // eslint-disable-next-line no-console
      console.warn(`Calendar proof ${this._id} expired. Resubmitting...`)
      await this.regenerateProof()
    } else if (!proof) {
      // eslint-disable-next-line no-console
      console.warn(`No proof data found for ${this._id} yet`)
    }
  }

  async regenerateProof() {
    const { hash } = this.attrs
    const _hash = hash || (await this.getHash())
    this.submitHash(_hash)
    await this.save()
  }

  /**
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

    // if there's no btc proof but at least one proof
    // we'll return the data from that proof (e.g. cal or tcal)
    if (!btcProof && proofs.length) {
      return {
        submittedAt: proofs[0].hash_received,
        type: proofs[0].type,
      }
    } else if (btcProof) {
      return {
        height: btcProof.anchor_id,
        merkleRoot: btcProof.expected_value,
        submittedAt: btcProof.hash_received,
        type: btcProof.type,
      }
    } else {
      throw new Error(
        'Problem evaluating proof. No btc proof and no proofs array to evaluate.'
      )
    }
  }

  /**
   * Utility function to get the hash of a document
   * @returns {String} SHA256 hash of all (encrypted) document attributes
   */
  async getHash() {
    let { docId } = this.attrs
    // we want the hash to be the encrypted version of content
    // even if it's our own, that way any user can verify w/o actually
    // knowing the contents
    const document = await Document.findById(docId, { decrypted: false })
    const attrs = JSON.stringify(document.attrs)

    return SHA256.digest(Buffer.from(attrs)).toString('hex')
  }

  /**
   * Submit a hash to the chainpoint network
   * @param {String} [hash] - hash of content to submit to Chainpoint and retrieve proof
   */
  async submitHash(hash) {
    const { docId } = this.attrs
    if (!hash) hash = await this.getHash()

    assert(typeof hash === 'string')
    assert(
      docId,
      'Must have a docId associated with Proof to submit and save hashes'
    )
    try {
      // handles are used to later retrieve proof information
      const {
        data: { proofHandles },
      } = await post('/api/proofs', {
        hashes: [hash],
      })

      // we will update with the hash but also initialize with empty
      // proof information.
      // NOTE: This means that saving a Proof with no hash will clear any other information
      // associated with the model. This is to avoid having a proof that does not match with the id
      this.update({ hash, proofHandles, proof: '' })

      const document = await Document.findById(docId)

      // now we want to make sure that the associated document has the id of this proof model
      // assocaited with it
      if (!document.attrs.proofId || document.attrs.proofID !== this._id) {
        document.update({ proofId: this._id })
        await document.save()
      }
    } catch (e) {
      //eslint-disable-next-line no-console
      console.error(
        `Problem attempting to submit proof for document ${docId}: ${e.message}`
      )
    }
  }
}
