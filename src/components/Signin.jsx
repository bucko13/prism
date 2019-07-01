import React, { Component } from 'react'
import PropTypes from 'prop-types'

export default class Signin extends Component {
  constructor(props) {
    super(props)
  }

  static get propTypes() {
    return {
      handleSignIn: PropTypes.func,
    }
  }
  render() {
    const { handleSignIn } = this.props

    return (
      <div className="panel-landing" id="section-1">
        <img src="/logo.png" />
        <h1 className="landing-heading mt-0">Welcome to Prism!</h1>
        <h3 className="mb-0">Your Keys, Your Content.</h3>
        <h3 style={{ fontStyle: 'italic' }} className="mt-0">
          Own the conversation.
        </h3>
        <p className="lead">
          <button
            className="btn btn-primary btn-lg"
            id="signin-button"
            onClick={handleSignIn.bind(this)}
          >
            Sign In with Blockstack
          </button>
        </p>
      </div>
    )
  }
}
