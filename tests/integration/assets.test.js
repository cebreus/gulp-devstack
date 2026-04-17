import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { describe, it } from 'node:test'

import { generateRevision } from '../../gulp/tasks/generate-revision.js'
import { generateSri } from '../../gulp/tasks/generate-sri.js'
import { streamToPromise } from '../../gulp/utils/index.js'
import { runInSandbox, writeFixtures } from '../test-helpers.js'

describe('Asset Pipeline Integration', function testAssetPipeline() {
  it('should fingerprint assets and update HTML references', async function testAssetFingerprinting() {
    await runInSandbox(
      'assets-revision',
      async function executeRevisionTest(sandbox) {
        const testDir = path.join(sandbox, 'revision-test')
        const buildBase = path.join(testDir, 'build')
        const manifestPath = path.join(testDir, 'rev-manifest.json')

        const assetFixtures = {
          'build/assets/css/style.css': 'body { color: red; }',
          'build/index.html':
            '<html><head><link rel="stylesheet" href="assets/css/style.css"></head></html>',
        }
        await writeFixtures(testDir, assetFixtures)

        await generateRevision({
          inputAssets: path.join(buildBase, '**/*.css'),
          inputHtml: path.join(buildBase, '**/*.html'),
          buildBase,
          manifestPath,
        })

        const manifestContent = await fs.readFile(manifestPath, 'utf8')
        const manifest = JSON.parse(manifestContent)
        const revisionedName = manifest['assets/css/style.css']
        assert.ok(revisionedName.includes('style-'))

        await assert.rejects(
          async function verifyOriginalFileRemoved() {
            await fs.access(path.join(buildBase, 'assets/css/style.css'))
          },
          { code: 'ENOENT' }
        )

        const updatedHtmlContent = await fs.readFile(
          path.join(buildBase, 'index.html'),
          'utf8'
        )
        assert.ok(updatedHtmlContent.includes(revisionedName))
      }
    )
  })

  it('should inject SRI hashes into HTML', async function testSriInjection() {
    await runInSandbox('assets-sri', async function executeSriTest(sandbox) {
      const testDir = path.join(sandbox, 'sri-test')
      const buildBase = path.join(testDir, 'build')
      const sriFixtures = {
        'build/assets/js/app.js': 'console.log("hello");',
        'build/index.html':
          '<html><body><script src="assets/js/app.js"></script></body></html>',
      }
      await writeFixtures(testDir, sriFixtures)

      const stream = await generateSri(
        path.join(buildBase, '**/*.html'),
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
