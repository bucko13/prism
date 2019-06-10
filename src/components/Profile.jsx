import React, { PureComponent } from 'react'
import { Person } from 'blockstack'
import { Redirect, Link } from 'react-router-dom'
import { Segment, Button } from 'semantic-ui-react'

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

  async componentDidMount() {
    const resp = await fetch('/api/docs')
    const docs = await resp.json()
    this.setState({ docs })
  }

  componentWillMount() {
    const { userSession } = this.props
    this.setState({
      person: new Person(userSession.loadUserData().profile),
    })
  }

  render() {
    const { handleSignOut, userSession } = this.props
    const { person, docs } = this.state

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
      </div>
    ) : null
  }
}
