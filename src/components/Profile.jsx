import React, { PureComponent } from 'react'
import { Person } from 'blockstack'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { Segment, Button, Dimmer, Loader } from 'semantic-ui-react'

import { Document } from '../models'

const avatarFallbackImage =
  'https://s3.amazonaws.com/onename/avatar-placeholder.png'

export default class Profile extends PureComponent {
  constructor(props) {
    super(props)
    props.clearDocumentList()
    this.state = {
      person: {
        name() {
          return 'Anonymous'
        },
        avatarUrl() {
          return avatarFallbackImage
        },
      },
    }
  }

  static get propTypes() {
    return {
      userSession: PropTypes.object,
      getOwnDocuments: PropTypes.func.isRequired,
      clearDocumentList: PropTypes.func.isRequired,
      documents: PropTypes.arrayOf(
        PropTypes.shape({
          title: PropTypes.string.isRequired,
          content: PropTypes.string,
          author: PropTypes.string.isRequired,
          docId: PropTypes.string.isRequired,
        })
      ),
    }
  }

  async componentDidMount() {
    const { userSession, getOwnDocuments } = this.props

    await getOwnDocuments()

    this.setState({
      person: new Person(userSession.loadUserData().profile),
    })
  }

  async getNodeInfo() {
    const resp = await fetch('/api/node', {
      method: 'GET',
      credentials: 'include',
    })
    const info = await resp.json()
    return info
  }

  // This is a utility method for now for easy cleanup of testing
  // in production probably want to have this a little more buried
  async deleteAllPosts() {
    const myDocs = await Document.fetchOwnList()
    const confirm = window.confirm(
      `Are you sure you want to delete all (${myDocs.length}) posts?`
    )
    if (!confirm) return

    for (let doc of myDocs) {
      await doc.destroy()
    }
    this.props.getOwnDocuments()
  }

  render() {
    const { documents, userSession } = this.props
    const { person } = this.state

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
        <div className="docs-list" style={{ width: '50%', margin: 'auto' }}>
          {documents.length ? (
            documents.map((doc, index) => (
              <Link
                key={index}
                to={{
                  pathname: '/post',
                  search: `?id=${doc.docId}`,
                  query: doc,
                }}
                style={{ margin: '0 1rem', padding: '.5rem' }}
              >
                <Segment className="doc" size="large" inverted>
                  {doc.title}
                </Segment>
              </Link>
            ))
          ) : (
            <Dimmer active inverted>
              <Loader size="large" />
            </Dimmer>
          )}
        </div>
        {documents && documents.length ? (
          <Button
            color="red"
            className="m-4"
            onClick={() => this.deleteAllPosts()}
          >
            DELETE MY POSTS
          </Button>
        ) : (
          ''
        )}
      </div>
    ) : null
  }
}
