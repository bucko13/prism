import { connect } from 'react-redux'

import { documentActions, userActions } from '../store/actions'
import { Profile } from '../components'

function mapStateToProps(state) {
  return {
    documents: state.documents.get('documentList').toJS(),
    loading: state.documents.get('loading'),
    boltwall: state.user.get('boltwall'),
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
    getBoltwallUri: () => {
      dispatch(userActions.getBoltwallUri())
    },
    saveBoltwallUri: uri => {
      dispatch(userActions.saveBoltwallUri(uri))
    },
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Profile)
