const app = require('../index.js')
const routes = require('./routes')

app.use(routes)
module.exports = app
