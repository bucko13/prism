import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { Header, Button, Input } from 'semantic-ui-react'

export default class AddDocComponent extends PureComponent {
  constructor(props) {
    super(props)
  }

  static get propTypes() {
    return {
      editor: PropTypes.element.isRequired,
      handleSubmit: PropTypes.func.isRequired,
      handleValueChange: PropTypes.func.isRequired,
      title: PropTypes.string,
    }
  }

  render() {
    return (
      <div>
        <Header as="h2">Add New Document</Header>
        <div className="row justify-content-center">
          <div className="row mb-4 col-lg-8">
            <Input
              label="Title"
              className="col"
              placeholder="Enter a document title..."
              value={this.props.title}
              onChange={e =>
                this.props.handleValueChange('title', e.target.value)
              }
            />
          </div>
          <div className="row col-lg-8 mb-4">{this.props.editor}</div>
          <div className="row justify-content-end col-lg-8">
            <Button
              className="col-sm-2"
              onClick={() => this.props.handleSubmit()}
            >
              Submit
            </Button>
          </div>
        </div>
      </div>
    )
  }
}
