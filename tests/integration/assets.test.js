import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { afterEach, beforeEach, describe, it } from 'node:test'

import { generateRevision } from '../../gulp/tasks/generate-revision.js'
import { generateSri } from '../../gulp/tasks/generate-sri.js'
import { streamToPromise } from '../../gulp/utils/helpers.js'
import {
  cleanupSandbox,
  createTestSandbox,
  writeFixtures,
} from '../test-helpers.js'

describe('Asset Pipeline Integration', () => {
  let sandbox

  beforeEach(async () => {
    sandbox = await createTestSandbox()
  })

  afterEach(async () => {
    await cleanupSandbox(sandbox)
  })

  it('should fingerprint assets and update HTML references', async () => {
    // Arrange
    const buildBase = path.join(sandbox, 'build')
    const manifestPath = path.join(sandbox, 'rev-manifest.json')

    const fixtures = {
      'build/assets/css/style.css': 'body { color: red; }',
      'build/index.html':
        '<html><head><link rel="stylesheet" href="assets/css/style.css"></head></html>',
    }
    await writeFixtures(sandbox, fixtures)

    // Act
    await generateRevision({
      inputAssets: [path.join(buildBase, 'assets/css/**/*.css')],
      inputHtml: [path.join(buildBase, '**/*.html')],
      buildBase,
      manifestPath,
    })

    // Assert
    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'))
    const revisionedName = manifest['assets/css/style.css']
    assert.ok(revisionedName.includes('style-')) // style-xxxx.css

    // Check if original file is deleted
    try {
      await fs.access(path.join(buildBase, 'assets/css/style.css'))
      assert.fail('Original file should have been deleted')
    } catch (e) {
      assert.strictEqual(e.code, 'ENOENT')
    }

    // Check if HTML is updated
    const htmlContent = await fs.readFile(
      path.join(buildBase, 'index.html'),
      'utf8'
    )
    assert.ok(htmlContent.includes(revisionedName))
  })

  it('should inject SRI hashes into HTML', async () => {
    // Arrange
    const buildBase = path.join(sandbox, 'build')
    const fixtures = {
      'build/assets/js/app.js': 'console.log("hello");',
      'build/index.html':
        '<html><body><script src="assets/js/app.js"></script></body></html>',
    }
    await writeFixtures(sandbox, fixtures)

    // Act
    const stream = await generateSri(
      path.join(buildBase, '**/*.html'),
      buildBase
    )
    await streamToPromise(stream)

    // Assert
    const htmlContent = await fs.readFile(
      path.join(buildBase, 'index.html'),
      'utf8'
    )
    assert.ok(htmlContent.includes('integrity="sha384-'))
  })
})
