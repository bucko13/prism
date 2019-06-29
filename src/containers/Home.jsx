import { connect } from 'react-redux'

import { documentActions } from '../store/actions'
import { Home } from '../components'

function mapStateToProps(state) {
  return {
    documents: state.documents.get('documentList').toJS(),
  }
}

function mapDispatchToProps(dispatch) {
  return {
    getDocumentList: () => {
      dispatch(documentActions.getDocumentList())
    },
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Home)
