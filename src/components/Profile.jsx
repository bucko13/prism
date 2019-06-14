import React, { PureComponent } from 'react'
import { Person } from 'blockstack'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { Segment } from 'semantic-ui-react'

const avatarFallbackImage =
  'https://s3.amazonaws.com/onename/avatar-placeholder.png'

export default class Profile extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      person: {
        name() {
          return 'Anonymous'
        },
        avatarUrl() {
          return avatarFallbackImage
        },
      },
      docs: [],
    }
  }

  static get propTypes() {
    return {
      userSession: PropTypes.object,
      handleSignOut: PropTypes.func.isRequired,
    }
  }

  async componentDidMount() {
    const { userSession } = this.props
    const resp = await fetch('/api/docs')
    const docs = await resp.json()
    let identityPubkey
    try {
      const info = await this.getNodeInfo()
      identityPubkey = info.identityPubkey
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Error getting node info:', e.message)
    }

    this.setState({
      docs,
      identity: identityPubkey,
      person: new Person(userSession.loadUserData().profile),
    })
  }

  async getNodeInfo() {
    const resp = await fetch('/api/node')
    const info = await resp.json()
    return info
  }

  render() {
    const { handleSignOut, userSession } = this.props
    const { person, docs, identity } = this.state

    return !userSession.isSignInPending() ? (
      <div className="panel-welcome" id="section-2">
        <div className="avatar-section">
          <img
            src={person.avatarUrl() ? person.avatarUrl() : avatarFallbackImage}
            className="img-rounded avatar"
            id="avatar-image"
          />
        </div>
        <h1>
          Hello,{' '}
          <span id="heading-name">
            {person.name() ? person.name() : 'Nameless Person'}
          </span>
          !
        </h1>
        <p className="lead">
          <button
            className="btn btn-primary btn-lg"
            id="signout-button"
            onClick={handleSignOut.bind(this)}
          >
            Logout
          </button>
        </p>

        <p className="lead">
          Don&apos;t have a testnet lightning wallet? Head on over to{' '}
          <a href="https://htlc.me/" target="_blank" rel="noopener noreferrer">
            htlc.me
          </a>{' '}
          to create one and test out the app
        </p>

        <div className="docs-list" style={{ width: '50%', margin: 'auto' }}>
          {docs.length
            ? docs.map((doc, index) => (
                <Link
                  key={index}
                  to={{
                    pathname: '/reader',
                    search: `?filename=${doc.file}`,
                    query: doc,
                  }}
                  style={{ margin: '0 1rem', padding: '.5rem' }}
                >
                  <Segment className="doc" size="large" inverted>
                    {doc.title}
                  </Segment>
                </Link>
              ))
            : ''}
        </div>
        {identity ? (
          <div className="row justify-content-center">
            <div className="col-6">
              <Segment color="green">
                Connect w/ our node:{' '}
                <span className="enable-select" style={{ overflow: 'hidden' }}>
                  {identity}
                </span>
              </Segment>
            </div>
          </div>
        ) : (
          ''
        )}
      </div>
    ) : null
  }
}
