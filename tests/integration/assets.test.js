import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { afterEach, beforeEach, describe, it, mock } from 'node:test'

import generateRevision from '../../gulp/tasks/generate-revision.js'
import generateSri from '../../gulp/tasks/generate-sri.js'
import { streamToPromise } from '../../gulp/utils/index.js'
import { runInSandbox, silenceConsole, writeFixtures } from '../test-helpers.js'

silenceConsole(beforeEach, afterEach, mock)

describe('Asset Pipeline Integration', () => {
  it('should fingerprint assets and update HTML references', async () => {
    await runInSandbox('assets-revision', async (sandbox) => {
      const testDir = path.join(sandbox, 'revision-test')
      const buildBase = path.join(testDir, 'build')
      const manifestPath = path.join(testDir, 'rev-manifest.json')

      const assetFixtures = {
        'build/assets/css/style.css': 'body { color: red; }',
        'build/index.html':
          '<html><head><link rel="stylesheet" href="assets/css/style.css"></head></html>',
      }
      await writeFixtures(testDir, assetFixtures)

      const results = await generateRevision({
        inputAssets: [path.join(buildBase, '**/*.css').replace(/\\/g, '/')],
        inputHtml: [path.join(buildBase, '**/*.html').replace(/\\/g, '/')],
        buildBase,
        manifestPath,
      })

      const manifestContent = await fs.readFile(manifestPath, 'utf8')
      const manifest = JSON.parse(manifestContent)
      const revisionedName = manifest['assets/css/style.css']
      assert.ok(revisionedName.includes('style-'))

      await assert.rejects(
        async () => {
          await fs.access(path.join(buildBase, 'assets/css/style.css'))
        },
        { code: 'ENOENT' }
      )

      const updatedHtmlContent = await fs.readFile(
        path.join(buildBase, 'index.html'),
        'utf8'
      )
      assert.ok(updatedHtmlContent.includes(revisionedName))
    })
  })

  it('should inject SRI hashes into HTML', async () => {
    await runInSandbox('assets-sri', async (sandbox) => {
      const testDir = path.join(sandbox, 'sri-test')
      const buildBase = path.join(testDir, 'build')
      const sriFixtures = {
        'build/assets/js/app.js': 'console.log("hello");',
        'build/index.html':
          '<html><body><script src="assets/js/app.js"></script></body></html>',
      }
      await writeFixtures(testDir, sriFixtures)

      const stream = await generateSri(
        path.join(buildBase, '**/*.html').replace(/\\/g, '/'),
        buildBase
      )
      await streamToPromise(stream)

      const updatedHtmlContent = await fs.readFile(
        path.join(buildBase, 'index.html'),
        'utf8'
      )
      assert.ok(updatedHtmlContent.includes('integrity="sha384-'))
    })
  })
})
