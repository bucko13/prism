import React, { PureComponent } from 'react'
import { Person } from 'blockstack'
import PropTypes from 'prop-types'
import { Button } from 'semantic-ui-react'

import { Document } from '../models'
import { DocumentList } from '.'
import { documentPropTypes } from '../propTypes'

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
      loading: true,
    }
  }

  static get propTypes() {
    return {
      userSession: PropTypes.object,
      getOwnDocuments: PropTypes.func.isRequired,
      clearDocumentList: PropTypes.func.isRequired,
      documents: PropTypes.arrayOf(documentPropTypes).isRequired,
    }
  }

  async componentDidMount() {
    const { userSession, getOwnDocuments } = this.props

    await getOwnDocuments()

    this.setState({
      person: new Person(userSession.loadUserData().profile),
    })
    setTimeout(() => {
      this.setState({ loading: false })
    }, 4000)
  }

  componentWillUnmount() {
    this.props.clearDocumentList()
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
    const { person, loading } = this.state

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
        <DocumentList documents={documents} loading={loading} edit />
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
