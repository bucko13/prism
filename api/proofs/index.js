const { submitHashes, getProofs } = require('chainpoint-client/index')
const app = require('../index.js')

app.post('/api/proofs', async (req, res) => {
  let { hashes } = req.body
  if (
    !Array.isArray(hashes) &&
    typeof hashes === 'string' &&
    hashes.length === 64
  ) {
    // if we got sent a single hash, which we can guess is in the proper
    // format based on its length, then just put it into an array
    hashes = [hashes]
  } else if (!Array.isArray(hashes)) {
    return res
      .status(400)
      .json({ message: 'Hashes sent with incorrect formatting' })
  }

  try {
    const proofHandles = await submitHashes(hashes)
    res.status(200).json({ proofHandles })
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

app.put('/api/proofs', async (req, res) => {
  let { proofHandles } = req.body
  if (!Array.isArray(proofHandles)) {
    return res.status(400).json({
      message:
        'Proof Handles sent in unknown format. Must pass an array of handles',
    })
  }

  try {
    const proofs = await getProofs(proofHandles)
    res.status(200).json({ proofs })
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

module.exports = app
