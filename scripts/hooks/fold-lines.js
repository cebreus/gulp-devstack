import fs from 'node:fs'

const filePath = process.argv[2]
if (!filePath) {
  throw new Error('Expected a commit message file path')
}

const MAX_WIDTH = 100

const content = fs.readFileSync(filePath, 'utf8')
const lines = content.split('\n')

function wrapLine(line, maxWidth) {
  if (line.length <= maxWidth) {
    return [line]
  }

  const indentation = line.match(/^\s*/)[0]
  const text = line.slice(indentation.length)
  if (!text) {
    return [line]
  }

  const words = text.split(' ')
  const wrapped = []
  let current = indentation

  for (const word of words) {
    const next = current === indentation ? current + word : current + ' ' + word
    if (next.length <= maxWidth || current === indentation) {
      current = next
      continue
    }

    wrapped.push(current)
    current = indentation + word
  }

  if (current !== indentation) {
    wrapped.push(current)
  }

  return wrapped
}

const wrappedLines = lines.flatMap((line) => wrapLine(line, MAX_WIDTH))
fs.writeFileSync(filePath, wrappedLines.join('\n'))
