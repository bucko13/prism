import assert from 'bsert'
import axios, { get } from 'axios'
import { getConfig } from 'radiks'
import { Lsat } from 'lsat-js'

import { Document, Proof } from '../../models'
import {
  SET_CURRENT_DOC,
  SET_DOCUMENT_LIST,
  CLEAR_CURRENT_DOC,
  SET_CURRENT_CONTENT,
  UPDATE_DOCUMENT,
  SET_DOCS_LOADING,
  SET_CURRENT_LIKES,
  SET_CURRENT_DISLIKES,
} from '../constants'
import { clearInvoice, setInvoice } from './invoice'
import { sleep } from '../../utils'

/*
 * Gets a list of document models from Radiks server
 * @param {Number} [count=10] - number of documents to populate state with
 * @returns {void} will dispatch an action to populate the state
 */
export function getDocumentList(count = 10) {
  return async dispatch => {
    dispatch(setDocsLoading(true))
    const { userSession } = getConfig()
    let documents

    if (userSession.isUserSignedIn()) {
      documents = await Document.fetchList({
        limit: count,
      })
      dispatch(setDocsFromModelList(documents.reverse()))
    } else {
      // if user is not signed in, we want to use the server's proxy
      // endpoint for retrieving documents rather than radiks
      const { data } = await get(`/api/radiks/documents?limit=${count}`)
      if (!(data && data.documents)) return
      documents = data.documents.reverse()
      dispatch(setDocumentList(documents))
    }
    dispatch(setDocsLoading(false))
    dispatch(getProofs())
  }
}

export function getOwnDocuments(count = 10) {
  return async dispatch => {
    dispatch(setDocsLoading(true))
    const documents = await Document.fetchOwnList({
      limit: count,
    })
    dispatch(setDocsFromModelList(documents.reverse()))
    dispatch(setDocsLoading(false))
    dispatch(updateDocumentProofs())
  }
}

function setDocsFromModelList(documents) {
  return dispatch => {
    const list = documents.map(
      ({
        attrs: { _id, author, title, proofId, rawProof, proofData, wordCount },
      }) => ({
        _id,
        author,
        title,
        proofId,
        rawProof,
        proofData,
        wordCount,
      })
    )
    dispatch(setDocumentList(list))
  }
}

export function setDocumentList(documents) {
  assert(Array.isArray(documents), 'Must pass an array to set document list')
  return {
    type: SET_DOCUMENT_LIST,
    payload: documents,
  }
}

/*
 * Gets the document that matches the ID. Only retrieves metadata
 * not the content
 * TODO: Update to go through payment flow
 * @param {String} docId - id of document to retrieve
 * @returns {void} will dispatch an action to populate the state
 */
export function getDocPreview(docId) {
  return async dispatch => {
    try {
      const {
        data: { preview },
      } = await get(`/api/radiks/preview/${docId}`)

      dispatch({
        type: SET_CURRENT_DOC,
        payload: {
          content: preview || '',
        },
      })
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Problem setting document:', e.message)
    }
  }
}

/*
 * Request permission and get cookie to read the currentDoc from state
 * @returns {void} dispatch action to set doc content
 */

export function getContent(docId) {
  return async (dispatch, getState) => {
    try {
      if (!docId) docId = getState().documents.getIn(['currentDoc', '_id'])
      const macaroon = getState().invoice.get('macaroon')
      let lsat, headers
      if (macaroon) {
        lsat = Lsat.fromMacaroon(macaroon)
        headers = {
          authorization: lsat.toToken(),
        }
      }

      const {
        data: { decryptedContent },
      } = await get(`/api/radiks/document/${docId}`, {
        headers,
      })

      dispatch({
        type: SET_CURRENT_CONTENT,
        payload: {
          content: decryptedContent,
          locked: false,
        },
      })

      // if the current doc requires payment then we want to start the
      // recursive loop which will eventually fail once the LSAT is expired
      if (getState().documents.getIn(['currentDoc', 'requirePayment'])) {
        await sleep(2000)
        await dispatch(getContent(docId))
      }
    } catch (e) {
      // if payment is required or the LSAT is expired/invalid
      if (
        (e.response && e.response.status === 402) ||
        e.response.status === 401
      ) {
        // eslint-disable-next-line no-console
        console.warn(
          'Attempted to retrieve document that requires payment without LSAT or invalid LSAT'
        )
        // want to make sure to clear the macaroon if we get a 402
        // since this only would have been returned if we had
        // one set but it was expired
        dispatch(clearInvoice())
        dispatch({
          type: SET_CURRENT_CONTENT,
          payload: {
            content: '',
            locked: true,
          },
        })
        dispatch(getDocPreview(docId))
      }
      // eslint-disable-next-line no-console
      else console.error('Problem unlocking content: ', e.message)
    }
  }
}

