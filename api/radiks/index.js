const { setup } = require('radiks-server')

const app = require('../index.js')

let RadiksController
app.use('/api/radiks', async (req, res, next) => {
  if (!RadiksController)
    RadiksController = await setup({
      mongoDBUrl: process.env.MONGODB_URI,
    })
  return RadiksController(req, res, next)
})

module.exports = app
