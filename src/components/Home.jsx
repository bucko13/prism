import React, { PureComponent } from 'react'
import { Person } from 'blockstack'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { Segment } from 'semantic-ui-react'

import { DocumentLink } from '.'
import { Document } from '../models'
import { documentPropTypes } from '../propTypes'

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
      getDocumentList: PropTypes.func.isRequired,
      getProofs: PropTypes.func.isRequired,
      documents: PropTypes.arrayOf(documentPropTypes).isRequired,
    }
  }

  async componentDidMount() {
    const { userSession, getDocumentList } = this.props
    await getDocumentList()
    const resp = await fetch('/api/docs', {
      method: 'GET',
      credentials: 'include',
    })
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
    this.props.getDocumentList()
  }

  render() {
    const { documents, handleSignOut, userSession } = this.props
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
        {/* the new documents list from radiks */}
        <div className="docs-list" style={{ width: '50%', margin: 'auto' }}>
          {documents.length
            ? documents.map((doc, index) => (
                <DocumentLink doc={doc} key={index} />
              ))
            : ''}
        </div>
        {/* end the documents list from radiks */}
        <div className="docs-list" style={{ width: '50%', margin: 'auto' }}>
          {docs.length
            ? docs.map((doc, index) => <DocumentLink doc={doc} key={index} />)
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
