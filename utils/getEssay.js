#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { parse } = require('url')
const request = require('request-promise-native')
const marked = require('marked')
const TurndownService = require('turndown')

async function getEssay(maxLen = 5, _url) {
  let url = _url || process.argv[2]

  let page, md
  try {
    page = await request(url)
  } catch (e) {
    console.log(e.message)
    process.exit(1)
  }

  if (path.extname(url).includes('md') || path.extname(url).includes('txt'))
    md = page
  else if (path.extname(url).includes('html')) {
    const turndownService = new TurndownService()
    md = turndownService.turndown(page)
  } else {
    console.error('Only supports markdown and html pages')
    process.exit(1)
  }

  let tokens = marked.lexer(md)
  let title, subtitle
  title = tokens.find(token => token.type === 'heading' && token.depth === 1)
    .text
  subtitle =
    tokens[1].type === 'heading' && tokens[1].depth > 1
      ? tokens[1].text
      : undefined
  if (title) tokens = tokens.slice(1)
  if (subtitle) tokens = tokens.slice(1)
  let count = 0
  const text = tokens.reduce((acc, curr) => {
    switch (curr.type) {
      case 'space':
      case 'code':
      case 'html':
        break
      case 'heading':
        acc.push(curr)
      case 'paragraph': {
        const words = curr.text.split(/[\s\n]/g)
        count += words.length
        while (words.length) {
          const text = words.splice(0, maxLen).join(' ')
          acc.push({ type: 'paragraph', text })
        }
      }
      default:
        break
    }
    return acc
  }, [])
  const fileName = title
    .replace(/[_:\/\[\]\(\)]/g, '')
    .replace(/\s/g, '-')
    .toLowerCase()
  fs.writeFileSync(
    path.resolve(__dirname, '../docs', `${fileName}.json`),
    JSON.stringify(
      {
        title,
        subtitle,
        text,
        count,
      },
      null,
      2
    )
  )
  return tokens
}

getEssay()
