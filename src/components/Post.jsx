import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import {
  Header,
  Button,
  Label,
  Icon,
  Segment,
  Input,
  Loader,
} from 'semantic-ui-react'
import marked from 'marked'
import DOMPurify from 'dompurify'
import { post, put, get } from 'axios'
import assert from 'bsert'

import { estimateReadingTime } from '../utils'
import InvoiceModal from './InvoiceModal.jsx'

export default class Post extends PureComponent {
  state = {
    showDialogue: false,
    type: null,
    count: 0,
    loading: false,
    error: false,
  }
  rates = {
    tips: {
      rate: 0,
      units: 'satoshis/tip',
      fee: 0,
    },
  }
  satsPerBtc = 0.00000001
  constructor(props) {
    super(props)
  }

  static get propTypes() {
    return {
      title: PropTypes.string,
      _id: PropTypes.string.isRequired,
      content: PropTypes.string,
      author: PropTypes.string,
      locked: PropTypes.bool,
      requirePayment: PropTypes.bool,
      boltwall: PropTypes.string,
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
      likes: PropTypes.number.isRequired,
      dislikes: PropTypes.number.isRequired,
      setInvoice: PropTypes.func.isRequired,
      setCurrentLikes: PropTypes.func.isRequired,
      setCurrentDislikes: PropTypes.func.isRequired,
      clearInvoice: PropTypes.func.isRequired,
    }
  }

  async componentDidMount() {
    const { data: rates } = await get('/api/metadata/rates')
    this.rates = rates
  }

  componentDidUpdate(prevProps) {
    const { invoiceStatus, getContent, locked, requirePayment } = this.props
    const { count, type } = this.state
    // if the invoice status changes to "held"
    // we want to submit our tips. This should only happen for tip submission
    if (
      prevProps.invoiceStatus !== invoiceStatus &&
      invoiceStatus === 'held' &&
      count &&
      type
    ) {
      this.submitTips()
      return
    } else if (!requirePayment) return
    // if the invoice status updates to 'paid' or it's not locked
    // then we want to do a request to get the post content which will loop until
    // status changes
    else if (
      (prevProps.invoiceStatus !== 'paid' && invoiceStatus === 'paid') ||
      !locked
    ) {
      getContent()
    }
  }

  async submitTips() {
    const {
      _id,
      setCurrentDislikes,
      setCurrentLikes,
      clearInvoice,
    } = this.props
    const { type, count } = this.state
    try {
      const { data: metadata } = await put(`/api/metadata/${_id}/tips`, {
        [type]: count,
      })
      this.setState({ showDialogue: false, type: null, count: 0 }, () => {
        clearInvoice()
        setCurrentDislikes(metadata.dislikes)
        setCurrentLikes(metadata.likes)
      })
    } catch (e) {
      const message =
        e.response && e.response.data ? e.response.data.message : e.message
      // eslint-disable-next-line no-console
      console.error('Problem submitting the tips to the server', message)
      clearInvoice()
      this.setState({ showDialogue: false, error: true }, () => {
        setTimeout(() => {
          this.setState({ error: false })
        }, 4000)
      })
    }
  }

  toggleDialogue(type) {
    this.props.clearInvoice()
    this.setState({
      showDialogue: !this.state.showDialogue,
      type,
      count: 1,
      loading: false,
    })
  }

  handleCountChange(e) {
    this.setState({ count: e.target.value })
  }

  async getHodlInvoice() {
    const { boltwall, title, _id, setInvoice, checkInvoiceStatus } = this.props
    const { count } = this.state
    const sats = this.rates.tips.rate * count
    this.setState({ loading: true }, async () => {
      let { data: invoice } = await post(`${boltwall}/api/invoice`, {
        amount: sats,
        title: `tips for ${title}`,
        appName: 'Prism',
      })

      // make sure we have an id as this will be our payment hash
      assert(invoice && invoice.id, 'Did not get expected data back from node')

      const {
        data: { payreq },
      } = await post(`/api/metadata/${_id}/tips/hodl`, {
        paymentHash: invoice.id,
      })

      setInvoice({ invoice: payreq, invoiceId: invoice.id })
      // check our own invoice status at the BOLT_URI to confirm it is held
      checkInvoiceStatus(50, 750, process.env.BOLTWALL_URI)
      this.setState({ loading: false })
    })
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
      likes,
      dislikes,
      boltwall,
    } = this.props
    const { showDialogue, count, loading, error } = this.state
    const cleanContent = DOMPurify.sanitize(content)
    const { tips } = this.rates

