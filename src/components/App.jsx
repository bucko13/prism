import React, { Component, createRef } from 'react'
import PropTypes from 'prop-types'
import { UserSession, AppConfig } from 'blockstack'
import { Menu, Icon, Sidebar, Segment, Ref } from 'semantic-ui-react'
import { Switch, Route, Link } from 'react-router-dom'
import { configure, User, getConfig } from 'radiks'
import { get } from 'axios'

import {
  AddOrEditDocContainer,
  ProfileContainer,
  PostContainer,
  BrowseContainer,
} from '../containers'
import { LandingPage } from '.'

const appConfig = new AppConfig(['store_write', 'publish_data'])
const userSession = new UserSession({ appConfig: appConfig })

// TODO: Paramaterize the server address
configure({
  apiServer: '/api',
  userSession,
})

export default class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      sidebarVisible: false,
    }
  }

  segmentRef = createRef()

  static get propTypes() {
    return {
      setPubKey: PropTypes.func.isRequired,
      saveUser: PropTypes.func.isRequired,
    }
  }

  async componentDidMount() {
    const { userSession } = getConfig()
    if (userSession.isSignInPending()) {
      await userSession.handlePendingSignIn()
      await User.createWithCurrentUser()
      window.location = window.location.origin
    }
    const {
      data: { pubKey },
    } = await get('/api/radiks/key')
    if (pubKey) this.props.setPubKey(pubKey)
    // eslint-disable-next-line no-console
    else console.error('Unable to retrieve pubkey from app server')

    // this action then sets the resulting aes key on the store
    this.props.saveUser()
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
      <div className="site-wrapper">
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
            target={this.segmentRef}
          >
            <Link to="/" className="item">
              <Menu.Item>Home</Menu.Item>
            </Link>
            {!userSession.isUserSignedIn() ? (
              <React.Fragment>
                <Link to="/browse" className="item">
                  <Menu.Item>Browse</Menu.Item>
                </Link>
                <Menu.Item onClick={e => this.handleSignIn(e)}>
                  Sign In
                </Menu.Item>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <Link to="/profile" className="item">
                  <Menu.Item>Profile</Menu.Item>
                </Link>
                <Link to="/add-doc" className="item">
                  <Menu.Item>New Post</Menu.Item>
                </Link>
                <Link to="/browse" className="item">
                  <Menu.Item>Browse</Menu.Item>
                </Link>
                <Menu.Item onClick={e => this.handleSignOut(e)}>
                  Signout
                </Menu.Item>
              </React.Fragment>
            )}
          </Sidebar>
          <Sidebar.Pusher
            style={{
              // backgroundColor: '#e91e63',
              backgroundColor: 'white',
              height: 'auto',
            }}
          >
            <Ref innerRef={this.segmentRef}>
              <div className="site-wrapper-inner container-fluid mb-4">
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
                <Switch>
                  {!userSession.isUserSignedIn() ? (
                    <Route
                      exact
                      path="/"
                      render={() => (
                        <LandingPage
                          userSession={userSession}
                          handleSignIn={this.handleSignIn}
                        />
                      )}
                    />
                  ) : (
                    <React.Fragment>
                      {/* These are the routes that are only available if logged in*/}
                      <Route
                        exact
                        path="/"
                        render={routeProps => (
                          <BrowseContainer
                            userSession={userSession}
                            handleSignOut={this.handleSignOut}
                            {...routeProps}
                          />
                        )}
                      />
                      <Route
                        exact
                        path="/profile"
                        render={routeProps => (
                          <ProfileContainer
                            userSession={userSession}
                            handleSignOut={this.handleSignOut}
                            {...routeProps}
                          />
                        )}
                      />
                      <Route
                        path="/add-doc"
                        render={routeProps => (
                          <AddOrEditDocContainer
                            userSession={userSession}
                            {...routeProps}
                          />
                        )}
                      />
                      <Route
                        exact
                        path="/browse"
                        render={routeProps => (
                          <BrowseContainer {...routeProps} />
                        )}
                      />
                      <Route
                        path="/post"
                        render={routeProps => <PostContainer {...routeProps} />}
                      />
                    </React.Fragment>
                  )}
                  <Route
                    exact
                    path="/browse"
                    render={routeProps => <BrowseContainer {...routeProps} />}
                  />
                  <Route
                    path="/post"
                    render={routeProps => <PostContainer {...routeProps} />}
                  />
                </Switch>
              </div>
            </Ref>
          </Sidebar.Pusher>
        </Sidebar.Pushable>
      </div>
    )
  }
}
