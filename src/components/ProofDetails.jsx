import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import {
  Header,
  Icon,
  Accordion,
  Card,
  List,
  Segment,
  Button,
} from 'semantic-ui-react'

export default class ProofDetails extends PureComponent {
  state = { activeIndex: -1 }

  handleClick = (e, titleProps) => {
    const { index } = titleProps
    const { activeIndex } = this.state
    const newIndex = activeIndex === index ? -1 : index

    this.setState({ activeIndex: newIndex })
  }

  formatTime = date =>
    new Date(date).toLocaleString('en-us', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

  static get propTypes() {
    return {
      proofData: PropTypes.shape({
        tbtc: PropTypes.object,
        tcal: PropTypes.object,
        btc: PropTypes.object,
        cal: PropTypes.object,
      }),
    }
  }

  render() {
    const { activeIndex } = this.state
    const {
      proofData: { tcal, tbtc, cal, btc },
    } = this.props
    const calProof = tcal || cal
    const btcProof = btc || tbtc

    return (
      <Accordion styled style={{ textAlign: 'left' }} className="col m-4">
        <Accordion.Title
          active={activeIndex === 0}
          index={0}
          onClick={this.handleClick}
        >
          <Header as="h4">
            <Icon name="dropdown" />
            Proof Details
          </Header>
        </Accordion.Title>
        <Accordion.Content
          active={activeIndex === 0}
          className="enable-select row"
        >
          <Header as="h5" className="w-100">
            Hash of Post Data:{' '}
            <span style={{ wordWrap: 'break-word' }}>{calProof.hash}</span>
          </Header>
          {/* calendar anchor */}
          <div className="col col-md-6 mb-3 mb-md-0">
            <Card>
              <Card.Content className="p-3">
                <Card.Header>Calendar Anchor</Card.Header>
                <Card.Description>
                  <List>
                    <List.Item>
                      <List.Header>Submitted At:</List.Header>
                      {this.formatTime(calProof['hash_submitted_node_at'])}
                    </List.Item>
                    <List.Item>
                      <List.Header>Expected Value (Merkle Root):</List.Header>
                      {calProof['expected_value']}
                    </List.Item>
                    <List.Item>
                      <List.Header>Network:</List.Header>
                      {calProof.type === 'cal'
                        ? 'Chainpoint (mainnet)'
                        : calProof.type === 'tcal'
                        ? 'Chainpoint (testnet)'
                        : 'Unknown'}
                    </List.Item>
                  </List>
                </Card.Description>
              </Card.Content>
            </Card>
          </div>
          <div className="col col-md-6">
            {/* btc anchor */}
            {btcProof ? (
              <Card>
                <Card.Content className="p-3">
                  <Card.Header>BTC Anchor</Card.Header>
                  <Card.Description>
                    <List>
                      <List.Item>
                        <List.Header>Block Height:</List.Header>
                        {btcProof['anchor_id']}
                      </List.Item>
                      <List.Item>
                        <List.Header>Expected Value (Merkle Root):</List.Header>
                        {btcProof['expected_value']}
                      </List.Item>
                      <List.Item>
                        <List.Header>Network:</List.Header>
                        {btcProof.type === 'btc'
                          ? 'Chainpoint (mainnet)'
                          : btcProof.type === 'tbtc'
                          ? 'Bitcoin (testnet)'
                          : 'Unknown'}
                      </List.Item>
                    </List>
                  </Card.Description>
                </Card.Content>
              </Card>
            ) : (
              <Segment
                placeholder
                style={{ minHeight: 0, height: '100%', textAlign: 'center' }}
              >
                <Header icon>
                  <Icon name="unlock" color="grey" />
                  No BTC Anchor Available yet
                </Header>
                <Segment.Inline>
                  <Header as="h4" color="grey">
                    Must check-in between 2 and 24 hours after proof
                    initialization
                  </Header>
                </Segment.Inline>
              </Segment>
            )}
          </div>

          <div className="row justify-content-end col-md m-3">
            <Button disabled className="col-md-4">
              Download Proof
            </Button>
          </div>
        </Accordion.Content>
      </Accordion>
    )
  }
}
