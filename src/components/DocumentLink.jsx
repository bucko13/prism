import React from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import { Segment, Icon, Popup, List, Header } from 'semantic-ui-react'

import { documentPropTypes, proofDataPropTypes } from '../propTypes'

function DocumentLink({ doc, edit }) {
  const { _id, title, proofId, proofData, author } = doc

  return (
    <Segment
      className="doc mb-3 row align-items-center justify-content-between"
      size="large"
      inverted
    >
      <div className="col-10" style={{ textAlign: 'left' }}>
        <Header as="h3" className="mb-0">
          <Link
            to={{
              pathname: '/post',
              search: `?id=${_id}${edit ? '&edit=true' : ''}`,
              query: doc,
            }}
            style={{ color: 'white' }}
          >
            {' '}
            {title}
          </Link>
        </Header>
        <p style={{ fontStyle: 'italic' }}>Article by: {author}</p>
      </div>
      <ProofIcon proofId={proofId} proofData={proofData} />
    </Segment>
  )
}

DocumentLink.propTypes = {
  doc: documentPropTypes,
  edit: PropTypes.bool,
}

function ProofIcon({ proofId, proofData }) {
  let iconType, content

  if (proofId && proofData) {
    // document is successfully anchored
    iconType = 'check circle outline'
    const time = new Date(proofData.submittedAt).toLocaleString('en-us', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      minute: 'numeric',
      hour: 'numeric',
    })

    content = (
      <List style={{ textAlign: 'left' }} className="enable-select">
        <List.Item
          icon="chain"
          content={
            <span>
              Block Height:{' '}
              <a
                href="https://blockstream.info/testnet/"
                target="_blank"
                rel="noopener noreferrer"
              >
                {proofData.height}
              </a>
            </span>
          }
        />
        <List.Item
          icon="lock"
          content={<span>Merkle Root: {proofData.merkleRoot}</span>}
        />
        <List.Item
          icon="calendar"
          content={<span>Time Anchored: {time}</span>}
        />
      </List>
    )
  } else if (proofId && (!proofData || !proofData.height)) {
    // there is a proof Id but still no anchor data which means
    // it is still waiting to be updated
    iconType = 'clock outline'
    content = (
      <div>
        <p>
          This document hasn&apos;t been anchored to the blockchain yet. Please
          wait 1-2 hours for final anchoring
        </p>
      </div>
    )
  } else {
    iconType = 'question circle outline'
    content = (
      <div>
        <p>
          No anchor or proof data available. If this is your post, make sure to
          load your profile page to initialize anchoring
        </p>
      </div>
    )
  }
  return (
    <Popup
      trigger={
        <Icon name={iconType} style={{ cursor: 'pointer' }} className="col-1" />
      }
      on="click"
    >
      {content}
    </Popup>
  )
}

ProofIcon.propTypes = {
  proofId: PropTypes.string,
  proofData: proofDataPropTypes,
}

export default DocumentLink
