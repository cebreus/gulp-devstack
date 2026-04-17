import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { resolveConfig } from '../../gulp/config.js'

describe('Configuration System (Approach B)', function configSystemTests() {
  describe('resolveConfig', function resolveConfigTests() {
    it('should return correct object for dev mode', function verifyDevConfig() {
      const config = resolveConfig('dev')

      assert.strictEqual(config.version, 'dev')
      assert.strictEqual(config.minifyJs, false)
      assert.strictEqual(config.sourceMaps, true)
      assert.strictEqual(config.paths.build, './build-dev')
      assert.strictEqual(config.paths.sass, './build-dev/assets/css')
    })

    it('should return correct object for build mode', function verifyProdConfig() {
      const config = resolveConfig('build')

      assert.strictEqual(config.version, 'prod')
      assert.strictEqual(config.minifyJs, true)
      assert.strictEqual(config.sourceMaps, false)
      assert.strictEqual(config.paths.build, './build-prod')
    })

    it('should return correct object for export mode', function verifyExportConfig() {
      const config = resolveConfig('export')

      assert.strictEqual(config.version, 'export')
      assert.strictEqual(config.minifyJs, false)
      assert.strictEqual(config.optimizeImages, true)
      assert.strictEqual(config.formatCode, true)
    })

    it('should throw error for invalid build mode', function verifyInvalidModeError() {
      assert.throws(function runInvalidMode() {
        resolveConfig('invalid')
      }, /Invalid BUILD_MODE/)
    })

    it(' should throw error when mode is missing', function verifyMissingModeError() {
      assert.throws(function runMissingMode() {
        resolveConfig()
      }, /Invalid BUILD_MODE/)
    })
  })

  describe('Path Consistency', function pathConsistencyTests() {
    it('should have consistent asset path structure across modes', function verifyPathConsistency() {
      const dev = resolveConfig('dev')
      const prod = resolveConfig('build')

      assert.ok(dev.paths.js.endsWith('/assets/js'))
      assert.ok(prod.paths.js.endsWith('/assets/js'))
      assert.ok(dev.sassBase.includes('/scss'))
    })
  })

  describe('Lazy Environment Resolution', function environmentResolutionTests() {
    it('should pick up SITE_BASE_URL from process.env at resolution time', function verifyBaseUrlResolution() {
      const oldUrl = process.env.SITE_BASE_URL
      process.env.SITE_BASE_URL = 'http://test.local'

      const config = resolveConfig('dev')
      assert.strictEqual(config.baseUrl, 'http://test.local')
      assert.strictEqual(config.faviconGen.url, 'http://test.local')

      process.env.SITE_BASE_URL = oldUrl
    })
  })
})
