import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import {
  Button,
  Input,
  Checkbox,
  Header,
  Popup,
  Icon,
  Segment,
} from 'semantic-ui-react'

import { ProofDetails } from '.'

export default class AddOrEditDocComponent extends PureComponent {
  constructor(props) {
    super(props)
  }

  static get propTypes() {
    return {
      editor: PropTypes.element.isRequired,
      handleSubmit: PropTypes.func.isRequired,
      handleDelete: PropTypes.func.isRequired,
      handleValueChange: PropTypes.func.isRequired,
      title: PropTypes.string,
      author: PropTypes.string,
      node: PropTypes.string,
      caveatKey: PropTypes.string,
      edit: PropTypes.bool, // whether or not we are in edit or add mode
      userId: PropTypes.string,
      proofData: PropTypes.object,
      requirePayment: PropTypes.bool.isRequired,
      wordCount: PropTypes.number.isRequired,
    }
  }

  render() {
    const {
      title = '',
      author = '',
      handleValueChange,
      handleSubmit,
      handleDelete,
      editor,
      node = '',
      caveatKey = '',
      edit,
      userId,
      proofData,
      requirePayment,
      wordCount,
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
        <div className="row col-lg-8 mb-4 justify-content-center">
          <p>
            {wordCount} words | Reading Time: ~{Math.floor(wordCount / 200)}{' '}
            minutes
          </p>
        </div>
        <div className="row col-lg-8 mb-4 justify-content-center">
          <Segment compact>
            <Checkbox
              toggle
              label="Require payment to view?"
              checked={requirePayment}
              onClick={() =>
                handleValueChange('requirePayment', !requirePayment)
              }
            />
          </Segment>
        </div>
        <div className="row col-lg-8">
          <div className="col-md-3">
            <Header as="h3" style={{ display: 'inline-block' }}>
              Payment Details
            </Header>
            <Popup
              trigger={
                <Icon
                  name="info circle"
                  color="grey"
                  style={{ verticalAlign: 'super', fontSize: '1em' }}
                />
              }
              content={
                <React.Fragment>
                  <p>
                    <strong>
                      Required even for free posts if you&apos;d like to receive
                      tips.
                    </strong>
                  </p>
                  <p>
                    Easily deploy your own payment server for free with{' '}
                    <a
                      href="https://github.com/tierion/now-boltwall"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      now-boltwall
                    </a>{' '}
                    which supports both{' '}
                    <a
                      href="https://opennode.co"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      OpenNode
                    </a>{' '}
                    or your own self-hosted node.
                  </p>
                </React.Fragment>
              }
              on="hover"
              hideOnScroll
              hoverable
            />
          </div>
        </div>
        <div className="row mb-4 col-lg-8">
          <Input
            label="Paywall URI"
            className="col-md-6 my-md-0 my-3"
            placeholder="Full address where node can be accessed"
            error={requirePayment && (!node || !node.length) ? true : false}
            value={node}
            onChange={e => handleValueChange('node', e.target.value)}
          />
          <Input
            label="Passphrase"
            className="col-md-6"
            placeholder="Enter a secure, random key"
            type="password"
            error={
              (requirePayment && (!caveatKey || !caveatKey.length)) ||
              (node && (!caveatKey || !caveatKey.length))
                ? true
                : false
            }
            value={caveatKey}
            onChange={e => handleValueChange('caveatKey', e.target.value)}
          />
          <p className="col" style={{ fontStyle: 'italic', fontSize: '.9rem' }}>
            The passphrase is used to ensure that your lightning node properly
            authenticates users that want to access your document after
            successful payments. Required if setting a Paywall URI.
          </p>
        </div>
        <div className="row justify-content-end col-lg-8">
          {edit && (
            <Button
              className="col-sm-2 order-last order-sm-first"
              color="red"
              onClick={() => handleDelete()}
            >
              DELETE
            </Button>
          )}
          <Button
            className="col-sm-2  mb-3 mb-sm-0 ml-0 ml-sm-3"
            disabled={!(userId && userId.length)}
            loading={!(userId && userId.length)}
            onClick={() => handleSubmit()}
          >
            Submit
          </Button>
        </div>
        <div className="row justify-content-end col-lg-8">
          {proofData && Object.keys(proofData).length ? (
            <ProofDetails proofData={proofData} />
          ) : (
            ''
          )}
        </div>
      </div>
    )
  }
}
