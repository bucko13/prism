import { connect } from 'react-redux'

import { readerActions } from '../store/actions'
import { Reader } from '../components'

function mapStateToProps(state) {
  return { wordCount: state.reader.get('wordCount') }
}

function mapDispatchToProps(dispatch) {
  return {
    setWordCount: count => {
      dispatch(readerActions.setWordCount(count))
    },
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Reader)
