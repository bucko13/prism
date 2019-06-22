import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Loader, Header, Dimmer } from 'semantic-ui-react'

import { Post } from '../components'
import { documentActions } from '../store/actions'

class PostContainer extends PureComponent {
  constructor(props) {
    super(props)
  }

  static get propTypes() {
    return {
      document: PropTypes.shape({
        title: PropTypes.string.isRequired,
        content: PropTypes.string.isRequired,
        author: PropTypes.string.isRequired,
        docId: PropTypes.string.isRequired,
      }),
      location: PropTypes.shape({
        search: PropTypes.string.isRequired,
      }).isRequired,
      setCurrentDoc: PropTypes.func.isRequired,
      clearCurrentDoc: PropTypes.func.isRequired,
    }
  }

  componentDidMount() {
    const {
      setCurrentDoc,
      location: { search },
    } = this.props
    let index = search.indexOf('id=')
    const docId = location.search.slice(index + 3)
    setCurrentDoc(docId)
  }

  componentWillUnmount() {
    this.props.clearCurrentDoc()
  }

  render() {
    const { document } = this.props
    // if still retrieving the document information
    // return the loader
    if (!document || !document.content.length)
      return (
        <Dimmer active inverted>
          <Header as="h4">Getting post...</Header>
          <Loader size="large" />
        </Dimmer>
      )

    // otherwise show the Post component with the document information
    // TODO: setup pagination for this to enable the paywall functionality
    return <Post {...document} />
  }
}

function mapStateToProps(state) {
  return {
    document: state.documents.get('currentDoc').toJS(),
  }
}

function mapDispatchToProps(dispatch) {
  return {
    setCurrentDoc: docId => {
      dispatch(documentActions.setCurrentDoc(docId))
    },
    clearCurrentDoc: () => {
      dispatch(documentActions.clearCurrentDoc())
    },
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(PostContainer)
