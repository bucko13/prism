import React, { PureComponent } from 'react'
import { Header, Button, Loader, Segment } from 'semantic-ui-react'
import PropTypes from 'prop-types'
import axios from 'axios'

import InvoiceModal from './InvoiceModal.jsx'
import { sleep } from '../utils'

export default class Reader extends PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      modalOpen: false,
      seconds: 30,
      rate: null,
      timer: 0,
    }
  }

  static get propTypes() {
    return {
      wordCount: PropTypes.number.isRequired,
      filename: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      invoice: PropTypes.string.isRequired,
      readIndex: PropTypes.number.isRequired,
      text: PropTypes.string.isRequired,
      readCount: PropTypes.number.isRequired,
      location: PropTypes.shape({
        query: PropTypes.object,
        search: PropTypes.string,
      }),
      userSession: PropTypes.shape({
        loadUserData: PropTypes.function,
      }),
      updateText: PropTypes.func.isRequired,
      getDocInfo: PropTypes.func.isRequired,
      setDocInfo: PropTypes.func.isRequired,
      setInvoice: PropTypes.func.isRequired,
    }
  }

  async componentDidMount() {
    const { getDocInfo, location, setDocInfo } = this.props
    let doc = location.query
    // if doc info was passed, simply set the info
    if (doc) {
      setDocInfo(doc)
    } else {
      // otherwise get the doc info based on the query string
      let index = location.search.indexOf('=')
      const filename = location.search.slice(index + 1)
      await getDocInfo(filename)
    }
  }

  changeSeconds(e) {
    e.preventDefault()
    const seconds = parseInt(e.target.value, 10)
    this.setState({ seconds })
  }

  async requestInvoice(e) {
    const { userSession, filename, setInvoice } = this.props
    e.preventDefault()
    const user = userSession.loadUserData()
    const body = {
      time: this.state.seconds,
      user,
      filename: filename,
    }
    try {
      const { data: invoice } = await axios.post('/api/node/invoice', body)
      setInvoice(invoice.lightning_invoice.payreq)
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
      const resp = await axios.get('/api/node/invoice')
      if (resp.status === 200) {
        return this.setText()
      } else count++
    }
    this.closeModal()
  }

  async setText() {
    const { updateText, setInvoice } = this.props
    await updateText()
    this.setState({ modalOpen: false, timer: this.state.seconds }, () => {
      setInvoice('')
      this.setTimer(this.state.timer)
    })
  }

  setTimer(timer) {
    if (timer >= 0) {
      setTimeout(() => {
        this.setState({ timer }, () => this.setTimer(timer - 1))
      }, 1000)
    } else {
      return
    }
  }

  async showModal() {
    try {
      const res = await axios.get('/api/node/exchange')
      const { BTCUSD: rate } = res.data
      this.setState({ modalOpen: true, rate })
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e)
    }
  }

  closeModal() {
    this.setState({ modalOpen: false, invoice: '' })
  }

  render() {
    const { seconds, modalOpen, rate, timer } = this.state

    const {
      wordCount,
      title,
      invoice,
      text,
      readCount,
      updateText,
    } = this.props
    return (
      <div
        className="text-container row align-items-center justify-content-center"
        style={{ height: '100%' }}
      >
        {title && !text ? (
          <div className="col-6 row justify-content-center">
            <Header as="h2" className="col-12">
              {title}
            </Header>
            <Button onClick={() => this.showModal()} className="col-6">
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
              onClick={() => updateText()}
            >
              {text}
            </Segment>
            <Segment className="col">
              <Header as="h4">Words left: {wordCount - readCount}</Header>
              <Header as="h4">
                Percent left: {((readCount / wordCount) * 100).toFixed(2)}%
              </Header>
              <Header as="h4">Time left: {timer} seconds</Header>
            </Segment>
          </div>
        ) : (
          <Loader />
        )}
        <InvoiceModal
          title={title}
          requestInvoice={e => this.requestInvoice(e)}
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
