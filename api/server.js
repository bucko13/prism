const dotenv = require('dotenv')
dotenv.config({ path: '../.env' })
const metadataApp = require('./metadata/index')
const port = process.env.PORT || 3001

metadataApp.listen(port, () => console.log(`listening on port ${port}!`))
