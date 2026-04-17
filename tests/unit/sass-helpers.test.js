import assert from 'node:assert/strict'
import path from 'node:path'
import { describe, it } from 'node:test'

import { resolveConfig } from '../../gulp/config.js'
import { buildSassIncludePaths } from '../../gulp/tasks/process-sass.js'

describe('Sass Helpers (Unit)', function sassHelpersTestSuite() {
  const config = resolveConfig('dev')

  describe('buildSassIncludePaths', function buildSassIncludePathsTestSuite() {
    it('should return standard include paths by default', function testDefaultIncludePaths() {
      const paths = buildSassIncludePaths(null, config)

      const hasSrc = paths.some(function checkSrcPath(p) {
        return p.endsWith('src')
      })
      const hasNodeModules = paths.some(function checkNodeModulesPath(p) {
        return p.endsWith('node_modules')
      })
      const hasCwd = paths.includes(path.resolve('./'))

      assert.ok(hasSrc, 'Should include src directory')
      assert.ok(hasNodeModules, 'Should include node_modules')
      assert.ok(hasCwd, 'Should include current working directory')
    })

    it('should append extra path when provided', function testExtraIncludePath() {
      const extraPath = 'src/components/special'
      const paths = buildSassIncludePaths(extraPath, config)

      const hasExtra = paths.includes(path.resolve(extraPath))
      assert.ok(hasExtra, 'Should include the extra specified path')
    })

    it('should correctly resolve paths with custom buildConfig', function testCustomConfigPaths() {
      const mockConfig = { sassBase: './custom/scss' }
      const paths = buildSassIncludePaths(null, mockConfig)

      const hasCustomBase = paths.includes(path.resolve(mockConfig.sassBase))
      assert.ok(hasCustomBase, 'Should respect sassBase from provided config')
    })
  })
})
