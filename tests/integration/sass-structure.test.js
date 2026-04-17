import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { describe, it } from 'node:test'

import { resolveConfig } from '../../gulp/config.js'
import { runInSandbox, writeFixtures } from '../test-helpers.js'

describe('Sass Nested Routes Preservation', function testSassStructure() {
  it('should preserve nested directory structure for route styles', async function testNestedStructure() {
    await runInSandbox(
      'sass-nesting',
      async function executeSassNestingTest(sandbox) {
        const sassFixtures = {
          'src/routes/index.scss':
            'body { background: white; color: black; margin: 0; }',
          'src/routes/about/index.scss':
            'body { background: blue; color: white; padding: 20px; }',
          'src/routes/deep/nested/style.scss':
            'body { background: red; display: flex; align-items: center; }',
        }
        await writeFixtures(sandbox, sassFixtures)

        const routesSourceBase = path.join(sandbox, 'src/routes')
        const stylesDestBase = path.join(sandbox, 'dist')

        const { buildSassPipeline } =
          await import('../../gulp/tasks/process-sass.js')
        const { streamToPromise } = await import('../../gulp/utils/index.js')

        const devConfig = resolveConfig('dev')
        const sassPipeline = await buildSassPipeline(devConfig, {
          src: path.join(routesSourceBase, '**/*.scss').replace(/\\/g, '/'),
          dest: stylesDestBase,
          base: routesSourceBase,
          skipIntegrity: true,
        })
        await streamToPromise(sassPipeline)

        const expectedCssFiles = [
          'index.css',
          'about/index.css',
          'deep/nested/style.css',
        ]

        for (const relativePath of expectedCssFiles) {
          const fullOutputPath = path.join(stylesDestBase, relativePath)
          const fileExists = await fs
            .access(fullOutputPath)
            .then(function onAccessSuccess() {
              return true
            })
            .catch(function onAccessError() {
              return false
            })
          assert.ok(fileExists, `Expected file missing: ${relativePath}`)
        }
      }
    )
  })
})
