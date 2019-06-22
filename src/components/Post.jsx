import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { Header } from 'semantic-ui-react'

export default class Post extends PureComponent {
  constructor(props) {
    super(props)
  }

  static get propTypes() {
    return {
      title: PropTypes.string,
      content: PropTypes.string,
      author: PropTypes.string,
      docId: PropTypes.string,
    }
  }

  render() {
    const { title, author, content } = this.props
    return (
      <div>
        <Header as="h2">{title}</Header>
        <Header as="h4">By: {author}</Header>
        <p>{content}</p>
      </div>
    )
  }
}
