import fs from 'node:fs'

const filePath = process.argv[2]
if (!filePath) {
  process.exit(0)
}

const MAX_WIDTH = 100

const content = fs.readFileSync(filePath, 'utf8')
const lines = content.split('\n')

function wrapLine(line, maxWidth) {
  if (line.length <= maxWidth) {
    return [line]
  }

  const words = line.split(' ')
  const wrapped = []
  let current = ''

  for (const word of words) {
    const next = current ? current + ' ' + word : word
    if (next.length <= maxWidth) {
      current = next
      continue
    }

    if (current) {
      wrapped.push(current)
    }

    if (word.length <= maxWidth) {
      current = word
      continue
    }

    let rest = word
    while (rest.length > maxWidth) {
      wrapped.push(rest.slice(0, maxWidth))
      rest = rest.slice(maxWidth)
    }
    current = rest
  }

  if (current) {
    wrapped.push(current)
  }

  return wrapped
}

const wrappedLines = lines.flatMap((line) => wrapLine(line, MAX_WIDTH))
fs.writeFileSync(filePath, wrappedLines.join('\n'))
