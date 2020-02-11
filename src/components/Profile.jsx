import React, { PureComponent } from 'react'
import { Person } from 'blockstack'
import PropTypes from 'prop-types'
import { Button, Input, Header } from 'semantic-ui-react'

import { Document, Proof } from '../models'
import { DocumentList } from '.'
import { documentPropTypes } from '../propTypes'

const avatarFallbackImage =
  'https://s3.amazonaws.com/onename/avatar-placeholder.png'

export default class Profile extends PureComponent {
  constructor(props) {
    super(props)
    props.clearDocumentList()
    this.state = {
      boltwallUri: '',
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
      loading: PropTypes.bool.isRequired,
      documents: PropTypes.arrayOf(documentPropTypes).isRequired,
      getOwnDocuments: PropTypes.func.isRequired,
      clearDocumentList: PropTypes.func.isRequired,
      setDocsLoading: PropTypes.func.isRequired,
      getBoltwallUri: PropTypes.func.isRequired,
      boltwall: PropTypes.string,
      saveBoltwallUri: PropTypes.func.isRequired,
    }
  }

  async componentDidMount() {
    const {
      userSession,
      getOwnDocuments,
      clearDocumentList,
      getBoltwallUri,
    } = this.props
    clearDocumentList()
    await getBoltwallUri()
    await getOwnDocuments()

    this.setState({
      person: new Person(userSession.loadUserData().profile),
    })
  }

  componentDidUpdate(prevProps) {
    if (
      !this.state.boltwallUri &&
      this.props.boltwall &&
      prevProps.boltwall !== this.state.boltwallUri
    )
      this.setState({ boltwallUri: this.props.boltwall })
  }

  componentWillUnmount() {
    this.props.clearDocumentList()
  }

  handleUpdateUri(e) {
    this.setState({ boltwallUri: e.target.value })
  }

  // This is a utility method for now for easy cleanup of testing
  // in production probably want to have this a little more buried
  async deleteAllPosts() {
    const myDocs = await Document.fetchOwnList()
    const confirm = window.confirm(
      `Are you sure you want to delete all posts (${myDocs.length})?`
    )
    if (!confirm) return
    this.props.setDocsLoading(true)
    const promises = []
    for (let doc of myDocs) {
      const proof = await Proof.findById(doc.attrs.proofId)
      promises.push(doc.destroy())
      if (proof) promises.push(proof.destroy())
    }
    await Promise.all(promises)
    this.props.clearDocumentList()
    this.props.getOwnDocuments()
  }

  render() {
    const {
      documents,
      userSession,
      loading,
      boltwall,
      saveBoltwallUri,
    } = this.props
    const { person, boltwallUri } = this.state

    return !userSession.isSignInPending() ? (
      <div className="panel-welcome" id="section-2">
        <div className="avatar-section">
          <img
            src={person.avatarUrl() ? person.avatarUrl() : avatarFallbackImage}
            className="img-rounded avatar"
            id="avatar-image"
          />
        </div>
        <Header as="h2">
          Hello,{' '}
          <span id="heading-name">
            {person.name() ? person.name() : 'Nameless Person'}
          </span>
          !
        </Header>
        <div className="row justify-content-center mb-4">
          <div className="col-md-6">
            <Header as="h3" textAlign="left">
              Settings
            </Header>
            <div className="row">
              <Input
                placeholder="Enter valid boltwall uri here..."
                label="Boltwall URI"
                onChange={e => this.handleUpdateUri(e)}
                value={boltwallUri}
                className="col"
              />
              <Button onClick={() => saveBoltwallUri(boltwallUri)}>Save</Button>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col">
            <div className="col-md-4 offset-md-3">
              <Header as="h3" textAlign="left">
                My Documents
              </Header>
            </div>
            <DocumentList documents={documents} loading={loading} edit />
          </div>
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
