import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { Header, Button } from 'semantic-ui-react'

import InvoiceModal from './InvoiceModal.jsx'
import { sleep } from '../utils'

export default class Post extends PureComponent {
  constructor(props) {
    super(props)
  }

  static get propTypes() {
    return {
      title: PropTypes.string,
      content: PropTypes.string,
      author: PropTypes.string,
      locked: PropTypes.bool,
      node: PropTypes.string,
      seconds: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      modalOpen: PropTypes.bool.isRequired,
      invoice: PropTypes.string.isRequired,
      rate: PropTypes.number,
      invoiceStatus: PropTypes.string,
      getContent: PropTypes.func.isRequired,
      requestInvoice: PropTypes.func.isRequired,
      changeSeconds: PropTypes.func.isRequired,
      closeModal: PropTypes.func.isRequired,
      initializeModal: PropTypes.func.isRequired,
      checkInvoiceStatus: PropTypes.func.isRequired,
    }
  }

  async componentDidMount() {
    const { getContent, locked } = this.props
    await getContent()
    // if in an unlocked state, need to start checkStatus loop
    // this should usually be initialized to locked, but good to add
    // the check
    if (!locked) this.checkStatus()
  }

  componentDidUpdate(prevProps) {
    const { invoiceStatus, getContent, locked } = this.props
    // if the invoice status updates to 'paid'
    // then we want to do a request to get the post content
    if (prevProps.invoiceStatus !== 'paid' && invoiceStatus === 'paid') {
      getContent()
    } else if (!locked) {
      // if content is in an unlocked state then we want to run a loop
      // that keeps checking content status in case time has run out
      this.checkStatus()
    }
  }

  async checkStatus() {
    const { locked, getContent } = this.props
    if (!locked) {
      await sleep(500)
      getContent()
      this.checkStatus()
    }
  }

  render() {
    const {
      title,
      author,
      content,
      locked,
      seconds,
      modalOpen,
      rate,
      invoice,
      changeSeconds,
      requestInvoice,
      closeModal,
      initializeModal,
    } = this.props
    return (
      <div>
        <Header as="h2">{title}</Header>
        <Header as="h4">By: {author}</Header>
        <div className="post-container">
          {locked ? (
            <React.Fragment>
              <p>
                [This content is currently protected. You must purchase reading
                time in order to view content.]
              </p>
              <Button onClick={() => initializeModal()}>Purchase Time</Button>
            </React.Fragment>
          ) : (
            <p>{content}</p>
          )}
        </div>
        <InvoiceModal
          title={title}
          seconds={seconds}
          modalOpen={modalOpen}
          rate={rate}
          invoice={invoice}
          initializeModal={() => initializeModal()}
          closeModal={() => closeModal()}
          requestInvoice={() => requestInvoice()}
          changeSeconds={seconds => changeSeconds(seconds)}
        />
      </div>
    )
  }
}
