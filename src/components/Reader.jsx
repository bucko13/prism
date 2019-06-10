import React, { PureComponent } from 'react'
import QRCode from 'qrcode.react'
import {
  Header,
  Button,
  Loader,
  Segment,
  Modal,
  Input,
} from 'semantic-ui-react'
const invoice =
  'lntb50n1pw0mh8ypp5dudm5deu35ln3j3ggmawdyhxkng8g9e0c85qfr692vsnen8kvf8sdqqcqzpgxqyz5vq923zggd6f0qswpmu6axjw4dy305k3vfcr23lc44j9s5alhc40v29f8zstxvs9543y3z2u05470gy9vnxdqlex63s0xdrmu0xea4rzxgq983r48'
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
    }
  }

  async componentDidMount() {
    if (this.state.docs) return
    const doc = await this.getDocument()
    if (doc) this.setState({ doc, wordCount: doc.count, nextText: doc.text })
    else {
      const { search } = this.props.location
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
    const { nextText, readIndex } = this.state

    this.setState(
      { text: nextText, readIndex: readIndex + 1, modalOpen: false },
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

  async requestInvoice(e, doc) {
    const user = this.props.userSession.loadUserData()
    const body = JSON.stringify({ time: this.state.seconds, user })
    const res = await fetch('/api/invoice/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    })
    if (res.status >= 200 && res.status < 300) {
      if (!this.state.nextText) {
        const doc = await this.getDocument()
        this.setState({ nextText: doc.text }, () => this.setText())
      } else {
        this.setText()
      }
    } else {
      this.closeModal()
    }
  }

  showModal(doc) {
    this.setState({ modal: doc, modalOpen: true })
  }

  closeModal() {
    this.setState({ modalOpen: false })
  }

  render() {
    const { doc, readIndex, text, seconds, modalOpen, modal } = this.state

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
          <Segment
            size="massive"
            className="col"
            onClick={e => readIndex && this.setText(e)}
          >
            {text.text}
          </Segment>
        ) : (
          <Loader />
        )}
        <TimeModal
          requestInvoice={e => this.requestInvoice(e, modal)}
          changeSeconds={e => this.changeSeconds(e)}
          data={modal}
          modalOpen={modalOpen}
          seconds={seconds}
        />
      </div>
    )
  }
}

function TimeModal({
  data,
  requestInvoice,
  changeSeconds,
  seconds,
  modalOpen,
}) {
  return (
    <Modal open={modalOpen} size="small">
      <Modal.Header>{data.title}</Modal.Header>
      <Modal.Content>
        <Modal.Description>
          <Header as="h3">
            How many seconds would you like to have access to the content for?
          </Header>
          <p></p>
          <p>The rate is 1 sat/second</p>
          <Input
            placeholder="Time in seconds"
            type="number"
            value={seconds}
            onChange={changeSeconds}
          />
          <QRCode
            value="invoice"
            size=200
            renderAs="canvas"
          />
        </Modal.Description>
      </Modal.Content>
      <Modal.Actions>
        <Button color="green" onClick={e => requestInvoice(e, data)} inverted>
          Get Invoice
        </Button>
      </Modal.Actions>
    </Modal>
  )
}
