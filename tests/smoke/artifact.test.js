import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { describe, it } from 'node:test'

const BUILD_DIRECTORY = path.resolve('build-prod')

describe('Production build artifact', () => {
  it('should contain a substantive homepage and assets', async () => {
    const generatedFiles = await fs.readdir(BUILD_DIRECTORY)

    assert.ok(generatedFiles.includes('index.html'))
    assert.ok(generatedFiles.includes('assets'))

    const indexHtml = await fs.readFile(
      path.join(BUILD_DIRECTORY, 'index.html'),
      'utf8'
    )

    assert.match(indexHtml, /<html/u)
    assert.match(indexHtml, /<body/u)
    assert.match(indexHtml, /\/assets\/(?:css|js)\/[^"']+-[0-9a-f]{10}\./u)
    assert.match(indexHtml, /integrity="sha384-/u)
    assert.match(
      indexHtml,
      /<link rel="manifest" href="\/manifest\.webmanifest">/u
    )
    assert.ok(indexHtml.length > 200)

    await fs.access(path.join(BUILD_DIRECTORY, 'favicon.ico'))
    const manifest = JSON.parse(
      await fs.readFile(
        path.join(BUILD_DIRECTORY, 'manifest.webmanifest'),
        'utf8'
      )
    )
    assert.ok(manifest.name)
  })
})