    // satoshis/btc * rate * tip count + fee
    const cost = parseFloat(
      this.satsPerBtc * rate * tips.rate * count + tips.fee * this.satsPerBtc
    ).toFixed(4)

    return (
      <div>
        <Header as="h2">{title}</Header>
        <Header as="h4">By: {author}</Header>
        <div
          className={`post-container${
            locked && requirePayment ? ' preview' : ''
          }`}
        >
          {' '}
          {cleanContent && cleanContent.length ? (
            <div
              className="container mb-5 p-2"
              style={{ textAlign: 'justify' }}
              dangerouslySetInnerHTML={{
                __html: marked(cleanContent),
              }}
            />
          ) : (
            <Loader size="large" active inline />
          )}
        </div>
        <div className="row justify-content-center metadata">
          {boltwall && boltwall.length ? (
            <div className="tips row mb-4 col-lg-8">
              <Header as="h4" className="col-12">
                Show some love!
              </Header>
              <div className="col-12">
                <Label
                  as="a"
                  color="blue"
                  onClick={() => this.toggleDialogue('likes')}
                >
                  <Icon name="thumbs up" />
                  {likes}
                </Label>
                <Label
                  as="a"
                  color="purple"
                  onClick={() => this.toggleDialogue('dislikes')}
                >
                  <Icon name="thumbs down" />
                  {dislikes}
                </Label>
              </div>
              <div className="row col my-4 justify-content-center">
                {error ? (
                  <Segment color="red">
                    There was a problem processing your payment. This is usually
                    the result of temporary lightning network connectivity
                    issues. If your tips were not added then you will eventually
                    be refunded your payment.
                  </Segment>
                ) : showDialogue ? (
                  <Segment loading={loading} className="col">
                    {invoice && invoice.length ? (
                      <React.Fragment>
                        <Header as="h3">
                          Please pay the invoice to continue:
                        </Header>
                        <div className="row">
                          <Input
                            type="text"
                            placeholder="Amount"
                            className="col"
                          >
                            <Label as="a" href={`lightning:${invoice}`}>
                              <Icon name="lightning" />
                            </Label>
                            <input
                              value={invoice}
                              style={{
                                width: 'auto',
                                textOverflow: 'ellipsis',
                                borderRightColor: '',
                              }}
                            />
                          </Input>
                        </div>
                      </React.Fragment>
                    ) : (
                      <div className="row">
                        <Header as="h5" className="col-12">
                          How much would you like to tip? (~$
                          {parseFloat(
                            this.satsPerBtc * rate * tips.rate
                          ).toFixed(4)}{' '}
                          per vote)
                        </Header>
                        <div className="col-12">
                          <div className="row justify-content-center">
                            <div className="col col-md-3 pr-0">
                              <input
                                type="number"
                                min={0}
                                max={15}
                                value={this.state.count}
                                onChange={e => this.handleCountChange(e)}
                                className="col"
                                style={{ height: '100%' }}
                              />
                            </div>
                            <div className="col col-md-2 mr-1 row align-items-center">
                              <p className="col">${cost}</p>
                            </div>
                            <Button
                              className="col-12 col-md-3"
                              onClick={() => this.getHodlInvoice()}
                            >
                              Ok!
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </Segment>
                ) : (
                  ''
                )}
              </div>
            </div>
          ) : (
            <p>
              <small>(Tips not available for this post)</small>
            </p>
          )}
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
