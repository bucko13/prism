import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Loader, Header, Dimmer } from 'semantic-ui-react'
import qs from 'qs'

import { Post } from '../components'
import { AddOrEditDocContainer } from '.'
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
        _id: PropTypes.string.isRequired,
        wordCount: PropTypes.number.isRequired,
        likes: PropTypes.number.isRequired,
        dislikes: PropTypes.number.isRequired,
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
      getPostMetadata: PropTypes.func.isRequired,
      getRate: PropTypes.func.isRequired,
      setInvoice: PropTypes.func.isRequired,
      setCurrentLikes: PropTypes.func.isRequired,
      setCurrentDislikes: PropTypes.func.isRequired,
      clearInvoice: PropTypes.func.isRequired,
    }
  }

  componentDidMount() {
    const {
      setCurrentDoc,
      getPostMetadata,
      getRate,
      location: { search },
    } = this.props
    const { id } = qs.parse(search, { ignoreQueryPrefix: true })
    setCurrentDoc(id)
    getPostMetadata(id)
    getRate()
  }

  componentWillUnmount() {
    this.props.clearCurrentDoc()
  }

  render() {
    const {
      document,
      location,
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
      setInvoice,
      setCurrentLikes,
      setCurrentDislikes,
      clearInvoice,
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
    const { search } = location

    const { edit } = qs.parse(search, { ignoreQueryPrefix: true })

    if (edit) return <AddOrEditDocContainer edit docId={document._id} />
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
        checkInvoiceStatus={checkInvoiceStatus}
        invoiceStatus={invoiceStatus}
        setInvoice={setInvoice}
        setCurrentLikes={setCurrentLikes}
        setCurrentDislikes={setCurrentDislikes}
        clearInvoice={clearInvoice}
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
    getPostMetadata: docId => {
      dispatch(documentActions.getPostMetadata(docId))
    },
    getContent: () => {
      dispatch(documentActions.getContent())
    },
    setCurrentLikes: likes => {
      dispatch(documentActions.setCurrentLikes(likes))
    },
    setCurrentDislikes: likes => {
      dispatch(documentActions.setCurrentLikes(likes))
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
    checkInvoiceStatus: (tries, timeout, node) => {
      dispatch(invoiceActions.checkInvoiceStatus(tries, timeout, node))
    },
    getRate: () => {
      dispatch(invoiceActions.getRate())
    },
    setInvoice: (invoice, invoiceId, status) => {
      dispatch(invoiceActions.setInvoice(invoice, invoiceId, status))
    },
    clearInvoice: () => {
      dispatch(invoiceActions.clearInvoice())
    },
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(PostContainer)
