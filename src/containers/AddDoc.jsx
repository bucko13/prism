import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import assert from 'bsert'
import { connect } from 'react-redux'
import ReactMde from 'react-mde'
import { Header, Loader, Dimmer } from 'semantic-ui-react'
import * as Showdown from 'showdown'
import 'react-mde/lib/styles/css/react-mde-all.css'

import { Document, Proof } from '../models'
import { AddDocComponent } from '../components'

class AddDocContainer extends PureComponent {
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
    }
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
        requirePayment = true,
      } = this.document.attrs

      this.setState({
        text: content,
        title,
        author,
        node,
        caveatKey,
        requirePayment,
        loading: false,
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
    const { proofId, _id } = this.document.attrs

    // if no proofId then we need to create it from scratch
    // this will save it with our associated document in radiks
    // TODO: may need to update the state though?
    if (!proofId) {
      const proof = new Proof({ docId: _id })
      await proof.save()
      assert(
        proof.attrs.proofHandles,
        'Could not retrieve proofs from Chainpoint'
      )
    } else {
      // if we have a proofId then we need to get the proof w/ that id and update
      const proof = await Proof.findById(proofId)

      // when no hash is passed as an arg, it will generate a new one by retrieving
      // the document from radiks and re-creating the hash to submit
      await proof.submitHash()
      await proof.save()
    }
  }

  handleValueChange(name, value) {
    this.setState({ [name]: value })
  }

  handleTabChange(tab) {
    this.setState({ tab })
  }

  async handleSubmit() {
    let { title, text, author, node, caveatKey } = this.state
    const { name, userId, edit } = this.props
    if (!author) author = name || 'Anonymous'
    const attrs = {
      title,
      content: text,
      author,
      userId,
      node,
      caveatKey,
    }

    // if we are in an edit screen then we want to update the current document
    if (edit) this.document.update(attrs)
    // otherwise current document is still null and we want to set it to a new value
    else this.document = new Document(attrs)
    this.setState({ loading: true }, async () => {
      await this.document.encryptContent()
      await this.document.save()
      await this.updateProof()
      window.location = window.location.origin + '/profile'
    })
  }

  render() {
    const { edit } = this.props
    const {
      loading,
      title,
      author,
      node,
      caveatKey,
      requirePayment,
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

    return (
      <React.Fragment>
        <Header as="h2">{edit ? 'Edit Document' : 'Add New Document'}</Header>
        {loading ? (
          <Dimmer active inverted>
            <Loader size="large" />
          </Dimmer>
        ) : (
          ''
        )}
        <AddDocComponent
          editor={editor}
          title={title}
          author={author}
          requirePayment={requirePayment}
          caveatKey={caveatKey}
          node={node}
          handleValueChange={(name, value) =>
            this.handleValueChange(name, value)
          }
          handleSubmit={() => this.handleSubmit()}
        />
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
    // updateText: () => {
    //   dispatch(readerActions.updateText())
    // },
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AddDocContainer)
