import React from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import { Segment, Icon, Popup, List, Header, Loader } from 'semantic-ui-react'

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
              state: doc,
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

  if (!proofId || proofData === null) {
    iconType = 'question circle outline'
    content = (
      <div>
        <p>
          No anchor or proof data available. Initialization can take a couple
          minutes. If this is your post, make sure to load your profile page to
          initialize then refresh again within 24 hours to save final anchor.
        </p>
      </div>
    )
  } else if (proofData && proofData.height) {
    // document is successfully anchored
    iconType = 'check circle outline'
    const time = new Date(proofData.submittedAt).toLocaleString('en-us', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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
  } else if (proofData && proofData.type && !proofData.height) {
    // If there is a proofData type, but no height
    // that means we have a cal anchor but no btc anchor
    iconType = 'clock outline'
    // time since initial anchor in seconds
    const timeSince = Math.floor(
      (Date.now() - new Date(proofData.submittedAt)) / 1000
    )
    // assuming around 2 hours for a proof to be anchored to bitcoin
    const timeLeft = Math.floor((60 * 60 * 2 - timeSince) / 60)
    if (timeLeft === 0)
      <div>
        <p>
          Proof should be anchored but couldn&apos;t find corresponding proof.
          If this post is yours, you may need to reload the post on your profile
          to re-anchor.
        </p>
      </div>
    else
      content = (
        <div>
          <p>
            The proof for this document is still being processed. Final
            anchoring on the bitcoin blockchain will happen in approx. ~
            {timeLeft > 0 ? timeLeft : 0} minutes.
          </p>
        </div>
      )
  }

  return (
    <Popup
      trigger={
        content ? (
          <Icon
            name={iconType}
            style={{ cursor: 'pointer' }}
            className="col-1"
          />
        ) : (
          <Loader active inline />
        )
      }
      on="click"
    >
      {content
        ? content
        : 'Fetching proof status from the network (can take a couple minutes for new posts)'}
    </Popup>
  )
}

ProofIcon.propTypes = {
  proofId: PropTypes.string,
  proofData: proofDataPropTypes,
}

export default DocumentLink
