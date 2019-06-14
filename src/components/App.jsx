import React, { Component } from 'react'
import Profile from './Profile.jsx'
import { ReaderContainer } from '../containers'
import Signin from './Signin.jsx'
import { UserSession, AppConfig } from 'blockstack'
import { Menu, Icon, Sidebar, Segment } from 'semantic-ui-react'
import { Switch, Route, Link } from 'react-router-dom'

const appConfig = new AppConfig()
const userSession = new UserSession({ appConfig: appConfig })

export default class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      sidebarVisible: false,
    }
  }

  handleSignIn(e) {
    e.preventDefault()
    userSession.redirectToSignIn()
  }

  handleSignOut(e) {
    e.preventDefault()
    userSession.signUserOut(window.location.origin)
  }

  handleHideClick() {
    this.setState({ sidebarVisible: false })
  }

  handleShowClick() {
    this.setState({ sidebarVisible: true })
  }

  handleSidebarHide() {
    this.setState({ sidebarVisible: false })
  }

  render() {
    const { sidebarVisible } = this.state
    return (
      <div className="site-wrapper-inner">
        <Sidebar.Pushable as={Segment}>
          <Sidebar
            as={Menu}
            animation="overlay"
            icon="labeled"
            inverted
            onHide={() => this.handleSidebarHide()}
            visible={sidebarVisible}
            vertical
            width="thin"
          >
            <Link to="/" className="item">
              <Menu.Item>Home</Menu.Item>
            </Link>
            {!userSession.isUserSignedIn() ? (
              <React.Fragment>
                <Link to="/" className="item">
                  <Menu.Item>Browse</Menu.Item>
                </Link>
                <Menu.Item onClick={e => this.handleSignIn(e)}>
                  Sign In
                </Menu.Item>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <Link to="/" className="item">
                  <Menu.Item>Profile</Menu.Item>
                </Link>
                <Link to="/" className="item">
                  <Menu.Item>Browse</Menu.Item>
                </Link>
                <Menu.Item onClick={e => this.handleSignOut(e)}>
                  Signout
                </Menu.Item>
              </React.Fragment>
            )}
          </Sidebar>
          <Sidebar.Pusher style={{ backgroundColor: '#e91e63' }}>
            <div className="site-wrapper">
              <Menu inverted secondary>
                <Menu.Item onClick={() => this.handleShowClick()}>
                  <Icon
                    name="bars"
                    size="big"
                    color="black"
                    style={{ padding: '1rem' }}
                  />
                </Menu.Item>
              </Menu>
              {!userSession.isUserSignedIn() ? (
                <Signin
                  userSession={userSession}
                  handleSignIn={this.handleSignIn}
                />
              ) : (
                <Switch>
                  <Route
                    exact
                    path="/"
                    render={routeProps => (
                      <Profile
                        userSession={userSession}
                        handleSignOut={this.handleSignOut}
                        {...routeProps}
                      />
                    )}
                  />
                  <Route
                    path="/reader"
                    render={routeProps => (
                      <ReaderContainer
                        userSession={userSession}
                        {...routeProps}
                      />
                    )}
                  />
                </Switch>
              )}
            </div>
          </Sidebar.Pusher>
        </Sidebar.Pushable>
      </div>
    )
  }

  componentWillMount() {
    if (userSession.isSignInPending()) {
      userSession.handlePendingSignIn().then(userData => {
        window.location = window.location.origin
      })
    }
  }
}
