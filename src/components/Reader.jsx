import React, { PureComponent } from 'react'
import { Header, Button, Loader, Segment } from 'semantic-ui-react'
import PropTypes from 'prop-types'

import InvoiceModal from './InvoiceModal.jsx'

export default class Reader extends PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      text: null,
      nextText: null,
      wordCount: 0,
      readCount: 0,
      readIndex: 0,
      doc: props.location.query,
      modalOpen: false,
      modal: {},
      seconds: 30,
      invoice: '',
      rate: null,
    }
  }

  static get propTypes() {
    return {
      setWordCount: PropTypes.func.isRequired,
      wordCount: PropTypes.number.isRequired,
      location: PropTypes.shape({
        query: PropTypes.object,
        search: PropTypes.string,
      }),
      userSession: PropTypes.shape({
        loadUserData: PropTypes.function,
      }),
    }
  }

  async componentDidMount() {
    const { setWordCount } = this.props
    if (this.state.docs) return
    const doc = await this.getDocument()

    if (doc) {
      setWordCount(doc.count)
      this.setState({ doc, wordCount: doc.count, nextText: doc.text })
    } else {
      let index = location.search.indexOf('=')
      const filename = location.search.slice(index + 1)
      index = filename.indexOf('.')
      const title = filename
        .slice(0, index)
        .toUpperCase()
        .replace(/-/g, ' ')
      this.setState({ doc: { title, filename } })
    }
  }

  async getDocument() {
    const { location } = this.props
    const { readIndex } = this.state
    const index = location.search.indexOf('=')
    const query = location.search.slice(index + 1)
    const resp = await fetch(`/api/doc/${query}?count=${readIndex}`)
    if (resp.status === 402) return false
    return await resp.json()
  }

  async setText(e) {
    if (e) e.preventDefault()
    const { nextText, readIndex, text, readCount } = this.state
    const newCount =
      text && text.text ? readCount + text.text.split(' ').length : readCount
    this.setState(
      {
        text: nextText,
        readIndex: readIndex + 1,
        readCount: newCount,
        modalOpen: false,
        invoice: '',
      },
      () => this.getNextText()
    )
  }

  async getNextText() {
    const doc = await this.getDocument()
    this.setState({ nextText: doc.text })
  }

  changeSeconds(e) {
    e.preventDefault()
    this.setState({ seconds: e.target.value })
  }

  async requestInvoice(e) {
    e.preventDefault()
    const user = this.props.userSession.loadUserData()
    const body = JSON.stringify({ time: this.state.seconds, user })
    try {
      const res = await fetch('/api/invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      })
      const invoice = await res.json()
      this.setState({ invoice: invoice.lightning_invoice.payreq })
      this.checkInvoiceStatus()
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Problem getting invoice:', e.message)
      this.closeModal()
    }
  }

  async checkInvoiceStatus() {
    // invoice id is attached to the session cookie so we don't
    // need to send any identifier
    let count = 0
    while (count < 50) {
      await sleep(1000)
      const resp = await fetch('/api/invoice')
      if (resp.status === 200) {
        return this.setText()
      } else count++
    }
    this.closeModal()
  }

  async showModal(doc) {
    try {
      const res = await fetch('/api/exchange')
      const { BTCUSD: rate } = await res.json()
      this.setState({ modal: doc, modalOpen: true, rate })
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e)
    }
  }

  closeModal() {
    this.setState({ modalOpen: false, invoice: '' })
  }

  render() {
    const {
      doc,
      readIndex,
      text,
      seconds,
      modalOpen,
      modal,
      invoice,
      rate,
      readCount,
      wordCount,
    } = this.state

    return (
      <div
        className="text-container row align-items-center justify-content-center"
        style={{ height: '100%' }}
      >
        {doc && doc.title && !text ? (
          <div className="col-6 row justify-content-center">
            <Header as="h2" className="col-12">
              {doc.title}
            </Header>
            <Button onClick={e => this.showModal(e)} className="col-6">
              Click to Start
            </Button>
          </div>
        ) : text ? (
          <div className="col">
            <p>Click on the box below to get the next words</p>
            <Segment
              size="massive"
              style={{ padding: '5rem' }}
              className="col"
              onClick={e => readIndex && this.setText(e)}
            >
              {text.text}
            </Segment>
            <Segment className="col">
              <Header as="h4">Words left: {wordCount - readCount}</Header>
              <Header as="h4">
                Percent left: {((readCount / wordCount) * 100).toFixed(2)}%
              </Header>
            </Segment>
          </div>
        ) : (
          <Loader />
        )}
        <InvoiceModal
          data={modal}
          requestInvoice={e => this.requestInvoice(e, modal)}
          changeSeconds={e => this.changeSeconds(e)}
          seconds={seconds}
          modalOpen={modalOpen}
          closeModal={() => this.closeModal()}
          invoice={invoice}
          rate={rate}
        />
      </div>
    )
  }
}

async function sleep(time = 500) {
  return new Promise(resolve => setTimeout(resolve, time))
}
