import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter } from 'react-router-dom'

import App from './components/App.jsx'

// Require Sass file so webpack can build it
import 'semantic-ui-css/semantic.min.css'
import 'semantic-ui-css/themes/default/assets/fonts/icons.eot'
import bootstrap from 'bootstrap/dist/css/bootstrap-grid.css'
import style from './styles/style.css'

ReactDOM.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
  document.getElementById('root')
)
