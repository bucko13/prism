import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import ReactMde from 'react-mde'
import * as Showdown from 'showdown'
import 'react-mde/lib/styles/css/react-mde-all.css'

import { Document } from '../models'
import { AddDocComponent } from '../components'

class AddDocContainer extends PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      text: 'Add your text here',
      title: '',
      tab: 'write',
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
    }
  }

  handleValueChange(name, value) {
    this.setState({ [name]: value })
  }

  handleTabChange(tab) {
    this.setState({ tab })
  }

  async handleSubmit() {
    const { title, text } = this.state
    const { name, userId, aesKey } = this.props
    const doc = new Document({
      title,
      content: text,
      author: name || 'Anonymous',
      userId,
      aesKey,
    })
    await doc.encryptContent()
    await doc.save()
  }

  render() {
    const editor = (
      <ReactMde
        onChange={value => this.handleValueChange('text', value)}
        value={this.state.text}
        generateMarkdownPreview={markdown =>
          Promise.resolve(this.converter.makeHtml(markdown))
        }
        onTabChange={tab => this.handleTabChange(tab)}
        selectedTab={this.state.tab}
      />
    )
    return (
      <AddDocComponent
        editor={editor}
        title={this.state.title}
        handleValueChange={(name, value) => this.handleValueChange(name, value)}
        handleSubmit={() => this.handleSubmit()}
      />
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
