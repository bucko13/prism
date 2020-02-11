/* eslint-disable no-console */
const express = require('express')
// const helmet = require('helmet')
const cookieSession = require('cookie-session')
const bodyParser = require('body-parser')
const cors = require('cors')

const app = express()
app.set('trust proxy', 1)

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(cors())

app.use(
  cookieSession({
    name: 'macaroon',
    maxAge: 86400000,
    secret: process.env.SESSION_SECRET || 'i_am_satoshi_08',
    overwrite: false,
    signed: true,
  })
)

module.exports = app
