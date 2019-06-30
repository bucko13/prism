import React from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import { Segment, Icon, Popup, List } from 'semantic-ui-react'

import { documentPropTypes, proofDataPropTypes } from '../propTypes'

function DocumentLink({ doc }) {
  const { docId, title, proofId, proofData } = doc

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
      <ProofIcon proofId={proofId} proofData={proofData} />
    </Segment>
  )
}

DocumentLink.propTypes = {
  doc: documentPropTypes,
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
      trigger={<Icon name={iconType} style={{ cursor: 'pointer' }} />}
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
