import { connect } from 'react-redux'

import { documentActions } from '../store/actions'
import { Profile } from '../components'

function mapStateToProps(state) {
  return {
    documents: state.documents.get('documentList').toJS(),
  }
}

function mapDispatchToProps(dispatch) {
  return {
    getOwnDocuments: () => {
      dispatch(documentActions.getOwnDocuments())
    },
    clearDocumentList: () => {
      dispatch(documentActions.clearDocumentList())
    },
    updateDocumentProofs: () => {
      dispatch(documentActions.updateDocumentProofs())
    },
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Profile)
