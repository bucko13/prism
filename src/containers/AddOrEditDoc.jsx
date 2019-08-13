import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import assert from 'bsert'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { evaluateProofs } from 'chainpoint-client/dist/bundle.web'
import ReactMde from 'react-mde'
import { Header, Loader, Dimmer, Modal } from 'semantic-ui-react'
import * as Showdown from 'showdown'
import { get } from 'axios'
import 'react-mde/lib/styles/css/react-mde-all.css'

import { Document, Proof } from '../models'
import { AddOrEditDoc } from '../components'
import { documentActions } from '../store/actions'
import { documentPropTypes } from '../propTypes'

class AddOrEditDocContainer extends PureComponent {
  document = null

  constructor(props) {
    super(props)
    this.state = {
      text: 'Add your text here',
      author: '',
      title: '',
      tab: 'write',
      caveatKey: '',
      node: '',
      requirePayment: true,
      loading: true,
      proofData: {},
    }

    this.converter = new Showdown.Converter({
      tables: true,
      simplifiedAutoLink: true,
      strikethrough: true,
      tasklists: true,
    })
  }

  static get propTypes() {
    return {
      username: PropTypes.string,
      userId: PropTypes.string,
      name: PropTypes.string,
      aesKey: PropTypes.string,
      edit: PropTypes.bool,
      docId: PropTypes.string,
      location: PropTypes.shape({
        state: documentPropTypes,
      }),
      history: PropTypes.shape({
        push: PropTypes.func.isRequired,
      }).isRequired,
      clearDocumentList: PropTypes.func.isRequired,
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (!prevState.backToPage && this.state.backToPage) {
      this.props.history.push(this.state.backToPage)
    }
  }

  evaluateProof() {
    const { rawProof } = this.props.location.state
    const proofData = {}
    if (rawProof && rawProof.length) {
      const proofs = evaluateProofs([rawProof])
      for (let proof of proofs) {
        proofData[proof.type] = proof
      }
    }
    return proofData
  }

  async componentDidMount() {
    const { edit, docId } = this.props
    if (edit) {
      assert(typeof docId === 'string', 'Need a document id to edit post')
      this.document = await Document.findById(docId)
      assert(this.document, 'No document matches that id')
      const {
        content,
        title,
        author,
        node,
        caveatKey,
        requirePayment = false,
      } = this.document.attrs

      // under some very narrow circumstances
      // the content will still be encrypted, for example if the user uploaded
      // the content from localhost but to the shared database (which gets mixed up by radiks).
      // this catches that error
      if (typeof content !== 'string') return this.setState({ error: true })
      const proofData = this.evaluateProof()
      this.setState({
        text: content,
        title,
        author,
        node,
        caveatKey,
        requirePayment,
        loading: false,
        proofData,
      })
    } else {
      this.setState({ loading: false })
    }
  }

  /*
   * Given a proof Id, we want to update the proof model that is saved in Radix
   * by getting a new hash and submitting it (automatically with Proof.submitHash())
   */
  async updateProof() {
    const { proofId } = this.document.attrs

    // if no proofId then we need to create it from scratch
    // this will save it with our associated document in radiks
    // TODO: may need to update the state though?
    if (!proofId) {
      this.setState(
        {
          loadingMessage: 'Creating a new proof...',
        },
        async () => {
          const proof = new Proof({ docId: this.document._id })
          this.setState(
            { loadingMessage: 'Saving proof data...' },
            async () => {
              await proof.save()
              assert(
                proof.attrs.proofHandles,
                'Could not retrieve proofs from Chainpoint'
              )

              this.setState({ backToPage: '/profile' })
            }
          )
        }
      )
    } else {
      this.setState(
        {
          loadingMessage: 'Updating proof of authenticity...',
        },
        async () => {
          // if we have a proofId then we need to get the proof w/ that id and update
          const proof = await Proof.findById(proofId)

          // when no hash is passed as an arg, it will generate a new one by retrieving
          // the document from radiks and re-creating the hash to submit
          await proof.submitHash()
          this.setState(
            { loadingMessage: 'Saving updated proof data...' },
            async () => {
              await proof.save()
              this.setState({ backToPage: '/profile' })
            }
          )
        }
      )
    }
  }

  handleValueChange(name, value) {
    this.setState({ [name]: value })
  }

  handleTabChange(tab) {
    this.setState({ tab })
  }

  handleCloseModal() {
    this.setState({ errorMessage: '' })
  }

  async handleDelete() {
    if (!window && !window.confifm) return
    const confirm = window.confirm(
      'Are you sure you want to delete this post? THIS ACTION CANNOT BE UNDONE.'
    )
    if (confirm) {
      this.setState(
        {
          loading: true,
          loadingMessage: 'Deleting post and blockchain proof...',
        },
        async () => {
          const proof = await Proof.findById(this.document.attrs.proofId)
          const promises = [this.document.destroy()]
          if (proof) promises.push(proof.destroy())
          await Promise.all(promises)
          this.props.clearDocumentList()
          this.setState({ backToPage: '/profile' })
        }
      )
    }
  }

  updateLoading() {
    this.setState({ loading: !this.state.loading })
  }

  async validateForm() {
    const { requirePayment, node, caveatKey } = this.state
    if (requirePayment) {
      // first test it is a valid URL
      new URL(node)

      let uri = node

      // trim trailing slash
      if (node[node.length - 1] === '/') uri = node.slice(0, node.length - 1)
      // now see if it conforms to the api
      const {
        data: { pubKey, socket },
      } = await get(`${uri}/api/node`)
      if (!pubKey || !socket)
        throw new Error(
          'Target paywall does not conform to boltwall specs. Please visit https://github.com/tierion/now-boltwall for more information on setting up a node to receive payments.'
        )
    }

    // if payment is required and we are mising either the nodeUri
    // or the caveat key password, then throw an error
    if (
      requirePayment &&
      (!node || !node.length || (!caveatKey || !caveatKey.length))
    )
      throw new Error(
        'Must provide valid paywall URI and password when requiring payment.'
      )
  }

  async handleSubmit() {
    let {
      title,
      text,
      author,
      node,
      caveatKey = false,
      requirePayment,
    } = this.state
    const { name, userId, edit } = this.props

    if (!author) author = name || 'Anonymous'
    const attrs = {
      title,
      content: text,
      author,
      userId,
      node,
      caveatKey,
      requirePayment,
    }

    try {
      await this.validateForm()
    } catch (e) {
      if (e.message.indexOf('Invalid URL') !== -1)
        return this.setState({
          errorMessage:
            'Paywall URI is invalid. Must be of the form http://example.com or https://example.com',
        })
      else
        return this.setState({
          errorMessage: `Problem with payment details: ${e.message}`,
        })
    }

    return
    // if we are in an edit screen then we want to update the current document
    if (edit) this.document.update(attrs)
    // otherwise current document is still null and we want to set it to a new value
    else this.document = new Document(attrs)
    this.setState(
      { loading: true, loadingMessage: 'Encrypting Content...' },
      async () => {
        await this.document.encryptContent()
        this.setState({ loadingMessage: 'Saving Document...' }, async () => {
          await this.document.save()
          this.setState(
            {
              loadingMessage: 'Creating hash of content...',
            },
            async () => {
              await this.updateProof()
            }
          )
        })
      }
    )
  }

  render() {
    const { edit, userId } = this.props
    const {
      loading,
      title,
      author,
      node,
      caveatKey,
      requirePayment,
      error,
      loadingMessage = null,
      proofData,
      errorMessage,
    } = this.state

    const editor = (
      <ReactMde
        onChange={value => this.handleValueChange('text', value)}
        value={this.state.text}
        generateMarkdownPreview={markdown =>
          Promise.resolve(this.converter.makeHtml(markdown))
        }
        onTabChange={tab => this.handleTabChange(tab)}
        selectedTab={this.state.tab}
        className="col"
      />
    )
    if (error)
      return (
        <div>
          It appears there was a problem retrieving the content for this post
          for editing. Check with the system administrator for more information.
        </div>
      )
    return (
      <React.Fragment>
        <Header as="h2">{edit ? 'Edit Document' : 'Add New Document'}</Header>
        {loading ? (
          <Dimmer active inverted>
            <Loader size="large">{loadingMessage && loadingMessage}</Loader>
          </Dimmer>
        ) : (
          ''
        )}
        <AddOrEditDoc
          editor={editor}
          edit={edit}
          title={title}
          author={author}
          userId={userId}
          requirePayment={requirePayment}
          caveatKey={caveatKey}
          node={node}
          handleValueChange={(name, value) =>
            this.handleValueChange(name, value)
          }
          handleDelete={() => this.handleDelete()}
          handleSubmit={() => this.handleSubmit()}
          proofData={proofData}
        />
        <Modal
          open={errorMessage && errorMessage.length ? true : false}
          basic
          size="small"
          onClose={() => this.handleCloseModal()}
        >
          <Header
            icon="exclamation triangle"
            content="Problem with your post"
          />
          <Modal.Content>
            <h3>{errorMessage}</h3>
          </Modal.Content>
        </Modal>
      </React.Fragment>
    )
  }
}

function mapStateToProps(state) {
  return {
    username: state.app.get('username'),
    userId: state.app.get('userId'),
    name: state.app.get('name'),
    aesKey: state.app.get('aesKey'),
  }
}

function mapDispatchToProps(dispatch) {
  return {
    clearDocumentList: () => dispatch(documentActions.clearDocumentList()),
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(AddOrEditDocContainer))
