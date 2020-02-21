import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { Button, Input, Checkbox, Segment } from 'semantic-ui-react'

import { ProofDetails } from '.'
import { estimateReadingTime } from '../utils'

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
            {wordCount} words | Reading Time: ~{estimateReadingTime(wordCount)}{' '}
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
