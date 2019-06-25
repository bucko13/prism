import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Loader, Header, Dimmer } from 'semantic-ui-react'

import { Post } from '../components'
import { documentActions, invoiceActions } from '../store/actions'

class PostContainer extends PureComponent {
  constructor(props) {
    super(props)
  }

  static get propTypes() {
    return {
      document: PropTypes.shape({
        title: PropTypes.string.isRequired,
        content: PropTypes.string.isRequired,
        author: PropTypes.string.isRequired,
        docId: PropTypes.string.isRequired,
      }),
      location: PropTypes.shape({
        search: PropTypes.string.isRequired,
      }).isRequired,
      seconds: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      modalOpen: PropTypes.bool.isRequired,
      rate: PropTypes.number.isRequired,
      invoice: PropTypes.string.isRequired,
      invoiceStatus: PropTypes.string,
      initializeModal: PropTypes.func.isRequired,
      closeModal: PropTypes.func.isRequired,
      setCurrentDoc: PropTypes.func.isRequired,
      clearCurrentDoc: PropTypes.func.isRequired,
      getContent: PropTypes.func.isRequired,
      requestInvoice: PropTypes.func.isRequired,
      changeSeconds: PropTypes.func.isRequired,
      checkInvoiceStatus: PropTypes.func.isRequired,
    }
  }

  componentDidMount() {
    const {
      setCurrentDoc,
      location: { search },
    } = this.props
    let index = search.indexOf('id=')
    const docId = location.search.slice(index + 3)
    setCurrentDoc(docId)
  }

  componentWillUnmount() {
    this.props.clearCurrentDoc()
  }

  render() {
    const {
      document,
      getContent,
      seconds,
      modalOpen,
      rate,
      invoice,
      initializeModal,
      closeModal,
      requestInvoice,
      changeSeconds,
      checkInvoiceStatus,
      invoiceStatus,
    } = this.props
    // if still retrieving the document information
    // return the loader
    if (!document || !document.title.length)
      return (
        <Dimmer active inverted>
          <Header as="h4">Getting post...</Header>
          <Loader size="large" />
        </Dimmer>
      )

    // otherwise show the Post component with the document information
    // TODO: setup pagination for this to enable the paywall functionality
    return (
      <Post
        {...document}
        getContent={() => getContent()}
        seconds={seconds}
        modalOpen={modalOpen}
        rate={rate}
        invoice={invoice}
        initializeModal={modalState => initializeModal(modalState)}
        closeModal={() => closeModal()}
        requestInvoice={() => requestInvoice()}
        changeSeconds={e => changeSeconds(e)}
        checkInvoiceStatus={() => checkInvoiceStatus()}
        invoiceStatus={invoiceStatus}
      />
    )
  }
}

function mapStateToProps(state) {
  return {
    document: state.documents.get('currentDoc').toJS(),
    modalOpen: state.invoice.get('visible'),
    seconds: state.invoice.get('seconds'),
    rate: state.invoice.get('rate'),
    invoice: state.invoice.get('invoice'),
    invoiceStatus: state.invoice.get('status'),
  }
}

function mapDispatchToProps(dispatch) {
  return {
    setCurrentDoc: docId => {
      dispatch(documentActions.setCurrentDoc(docId))
    },
    clearCurrentDoc: () => {
      dispatch(documentActions.clearCurrentDoc())
    },
    getContent: () => {
      dispatch(documentActions.getContent())
    },
    initializeModal: modalState => {
      dispatch(invoiceActions.initializeModal(modalState))
    },
    closeModal: () => {
      dispatch(invoiceActions.closeModal())
    },
    requestInvoice: () => {
      dispatch(invoiceActions.requestInvoice())
    },
    changeSeconds: e => {
      dispatch(invoiceActions.changeSeconds(e.target.value))
    },
    checkInvoiceStatus: () => {
      dispatch(invoiceActions.checkInvoiceStatus())
    },
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(PostContainer)
