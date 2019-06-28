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
      author: PropTypes.string,
      node: PropTypes.string,
    }
  }

  render() {
    const {
      title,
      author,
      handleValueChange,
      handleSubmit,
      editor,
      node,
    } = this.props
    return (
      <div>
        <Header as="h2">Add New Document</Header>
        <div className="row justify-content-center">
          <div className="row mb-4 col-lg-8">
            <Input
              label="Title"
              className="col"
              placeholder="Enter a document title..."
              value={title}
              onChange={e => handleValueChange('title', e.target.value)}
            />
          </div>
          <div className="row mb-4 col-lg-8">
            <Input
              label="Author"
              className="col"
              placeholder="Author- defaults to current user"
              value={author}
              onChange={e => handleValueChange('author', e.target.value)}
            />
          </div>
          <div className="row col-lg-8 mb-4">{editor}</div>
          <div className="row mb-4 col-lg-8">
            <p>
              The server at this address must conform to the expected api for
              retrieving invoices and setting access cookies. These can be
              easily deployed with an OpenNode Lightning instance and a (WIP){' '}
              <a
                href="https://zeit.co"
                target="_blank"
                rel="noopener noreferrer"
              >
                zeit builder
              </a>{' '}
              for deployment
            </p>

            <Input
              label="Lightning URI"
              className="col"
              placeholder="Enter full address where node can be accessed"
              value={node}
              onChange={e => handleValueChange('node', e.target.value)}
            />
          </div>
          <div className="row justify-content-end col-lg-8">
            <Button className="col-sm-2" onClick={() => handleSubmit()}>
              Submit
            </Button>
          </div>
        </div>
      </div>
    )
  }
}
