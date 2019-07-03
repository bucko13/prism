import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { Segment, Dimmer, Loader } from 'semantic-ui-react'

import { DocumentLink } from '.'
import { documentPropTypes } from '../propTypes'

export default class Profile extends PureComponent {
  constructor(props) {
    super(props)
  }

  static get propTypes() {
    return {
      documents: PropTypes.arrayOf(documentPropTypes).isRequired,
      node: PropTypes.string,
      getNodeInfo: PropTypes.func.isRequired,
      getDocumentList: PropTypes.func.isRequired,
      clearDocumentList: PropTypes.func.isRequired,
      getProofs: PropTypes.func.isRequired,
    }
  }

  async componentDidMount() {
    const { getDocumentList, getNodeInfo } = this.props
    await getDocumentList()
    await getNodeInfo()
  }

  componentWillUnmount() {
    this.props.clearDocumentList()
  }

  async getNodeInfo() {
    const resp = await fetch('/api/node', {
      method: 'GET',
      credentials: 'include',
    })
    const info = await resp.json()
    return info
  }

  render() {
    const { documents, node } = this.props

    return (
      <div className="panel-welcome" id="section-2">
        <img src="/logo.png" />
        <h3 className="m-0">Your Keys, Your Content.</h3>
        <h2 style={{ fontStyle: 'italic' }} className="mt-0">
          Own the conversation.
        </h2>
        <p className="lead">
          Don&apos;t have a testnet lightning wallet? Head on over to{' '}
          <a href="https://htlc.me/" target="_blank" rel="noopener noreferrer">
            htlc.me
          </a>{' '}
          to create one and test out the app
        </p>
        {/* the new documents list from radiks */}
        <div className="docs-list" style={{ width: '50%', margin: 'auto' }}>
          {documents.length ? (
            documents.map((doc, index) => (
              <DocumentLink doc={doc} key={index} />
            ))
          ) : (
            <Dimmer active inverted>
              <Loader size="large" />
            </Dimmer>
          )}
        </div>
        {/* end the documents list from radiks */}
        {node && node.length ? (
          <div className="row justify-content-center">
            <div className="col-6">
              <Segment color="green">
                Connect w/ our node:{' '}
                <span className="enable-select" style={{ overflow: 'hidden' }}>
                  {node}
                </span>
              </Segment>
            </div>
          </div>
        ) : (
          ''
        )}
      </div>
    )
  }
}
