import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'

import App from './components/App.jsx'
import createStore from './store'

// Require Sass file so webpack can build it
import 'semantic-ui-css/semantic.min.css'
import 'semantic-ui-css/themes/default/assets/fonts/icons.eot'
import 'bootstrap/dist/css/bootstrap-grid.css'
import './styles/style.css'

const store = createStore({})

ReactDOM.render(
  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>,
  document.getElementById('root')
)
