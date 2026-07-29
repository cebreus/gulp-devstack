import fs from 'node:fs'

const filePath = process.argv[2]
if (!filePath) {
  throw new Error('Expected a commit message file path')
}

const content = fs.readFileSync(filePath, 'utf8')
const lineEnding = content.includes('\r\n') ? '\r\n' : '\n'
const lines = content.split(lineEnding)
if (lines.length > 1 && lines[0].trim() && lines[1].trim()) {
  lines.splice(1, 0, '')
  fs.writeFileSync(filePath, lines.join(lineEnding))
}
