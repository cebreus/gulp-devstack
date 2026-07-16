import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { afterEach, beforeEach, describe, it, mock } from 'node:test'

import { resolveConfig } from '../../gulp/config.js'
import processJs, { processAllJs } from '../../gulp/tasks/process-js.js'
import { runInSandbox, silenceConsole, writeFixtures } from '../test-helpers.js'

silenceConsole(beforeEach, afterEach, mock)

describe('Route JS Integration', () => {
  it('should preserve nested route structure for route-level scripts', async () => {
    await runInSandbox('process-js-routes', async (sandbox) => {
      await writeFixtures(sandbox, {
        'src/routes/index.js': 'console.log("home")',
        'src/routes/about/index.js': 'console.log("about")',
        'src/routes/blog/post.js': 'console.log("post")',
      })

      const config = resolveConfig('dev')
      const routesBase = path.join(sandbox, 'src', 'routes')
      const outputDir = path.join(sandbox, 'dist')

      await processJs(
        config,
        path.join(routesBase, '**/*.js').replace(/\\/g, '/'),
        outputDir,
        {
          bundle: config.concatFiles,
          minify: false,
          sourceMaps: false,
          base: routesBase,
        }
      )

      const expectedFiles = new Map([
        ['index.js', 'home'],
        ['about/index.js', 'about'],
        ['blog/post.js', 'post'],
      ])

      for (const [relativePath, expectedMarker] of expectedFiles) {
        const assetPath = path.join(outputDir, relativePath)
        const content = await fs.readFile(assetPath, 'utf8')
        assert.ok(content.includes(expectedMarker))
      }
    })
  })

  it('should compile both global and route-level scripts into their documented output paths', async () => {
    await runInSandbox('process-all-js', async (sandbox) => {
      await writeFixtures(sandbox, {
        'src/js/main.js': 'console.log("global")',
        'src/routes/about/index.js': 'console.log("about")',
      })

      const baseConfig = resolveConfig('dev')
      const srcBase = path.join(sandbox, 'src')
      const routesBase = path.join(srcBase, 'routes')
      const outputDir = path.join(sandbox, 'dist')
      const config = {
        ...baseConfig,
        srcBase,
        routesBase,
        jsFiles: path.join(srcBase, 'js', '**/*.js').replace(/\\/g, '/'),
        paths: {
          ...baseConfig.paths,
          js: outputDir,
        },
      }

      await processAllJs(config)

      const globalScript = await fs.readFile(
        path.join(outputDir, 'main.js'),
        'utf8'
      )
      const routeScript = await fs.readFile(
        path.join(outputDir, 'about', 'index.js'),
        'utf8'
      )

      assert.ok(globalScript.includes('global'))
      assert.ok(routeScript.includes('about'))
    })
  })
})
