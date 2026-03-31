import assert from 'node:assert/strict'
import path from 'node:path'
import { describe, it } from 'node:test'

import { buildSassIncludePaths } from '../../gulp/tasks/process-sass.js'

describe('Sass Helpers (Unit)', () => {
  describe('buildSassIncludePaths', () => {
    it('should return standard include paths by default', () => {
      const paths = buildSassIncludePaths()

      // Check for core paths
      const hasSrc = paths.some((p) => p.endsWith('src'))
      const hasNodeModules = paths.some((p) => p.endsWith('node_modules'))
      const hasCwd = paths.includes(path.resolve('./'))

      assert.ok(hasSrc, 'Should include src directory')
      assert.ok(hasNodeModules, 'Should include node_modules')
      assert.ok(hasCwd, 'Should include current working directory')
    })

    it('should append extra path when provided', () => {
      const extra = 'src/components/special'
      const paths = buildSassIncludePaths(extra)

      const hasExtra = paths.includes(path.resolve(extra))
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
