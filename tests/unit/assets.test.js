import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import * as config from '../../gulp/config.js'
import { getEsbuildConfig } from '../../gulp/tasks/process-js.js'
import { getSassCompilerOptions } from '../../gulp/tasks/process-sass.js'
import { mockEnv } from '../test-helpers.js'

describe('Asset Pipeline Utilities', () => {
  describe('getEsbuildConfig', () => {
    it('should return dev configuration when flags are missing', () => {
      // Arrange
      const env = mockEnv({ BUILD_MODE: 'dev' })

      // Act - We mock getters behavior by providing env
      const esConfig = getEsbuildConfig(
        {},
        {
          minifyJs: () => config.minifyJs(env),
          sourceMaps: () => config.sourceMaps(env),
        }
      )

      // Assert
      assert.strictEqual(esConfig.minify, false)
      assert.strictEqual(esConfig.sourcemap, 'external')
    })

    it('should return production configuration for build mode', () => {
      // Arrange
      const env = mockEnv({ BUILD_MODE: 'build' })

      // Act
      const esConfig = getEsbuildConfig(
        { minify: true, sourceMaps: false },
        {
          minifyJs: () => config.minifyJs(env),
          sourceMaps: () => config.sourceMaps(env),
        }
      )

      // Assert
      assert.strictEqual(esConfig.minify, true)
      assert.strictEqual(esConfig.sourcemap, false)
    })
  })

  describe('getSassCompilerOptions', () => {
    it('should return expanded style for dev', () => {
      const env = mockEnv({ BUILD_MODE: 'dev' })
      const options = getSassCompilerOptions({}, false, {
        sassBase: config.sassBase,
      })
      assert.strictEqual(options.outputStyle, 'expanded')
    })

    it('should return compressed style for production', () => {
      const options = getSassCompilerOptions({}, true, config)
      assert.strictEqual(options.outputStyle, 'compressed')
    })

    it('should include core paths in includePaths', () => {
      const options = getSassCompilerOptions({}, false, config)
      assert.ok(options.includePaths.some((p) => p.includes('scss')))
      assert.ok(options.includePaths.some((p) => p.includes('node_modules')))
    })
  })
})
