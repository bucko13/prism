import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { Button, Input } from 'semantic-ui-react'

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
      caveatKey: PropTypes.string,
    }
  }

  render() {
    const {
      title = '',
      author = '',
      handleValueChange,
      handleSubmit,
      editor,
      node = '',
      caveatKey = '',
    } = this.props
    return (
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
            retrieving invoices and setting authentication macaroons. These can
            be easily deployed with an OpenNode Lightning instance and a (WIP){' '}
            <a href="https://zeit.co" target="_blank" rel="noopener noreferrer">
              zeit builder
            </a>{' '}
            for deployment. Visit the{' '}
            <a
              href="https://github.com/bucko13/ln-builder"
              target="_blank"
              rel="noopener noreferrer"
            >
              LN Builder repo
            </a>{' '}
            to learn more and clone the project to deploy your own.
          </p>
          <Input
            label="Lightning URI"
            className="col-md-6 my-md-0 my-3"
            placeholder="Full address where node can be accessed"
            value={node}
            onChange={e => handleValueChange('node', e.target.value)}
          />
          <Input
            label="Passphrase"
            className="col-md-6"
            placeholder="Enter a secure, random key"
            type="password"
            value={caveatKey}
            onChange={e => handleValueChange('caveatKey', e.target.value)}
          />
          <p className="col" style={{ fontStyle: 'italic', fontSize: '.9rem' }}>
            The passphrase is used to ensure that your lightning node properly
            authenticates users that want to access your document after
            successful payments. Required if setting a Lightning URI.
          </p>
        </div>
        <div className="row mb-4 col-lg-8"></div>
        <div className="row justify-content-end col-lg-8">
          <Button className="col-sm-2" onClick={() => handleSubmit()}>
            Submit
          </Button>
        </div>
      </div>
    )
  }
}
