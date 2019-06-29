import { connect } from 'react-redux'

import { appActions } from '../store/actions'
import { AppComponent } from '../components'

function mapStateToProps() {
  return {}
}

function mapDispatchToProps(dispatch) {
  return {
    setPubKey: pubKey => {
      dispatch(appActions.setPubKey(pubKey))
    },
    saveUser: () => {
      dispatch(appActions.saveUser())
    },
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AppComponent)