/*
 * An action creator that will get the proof for each document in the
 * store's current list, run a getProofs, and if that proof has an anchor
 * evaluate it and update the document with the height, merkleRoot, and submittedAt
 * NOTE: this should only be run by the user who owns the document. Saving the proof
 * otherwise should actually fail since `beforeSave` updates the document, which shouldn't work
 * for a user that doesn't own the document
 */

export function updateDocumentProofs() {
  return async (dispatch, getState) => {
    const documents = getState().documents.get('documentList')
    return Promise.all(
      documents.map(async doc => {
        // first if there's no proofId then we need to create a new proof
        // and save it w/ the document this will start the anchoring process
        try {
          if (!doc.proofId) {
            const proof = await generateProof(doc._id)
            return dispatch(updateDocument(doc._id, { proofId: proof._id }))
          } else if (!doc.proofData) {
            // if no proof data then we need to retrieve the associated proof
            let proof = await Proof.findById(doc.proofId)

            if (!proof) proof = await generateProof(doc._id)

            // if the proof has no raw proof attr attached to it (or an empty one)
            // or it has a proof but still has proof handles
            // then we need to use the proofHandles to re-fetch the proof
            // from chainpoint and see if there were any updates
            // proofHandles should get cleared once we have a btc anchor
            if (
              !proof.attrs.proof ||
              !proof.attrs.proof.length ||
              proof.attrs.proofHandles.length
            )
              await proof.getProofs()

            // evaluate the raw proof to extract the relevant data
            const proofData = proof.evaluateProof()

            return dispatch(
              updateDocument(doc._id, {
                rawProof: proof.attrs.proof,
                proofData,
              })
            )
          }
        } catch (e) {
          //eslint-disable-next-line no-console
          console.error(
            `Problem updating document proof for "${doc.title}": ${e.message}`
          )
          // if we caught a problem, then set the proof info to empty
          return dispatch(
            updateDocument(doc._id, {
              rawProof: '',
              proofData: null,
            })
          )
        }
      })
    )
  }
}

async function generateProof(docId) {
  assert(docId, 'need a document id to generate associated proof')
  const proof = new Proof({ docId })
  await proof.save()
  if (!proof.attrs.proofHandles)
    throw new Error('Could not retrieve proofs from Chainpoint')
  return proof
}

/*
 * This will primarily be for updating document list for proof data
 * but not actually creating the proofs
 * @returns {<Promise>} returns a Promise.all where each Promise resolves
 * to dispatch an update to the document in the list with the updated proof
 */
export function getProofs() {
  return (dispatch, getState) => {
    const documents = getState().documents.get('documentList')
    const { userSession } = getConfig()
    const userIsSignedIn = userSession.isUserSignedIn()
    return Promise.all(
      documents.map(async doc => {
        // if no proofId then the owner still needs to update it themselves
        // so we will add this doc to the list as is
        // if it has proofData then we don't need to update it
        if (!doc.proofId || doc.proofData) return
        // no raw proof but there is a proofId, so we can add this locally ourselves
        else if (!doc.rawProof && !doc.proofData) {
          let rawProof, proofData
          if (userIsSignedIn) {
            const proof = await Proof.findById(doc.proofId)
            rawProof = proof.attrs.proof
            proofData = proof.evaluateProof()
          } else {
            const { data } = await get(`/api/radiks/proof?id=${doc.proofId}`)
            if (!data.proof) {
              // there was a problem getting the proof so lets just set to empty
              proofData = null
              rawProof = ''
            } else {
              rawProof = data.proof
              const proof = new Proof({ proof: rawProof })
              proofData = proof.evaluateProof()
            }
          }
          return dispatch(updateDocument(doc._id, { rawProof, proofData }))
        }
      })
    )
  }
}

