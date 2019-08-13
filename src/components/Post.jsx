import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { Header, Button } from 'semantic-ui-react'
import marked from 'marked'
import DOMPurify from 'dompurify'

import { estimateReadingTime } from '../utils'
import InvoiceModal from './InvoiceModal.jsx'

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
      requirePayment: PropTypes.bool,
      node: PropTypes.string,
      wordCount: PropTypes.number.isRequired,
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
    const { getContent } = this.props
    await getContent()
  }

  componentDidUpdate(prevProps) {
    const { invoiceStatus, getContent, locked, requirePayment } = this.props

    if (!requirePayment) return
    // if the invoice status updates to 'paid' or it's not locked
    // then we want to do a request to get the post content which will loop until
    // status changes
    if (
      (prevProps.invoiceStatus !== 'paid' && invoiceStatus === 'paid') ||
      !locked
    ) {
      getContent()
    }
  }

  render() {
    const {
      title,
      author,
      content,
      wordCount,
      locked,
      requirePayment,
      seconds,
      modalOpen,
      rate,
      invoice,
      changeSeconds,
      requestInvoice,
      closeModal,
      initializeModal,
    } = this.props
    const cleanContent = DOMPurify.sanitize(content)
    return (
      <div>
        <Header as="h2">{title}</Header>
        <Header as="h4">By: {author}</Header>
        <div
          className={`post-container${
            locked && requirePayment ? ' preview' : ''
          }`}
        >
          <div
            className="container mb-5 p-2"
            style={{ textAlign: 'justify' }}
            dangerouslySetInnerHTML={{
              __html: marked(cleanContent),
            }}
          />
        </div>
        {locked && requirePayment ? (
          <React.Fragment>
            {wordCount > 0 ? (
              <p>
                {wordCount} words | Reading Time: ~
                {estimateReadingTime(wordCount)} minutes
              </p>
            ) : (
              <p>
                <small>(Word count not available for this post)</small>
              </p>
            )}
            <p>
              This content is currently protected. Purchase time in order to
              continue reading.
            </p>
            <Button onClick={() => initializeModal()}>Purchase Time</Button>
          </React.Fragment>
        ) : (
          ''
        )}
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
