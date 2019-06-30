import React from 'react'
import { Link } from 'react-router-dom'
import { Segment, Icon } from 'semantic-ui-react'

import { documentPropTypes } from '../propTypes'

function DocumentLink({ doc }) {
  const { docId, title, proofId, proofData } = doc
  let statusIcon
  if (proofId && proofData) statusIcon = <Icon name="check circle outline" />
  else if (proofId && (!proofData || !proofData.height))
    statusIcon = <Icon name="clock outline" />
  else statusIcon = <Icon name="question circle outline" />
  return (
    <Segment className="doc mb-3" size="large" inverted>
      <Link
        to={{
          pathname: '/post',
          search: `?id=${docId}`,
          query: doc,
        }}
        style={{ margin: '0 1rem', padding: '.5rem', color: 'white' }}
      >
        {' '}
        {title}
      </Link>
      {statusIcon}
    </Segment>
  )
}

DocumentLink.propTypes = {
  doc: documentPropTypes,
}

export default DocumentLink
