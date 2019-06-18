import { connect } from 'react-redux'

import { readerActions } from '../store/actions'
import { Reader } from '../components'

function mapStateToProps(state) {
  return {
    wordCount: state.reader.get('wordCount'),
    filename: state.reader.get('filename'),
    title: state.reader.get('title'),
    invoice: state.reader.get('invoice'),
    readIndex: state.reader.get('readIndex'),
    readCount: state.reader.get('readCount'),
    text: state.reader.get('text'),
  }
}

function mapDispatchToProps(dispatch) {
  return {
    updateText: () => {
      dispatch(readerActions.updateText())
    },
    getDocInfo: filename => {
      dispatch(readerActions.getDocInfo(filename))
    },
    setDocInfo: filename => {
      dispatch(readerActions.setDocInfo(filename))
    },
    setInvoice: filename => {
      dispatch(readerActions.setInvoice(filename))
    },
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Reader)
