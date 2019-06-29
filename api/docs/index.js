/* eslint-disable no-console*/

const path = require('path')
const fs = require('fs')
const router = require('express').Router()

const app = require('../index.js')
const DOCS_DIR = path.resolve(__dirname, '../../files')

router.get('/api/docs', async (req, res) => {
  const docs = await getDocTitles()
  res.status(200).json(docs)
})

router.get('/api/docs/:filename/text', async (req, res, next) => {
  const filename = req.params.filename
  const count = parseInt(req.query.count, 10) || 0

  try {
    // prepare doc data
    const filePath = path.resolve(DOCS_DIR, filename)
    const rawDoc = fs.readFileSync(filePath, 'utf8')
    const doc = JSON.parse(rawDoc)

    if (!doc.text) return next('No text for ', doc.title)

    if (!req.session.pages) req.session.pages = 0
    req.session.pages++

    // return text at that count
    return res.status(200).json(doc.text[count])
  } catch (e) {
    next(e)
  }
})

router.get('/api/docs/:filename', async (req, res, next) => {
  const filename = req.params.filename

  try {
    // prepare doc data
    const filePath = path.resolve(DOCS_DIR, filename)
    let rawDoc = fs.readFileSync(filePath, 'utf8')

    rawDoc = JSON.parse(rawDoc)
    return res.status(200).json({
      filename,
      title: rawDoc.title,
      count: rawDoc.count,
    })
  } catch (e) {
    next(e)
  }
})

async function getDocTitles() {
  const files = await fs.readdirSync(DOCS_DIR)
  return files.map((filename, index) => {
    const { title, subtitle, count: wordCount } = require(path.resolve(
      DOCS_DIR,
      filename
    ))
    return { title, subtitle, filename, id: index, wordCount }
  })
}

app.use(router)
module.exports = app