export function getPostMetadata(docId) {
  return async dispatch => {
    const {
      data: {
        author,
        title,
        requirePayment,
        wordCount,
        boltwall,
        likes,
        dislikes,
      },
    } = await get(`/api/metadata/${docId}`)

    dispatch({
      type: SET_CURRENT_DOC,
      payload: {
        author,
        _id: docId,
        title,
        requirePayment,
        wordCount,
        boltwall,
      },
    })

    dispatch(setCurrentLikes(likes))
    dispatch(setCurrentDislikes(dislikes))
  }
}

/**
 * @description Tipping action creator which takes a payment hash and likes/dislike count
 * This will make a request to update the tips count that it expects to fail with a 402.
 * The returned LSAT is used to set the invoice information so the user can pay it. The action
 * creator will keep on sending the request with the LSAT until successful after which
 * it will update the likes/dislikes accordingly.
 * @param {string} paymentHash - payment hash used to generate the hodl invoice
 * @param {string} type - One of "like" or "dislike"
 * @param {number} count - How much to update the like/dislike count by
 */

export function updateTips(paymentHash, type, count) {
  assert(typeof paymentHash === 'string' && paymentHash.length === 64)
  assert(
    type === 'likes' || type === 'dislikes',
    'Type must be either "likes" or "dislikes"'
  )
  assert(count >= 0 && typeof count === 'number')

  return async (dispatch, getState) => {
    let lsat, docId
    // first call to PUT tips will throw a 402 returning an LSAT
    try {
      docId = getState().documents.getIn(['currentDoc', '_id'])
      await axios.put(`/api/tips/${docId}`, {
        [type]: count,
        paymentHash,
      })
    } catch (e) {
      // make sure we got the 402 in response
      if (!e.response && e.response.status !== 402)
        throw new Error('PUT /tips should have returned a 402 response')

      // get the token from the response header
      lsat = Lsat.fromHeader(e.response.headers['www-authenticate'])

      // set state's invoice from the lsat so user can pay
      dispatch(
        setInvoice({
          invoice: lsat.invoice,
          invoiceId: lsat.paymentHash,
        })
      )
    }

    // next we will poll the PUT /tips endpoint with our LSAT
    // in the header until it succeeds or the timer is up.
    // When it does we update tips.
    let timer = 0,
      success = false,
      response
    while (timer < 15 && !success) {
      try {
        const options = {
          method: 'put',
          url: `/api/tips/${docId}`,
          data: {
            [type]: count,
          },
          headers: {
            authorization: lsat.toToken(),
          },
        }
        response = await axios(options)
        success = true
      } catch (e) {
        // keep looping unless we did not receive a 402 response
        if (e.response.status !== 402) {
          throw new Error(`Unexpected response from server.`)
        }
        await sleep(1000)
        timer++
      }
    }
    const likes = response?.data.likes
    const dislikes = response?.data.dislikes
    dispatch(setCurrentLikes(likes))
    dispatch(setCurrentDislikes(dislikes))
  }
}

export function setCurrentLikes(likes = 0) {
  return {
    type: SET_CURRENT_LIKES,
    payload: {
      likes: parseInt(likes, 10),
    },
  }
}

export function setCurrentDislikes(dislikes = 0) {
  return {
    type: SET_CURRENT_DISLIKES,
    payload: {
      dislikes: parseInt(dislikes, 10),
    },
  }
}

export function updateDocument(docId, data) {
  return {
    type: UPDATE_DOCUMENT,
    payload: {
      docId,
      data,
    },
  }
}

export function clearCurrentDoc() {
  return {
    type: CLEAR_CURRENT_DOC,
  }
}

export function clearDocumentList() {
  return dispatch => dispatch(setDocumentList([]))
}

export function setDocsLoading(loadingState) {
  return {
    type: SET_DOCS_LOADING,
    payload: loadingState,
  }
}
