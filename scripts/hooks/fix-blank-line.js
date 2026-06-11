import fs from 'node:fs'

const filePath = process.argv[2]
if (!filePath) {
  process.exit(0)
}

const content = fs.readFileSync(filePath, 'utf8')
const lines = content.split('\n')
if (lines.length > 1 && lines[0].trim() && lines[1].trim()) {
  lines.splice(1, 0, '')
  fs.writeFileSync(filePath, lines.join('\n'))
}
