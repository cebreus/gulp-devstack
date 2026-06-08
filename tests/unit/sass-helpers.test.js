import assert from 'node:assert/strict'
import path from 'node:path'
import { describe, it } from 'node:test'

import { resolveConfig } from '../../gulp/config.js'
import * as sassModule from '../../gulp/tasks/process-sass.js'
import { buildSassIncludePaths } from '../../gulp/tasks/process-sass.js'

describe('Sass Helpers (Unit)', () => {
  const config = resolveConfig('dev')

  describe('public API boundaries', () => {
    it('should keep pipeline glue internal and expose only explicit seams', () => {
      assert.ok('buildSassIncludePaths' in sassModule)
      assert.ok('getSassCompilerOptions' in sassModule)
      assert.ok(!('buildSassPipeline' in sassModule))
      assert.ok(!('processSass' in sassModule))
    })
  })

  describe('buildSassIncludePaths', () => {
    it('should return standard include paths by default', () => {
      const paths = buildSassIncludePaths(null, config)

      const hasSrc = paths.some((p) => {
        return p.endsWith('src')
      })
      const hasNodeModules = paths.some((p) => {
        return p.endsWith('node_modules')
      })
      const hasCwd = paths.includes(process.cwd())

      assert.ok(hasSrc, 'Should include src directory')
      assert.ok(hasNodeModules, 'Should include node_modules')
      assert.ok(hasCwd, 'Should include current working directory')
    })

    it('should append extra path when provided', () => {
      const extraPath = 'src/components/special'
      const paths = buildSassIncludePaths(extraPath, config)

      const hasExtra = paths.includes(path.resolve(extraPath))
      assert.ok(hasExtra, 'Should include the extra specified path')
    })

    it('should correctly resolve paths with custom buildConfig', () => {
      const mockConfig = { sassBase: './custom/scss' }
      const paths = buildSassIncludePaths(null, mockConfig)

      const hasCustomBase = paths.includes(path.resolve(mockConfig.sassBase))
      assert.ok(hasCustomBase, 'Should respect sassBase from provided config')
    })
  })
})
