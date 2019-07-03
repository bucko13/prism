import PropTypes from 'prop-types'

export const documentPropTypes = PropTypes.shape({
  _id: PropTypes.string,
  title: PropTypes.string,
  content: PropTypes.string,
  author: PropTypes.string,
  rawProof: PropTypes.string,
  proofId: PropTypes.string,
  proofData: proofDataPropTypes,
})

export const proofDataPropTypes = PropTypes.shape({
  merkleRoot: PropTypes.string.isRequired,
  submittedAt: PropTypes.string.isRequired,
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
})
