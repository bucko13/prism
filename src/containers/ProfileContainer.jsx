import { connect } from 'react-redux'

import { documentActions } from '../store/actions'
import { Profile } from '../components'

function mapStateToProps(state) {
  return {
    documents: state.documents.get('documentList').toJS(),
    loading: state.documents.get('loading'),
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
    setDocsLoading: loadingState => {
      dispatch(documentActions.setDocsLoading(loadingState))
    },
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Profile)
