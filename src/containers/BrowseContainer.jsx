import { connect } from 'react-redux'

import { documentActions, appActions } from '../store/actions'
import { BrowseComponent } from '../components'

function mapStateToProps(state) {
  return {
    documents: state.documents.get('documentList').toJS(),
    node: state.app.get('node'),
    loading: state.documents.get('loading'),
  }
}

function mapDispatchToProps(dispatch) {
  return {
    getDocumentList: () => {
      dispatch(documentActions.getDocumentList())
    },
    clearDocumentList: () => {
      dispatch(documentActions.clearDocumentList())
    },
    getNodeInfo: () => {
      dispatch(appActions.getNodeInfo())
    },
    getProofs: () => {
      dispatch(documentActions.getProofs())
    },
    setDocsLoading: () => {
      dispatch(documentActions.setDocsLoading())
    },
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(BrowseComponent)
