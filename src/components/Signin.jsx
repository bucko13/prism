import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Header, Segment, Card, Icon } from 'semantic-ui-react'

const cardContent = [
  [
    {
      header: 'Self-Sovereign IDs',
      icon: 'user',
      description:
        'Your user and all related information is yours. Even if Prism goes away, you retain control.',
    },
    {
      header: 'Decentralized Storage',
      icon: 'newspaper',
      description:
        'Using the power of the Blockstack network, you always own your content, no matter what.',
    },
  ],
  [
    {
      header: 'BTC Payments',
      icon: 'btc',
      description:
        "Receive payments directly for content you share, using the world's most popular Cryptocurrency, Bitcoin",
    },
    {
      header: 'Timestamps Built-In',
      icon: 'lock',
      description:
        'With the immutable properties of the Bitcoin blockchain, you are able to timestamp your content and prove you are the creator',
    },
  ],
]

export default class Signin extends Component {
  constructor(props) {
    super(props)
  }

  static get propTypes() {
    return {
      handleSignIn: PropTypes.func,
    }
  }
  render() {
    const { handleSignIn } = this.props

    return (
      <div className="panel-landing" id="section-1">
        <img src="/logo.png" />
        <h1 className="landing-heading mt-0">Welcome to Prism!</h1>
        <h3 className="mb-0">Your Keys, Your Content.</h3>
        <h3 style={{ fontStyle: 'italic' }} className="mt-0">
          Own the conversation.
        </h3>
        <p className="lead">
          <button
            className="btn btn-primary btn-lg"
            id="signin-button"
            onClick={handleSignIn.bind(this)}
          >
            Sign In with Blockstack
          </button>
        </p>
        <div
          className="row align-items-center"
          style={{
            backgroundImage: 'url(/typewriter.jpg)',
            minHeight: '231px',
            backgroundSize: 'cover',
          }}
        >
          <Segment className="col" piled>
            <Header as="h2">
              The{' '}
              <span style={{ textDecoration: 'line-through' }}>Don&apos;t</span>{' '}
              Can&apos;t Be Evil Content Platform
            </Header>
          </Segment>
        </div>
        <div className="row m-4 p-4">
          <div className="col">
            <Header as="h3">
              Decentralization With the Power of Blockchain
            </Header>
          </div>
        </div>
        <div className="row justify-content-center">
          <div className="col-md-8">
            <Card.Group className="row mb-4 justify-content-between">
              <div className="col">
                {cardContent.map((row, index) => (
                  <div className="row justify-content-center" key={index}>
                    {row.map((card, index) => (
                      <Card key={index} className="col-12 col-md-5 m-3" link>
                        <Card.Content>
                          <Icon name={card.icon} />
                          <Card.Header>{card.header}</Card.Header>
                          <Card.Description>
                            {card.description}
                          </Card.Description>
                        </Card.Content>
                      </Card>
                    ))}
                  </div>
                ))}
              </div>
            </Card.Group>
          </div>
        </div>
        <div className="row mt-4">
          <Header as="h3" className="col-12">
            Sign up or Login With Blockstack to Get Started
          </Header>
          <p className="lead col-12">
            <button
              className="btn btn-primary btn-lg"
              id="signin-button"
              onClick={handleSignIn.bind(this)}
            >
              Sign In with Blockstack
            </button>
          </p>
        </div>
      </div>
    )
  }
}
