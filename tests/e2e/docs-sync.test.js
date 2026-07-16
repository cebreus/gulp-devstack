import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { describe, it } from 'node:test'
import { glob } from 'glob'

describe('Documentation Synchronization', () => {
  it('should ensure all pnpm scripts mentioned in markdown exist in package.json', async () => {
    const pkgContent = await fs.readFile('package.json', 'utf8')
    const packageJson = JSON.parse(pkgContent)
    const scripts = Object.keys(packageJson.scripts)
    const standardCmds = new Set([
      'install',
      'add',
      'i',
      'exec',
      'store',
      '-',
      'allowBuilds',
      'Overrides',
      'will',
    ])

    // Find all markdown files, ignoring node_modules, build folders, and sandboxes
    const mdFiles = await glob('**/*.md', {
      ignore: [
        'node_modules/**',
        'build-*/**',
        'tests/.sandboxes/**',
        'graphify-out/**',
        '.fallow/**',
      ],
    })

    const regex = /pnpm\s+(?:run\s+)?([a-zA-Z0-9:-]+)/g
    let hasError = false

    for (const file of mdFiles) {
      const content = await fs.readFile(file, 'utf8')
      let match

      while ((match = regex.exec(content)) !== null) {
        const scriptName = match[1]

        // Skip standard pnpm commands or placeholder text
        if (standardCmds.has(scriptName) || /^\d+$/.test(scriptName)) {
          continue
        }

        const exists = scripts.includes(scriptName)

        if (!exists) {
          console.error(
            `Documentation out of sync: File "${file}" mentions script "pnpm ${scriptName}" but "${scriptName}" is not defined in package.json.`
          )
          hasError = true
        }
      }
    }

    assert.ok(
      !hasError,
      'Found npm scripts mentioned in documentation that do not exist in package.json.'
    )
  })
})
