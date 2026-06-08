import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { afterEach, beforeEach, describe, it, mock } from 'node:test'

import { resolveConfig } from '../../gulp/config.js'
import processSass from '../../gulp/tasks/process-sass.js'
import { runInSandbox, silenceConsole, writeFixtures } from '../test-helpers.js'

silenceConsole(beforeEach, afterEach, mock)

describe('Sass Nested Routes Preservation', () => {
  it('should preserve nested directory structure for route styles', async () => {
    await runInSandbox('sass-nesting', async (sandbox) => {
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

      const devConfig = resolveConfig('dev')
      await processSass(
        devConfig,
        path.join(routesSourceBase, '**/*.scss').replace(/\\/g, '/'),
        stylesDestBase,
        {
          base: routesSourceBase,
          skipIntegrity: true,
        }
      )

      const expectedCssFiles = [
        { path: 'index.css', expectedSelector: 'background' },
        { path: 'about/index.css', expectedSelector: 'background' },
        { path: 'deep/nested/style.css', expectedSelector: 'background' },
      ]

      for (const { path: relativePath, expectedSelector } of expectedCssFiles) {
        const fullOutputPath = path.join(stylesDestBase, relativePath)
        const cssContent = await fs.readFile(fullOutputPath, 'utf8')
        assert.ok(
          cssContent.length > 0,
          `Expected non-empty CSS file: ${relativePath}`
        )
        assert.ok(
          cssContent.includes(expectedSelector),
          `Expected selector '${expectedSelector}' in ${relativePath}, got: ${cssContent}`
        )
      }
    })
  })
})
