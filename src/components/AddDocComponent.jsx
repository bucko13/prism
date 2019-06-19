import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { Header, Button } from 'semantic-ui-react'

export default class AddDocComponent extends PureComponent {
  constructor(props) {
    super(props)
  }

  static get propTypes() {
    return {
      editor: PropTypes.element.isRequired,
      handleSubmit: PropTypes.func.isRequired,
    }
  }

  render() {
    return (
      <div>
        <Header as="h2">Add New Document</Header>
        <div className="row justify-content-center">{this.props.editor}</div>
        <Button onClick={() => this.props.handleSubmit()}>Submit</Button>
      </div>
    )
  }
}
