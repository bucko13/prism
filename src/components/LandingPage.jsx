import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Header, Segment, Card, Icon, Button, List } from 'semantic-ui-react'
import { Link } from 'react-router-dom'

const cardContent = [
  [
    {
      header: 'Self-Sovereign IDs',
      icon: 'user',
      description:
        'Your user ID and all related information is yours. Even if Prism goes away, you retain control.',
    },
    {
      header: 'Decentralized Storage',
      icon: 'newspaper',
      description:
        'Decentralized storage means you always own your content, no matter what. You can even move to a different platform if you want!',
    },
  ],
  [
    {
      header: 'BTC Payments',
      icon: 'btc',
      description:
        "Receive payments directly for content you share, using the world's most popular cryptocurrency, Bitcoin",
    },
    {
      header: 'Timestamps Built-In',
      icon: 'lock',
      description:
        'With the immutable properties of the Bitcoin blockchain, you can automatically timestamp your content. Like being your own notary!',
    },
  ],
]

const techContent = [
  {
    header: 'Blockstack',
    href: 'https://blockstack.org',
    meta: 'Decentralized identification',
  },
  {
    header: 'Gaia',
    meta: 'Decentralized storage indexed with Radiks',
    href: 'https://docs.blockstack.org/storage/overview.html',
    icon: 'database',
  },
  {
    header: 'Lightning',
    meta: 'Micro-payments on the Bitcoin blockchain',
    href: 'https://lightning.engineering/',
    icon: 'lightning',
  },
  {
    header: 'ln-builder',
    icon: 'th',
    meta: 'Easy-to-deploy, user-controlled paywalls',
    href: 'https://github.com/bucko13/ln-builder',
  },
]

const checklist = [
  'Get paid directly for your content',
  'Always keep control of your work',
  'No login, email, or credit card required',
  'Supports migrating content to other platforms',
  'Prove authenticity of your work with the blockchain',
]

export default class LandingPage extends Component {
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
        <h3 className="m-0">Your Keys, Your Content.</h3>
        <h2 style={{ fontStyle: 'italic' }} className="mt-0">
          Own the conversation.
        </h2>
        <p className="lead">
          <Button
            id="signin-button"
            onClick={handleSignIn.bind(this)}
            size="large"
            color="black"
          >
            Sign In with Blockstack
          </Button>
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
        <div className="row my-5 py-5" style={{ backgroundColor: '#f4f4f4' }}>
          <Header as="h3" className="col-12">
            Account-less Access
          </Header>
          <div className="col">
            <div className="row justify-content-center">
              <div className="col-12 col-md-6">
                <p>
                  Have a post you want to read but don&apos;t want to create an
                  account? Prism has you covered! Thanks to the decentralized
                  nature of Bitcoin payments with lightning, you can access
                  content without ever having to log in.
                </p>
                <Link to="/browse">
                  <Button color="black">Latest Posts</Button>
                </Link>
              </div>
              <div className="col-12 col-md-4">
                <img src="/invoice-preview.png" />
              </div>
            </div>
          </div>
        </div>
        <div className="row mt-4 p-4 checklist">
          <Header as="h2" className="col-12 mb-5">
            What Makes Prism Different?
          </Header>
          <div className="col">
            <div className="row justify-content-center">
              <div className="col-auto">
                <List size="big" style={{ textAlign: 'left' }} className="pl-5">
                  {checklist.map((text, index) => (
                    <List.Item key={index} className="mb-3">
                      <List.Icon
                        name="check circle"
                        color="green"
                        style={{ display: 'inline' }}
                      />
                      <List.Content style={{ display: 'inline' }}>
                        {text}
                      </List.Content>
                    </List.Item>
                  ))}
                </List>
              </div>
            </div>
          </div>
        </div>
        <div className="row mt-4 p-4">
          <Segment inverted style={{ width: '100%' }}>
            <Header as="h3" className="col-12">
              Sign Up Or Login With Blockstack To Publish Your First Article
            </Header>
            <p className="lead col-12">
              <Button
                id="signin-button"
                onClick={handleSignIn.bind(this)}
                inverted
                size="large"
              >
                Sign In with Blockstack
              </Button>
            </p>
          </Segment>
        </div>
        <div className="row m-5 p-4">
          <Header as="h3" className="col">
            Learn about the technologies that make Prism possible.
          </Header>
        </div>
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="row">
              <div className="col-12 col-md-7">
                <Card.Group className="row mb-4 justify-content-center">
                  {techContent.map((card, index) => (
                    <Card
                      key={index}
                      className="col-lg-5 col-9 m-3"
                      link
                      href={card.href}
                      target="_blank"
                      rel="noreferer noopener"
                    >
                      <Card.Content>
                        {card.icon || card.header !== 'Blockstack' ? (
                          <Icon name={card.icon} />
                        ) : (
                          <img
                            src="/blockstack.png"
                            style={{ width: '30px' }}
                          />
                        )}
                        <Card.Header className="mt-2">
                          {card.header}
                        </Card.Header>
                        <Card.Meta>{card.meta}</Card.Meta>
                      </Card.Content>
                    </Card>
                  ))}
                </Card.Group>
              </div>
              <div className="col order-first order-md-last">
                <p>
                  Prism is made with technologies built primarily on top of
                  Bitcoin. The driving principle behind our system is that the
                  user should always have the final say over their data. We
                  believe this creates a better relationship between the
                  platform and its users.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
