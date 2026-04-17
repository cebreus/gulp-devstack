import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { describe, it } from 'node:test'

import { resolveConfig } from '../../gulp/config.js'
import {
  buildSassPipeline,
  compileRouteStyles,
} from '../../gulp/tasks/process-sass.js'
import { streamToPromise } from '../../gulp/utils/index.js'
import { runInSandbox, writeFixtures } from '../test-helpers.js'

describe('Sass Pipeline Integration', function testSassPipeline() {
  it('should catch and handle sass compilation errors', async function testSassCompilationError() {
    await runInSandbox(
      'sass-error',
      async function executeSassErrorTest(sandbox) {
        const errorFixtures = {
          'src/style.scss': 'body { color: $non-existent-variable; }',
        }
        await writeFixtures(sandbox, errorFixtures)
        const outputDir = path.join(sandbox, 'dist')

        const devConfig = resolveConfig('dev')

        const sassPipeline = await buildSassPipeline(devConfig, {
          src: path.join(sandbox, 'src/style.scss'),
          dest: outputDir,
          skipIntegrity: true,
        })
        await streamToPromise(sassPipeline)

        const cssFileExists = await fs
          .access(path.join(outputDir, 'style.css'))
          .then(function onAccessSuccess() {
            return true
          })
          .catch(function onAccessError() {
            return false
          })
        assert.strictEqual(
          cssFileExists,
          false,
          'CSS file should not exist on compilation error'
        )
      }
    )
  })

  it('should return immediately when no route styles are found', async function testEmptyRouteStyles() {
    const devConfig = resolveConfig('dev')
    await assert.doesNotReject(async function executeCompileRouteStyles() {
      await compileRouteStyles(devConfig)
    })
  })

  it('should support custom postcss plugins', async function testPostcssPlugins() {
    await runInSandbox(
      'sass-postcss',
      async function executePostcssTest(sandbox) {
        const postcssFixtures = {
          'src/style.scss':
            'body { display: flex; color: blue; background: green; }',
        }
        await writeFixtures(sandbox, postcssFixtures)
        const outputDir = path.join(sandbox, 'dist')

        const devConfig = resolveConfig('dev')
        const sassPipeline = await buildSassPipeline(devConfig, {
          src: path.join(sandbox, 'src/style.scss'),
          dest: outputDir,
          postcssPlugins: [],
          minify: false,
          skipIntegrity: true,
        })
        await streamToPromise(sassPipeline)

        const generatedCss = await fs.readFile(
          path.join(outputDir, 'style.css'),
          'utf8'
        )
        assert.ok(generatedCss.length > 0)
        assert.ok(generatedCss.includes('display: flex'))
      }
    )
  })
})
