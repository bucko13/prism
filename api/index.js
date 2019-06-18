/* eslint-disable no-console */
const express = require('express')
const helmet = require('helmet')
const cookieSession = require('cookie-session')
const bodyParser = require('body-parser')
const app = express()

app.set('trust proxy', 1)

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
// app.use(helmet())

app.use(
  cookieSession({
    name: 'payment-config',
    maxAge: 86400000,
    secret: process.env.SESSION_SECRET || 'i_am_satoshi_08',
    // paymentConfig: { pendingTime: false }, // initialize session config for payment info
    foo: 'bar',
    overwrite: false,
    signed: true,
  })
)

module.exports = app
