import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import ReactMde from 'react-mde'
import * as Showdown from 'showdown'
import 'react-mde/lib/styles/css/react-mde-all.css'

// import { readerActions } from '../store/actions'
import { AddDocComponent } from '../components'

class AddDocContainer extends PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      text: 'Add your text here',
      tab: 'write',
    }
    this.converter = new Showdown.Converter({
      tables: true,
      simplifiedAutoLink: true,
      strikethrough: true,
      tasklists: true,
    })
  }

  handleValueChange(value) {
    this.setState({ text: value })
  }

  handleTabChange(tab) {
    this.setState({ tab })
  }

  handleSubmit() {
    console.log('this.text:', this.state.text)
  }

  render() {
    const editor = (
      <ReactMde
        onChange={value => this.handleValueChange(value)}
        value={this.state.text}
        generateMarkdownPreview={markdown =>
          Promise.resolve(this.converter.makeHtml(markdown))
        }
        onTabChange={tab => this.handleTabChange(tab)}
        selectedTab={this.state.tab}
        className="col-lg-8 mb-4"
        style={{ border: 'none' }}
      />
    )
    return (
      <AddDocComponent
        editor={editor}
        handleSubmit={() => this.handleSubmit()}
      />
    )
  }
}

function mapStateToProps(state) {
  return {
    // wordCount: state.reader.get('wordCount'),
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
