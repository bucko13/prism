import React from 'react'
import PropTypes from 'prop-types'
import { Dimmer, Loader } from 'semantic-ui-react'

import { documentPropTypes } from '../propTypes'
import { DocumentLink } from '.'

export default function DocumentList({ documents, loading, edit = false }) {
  return (
    <div
      className="docs-list row justify-content-center"
      style={{ minHeight: '200px' }}
    >
      <div className="col-12 col-md-6">
        {documents.length ? (
          documents.map((doc, index) => (
            <DocumentLink key={index} doc={doc} edit={edit} />
          ))
        ) : loading ? (
          <Dimmer active inverted>
            <Loader size="large" />
          </Dimmer>
        ) : (
          <h4>No Documents Available</h4>
        )}
      </div>
    </div>
  )
}

DocumentList.propTypes = {
  documents: PropTypes.arrayOf(documentPropTypes),
  loading: PropTypes.bool,
  edit: PropTypes.bool,
}
