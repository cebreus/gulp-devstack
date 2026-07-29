import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import * as configModule from '../../gulp/config.js'
import { resolveConfig } from '../../gulp/config.js'

describe('Configuration System (Approach B)', () => {
  describe('resolveConfig', () => {
    it('should return correct object for dev mode', () => {
      const config = resolveConfig('dev')

      assert.strictEqual(config.version, 'dev')
      assert.strictEqual(config.minifyJs, false)
      assert.strictEqual(config.sourceMaps, true)
      assert.strictEqual(config.paths.build, './build-dev')
      assert.strictEqual(config.paths.sass, './build-dev/assets/css')
    })

    it('should return correct object for build mode', () => {
      const config = resolveConfig('build')

      assert.strictEqual(config.version, 'prod')
      assert.strictEqual(config.minifyJs, true)
      assert.strictEqual(config.sourceMaps, false)
      assert.strictEqual(config.paths.build, './build-prod')
    })

    it('should return correct object for export mode', () => {
      const config = resolveConfig('export')

      assert.strictEqual(config.version, 'export')
      assert.strictEqual(config.minifyJs, false)
      assert.strictEqual(config.optimizeImages, true)
      assert.strictEqual(config.formatCode, true)
    })

    it('should throw error for invalid build mode', () => {
      assert.throws(() => {
        resolveConfig('invalid')
      }, /Invalid BUILD_MODE/)
    })

    it('should throw error when mode is missing', () => {
      assert.throws(() => {
        resolveConfig()
      }, /Invalid BUILD_MODE/)
    })

    it('should expose only resolveConfig as named public API', () => {
      assert.deepStrictEqual(Object.keys(configModule).sort(), [
        'resolveConfig',
      ])
    })
  })

  describe('Path Consistency', () => {
    it('should have consistent asset path structure across modes', () => {
      const dev = resolveConfig('dev')
      const prod = resolveConfig('build')

      assert.ok(dev.paths.js.endsWith('/assets/js'))
      assert.ok(prod.paths.js.endsWith('/assets/js'))
      assert.ok(dev.sassBase.includes('/scss'))
    })

    it('should split Sass watch scopes by compile target', () => {
      const config = resolveConfig('dev')

      assert.ok(config.bootstrapWatch.includes('./src/scss/bootstrap.scss'))
      assert.ok(config.projectSassWatch.includes('./src/scss/components.scss'))
      assert.ok(
        config.routeSassWatch.includes('./src/scss/_route-abstracts.scss')
      )
    })
  })

  describe('Lazy Environment Resolution', () => {
    it('should pick up SITE_BASE_URL from process.env at resolution time', () => {
      const oldUrl = process.env.SITE_BASE_URL
      try {
        process.env.SITE_BASE_URL = 'http://test.local'

        const config = resolveConfig('dev')
        assert.strictEqual(config.faviconGen.url, 'http://test.local')
      } finally {
        if (oldUrl === undefined) delete process.env.SITE_BASE_URL
        else process.env.SITE_BASE_URL = oldUrl
      }
    })

    it('should normalize environment output paths for POSIX globs', () => {
      const oldOutDir = process.env.GULP_OUT_DIR
      const oldTempDir = process.env.GULP_TEMP_DIR

      try {
        process.env.GULP_OUT_DIR = 'build\\prod'
        process.env.GULP_TEMP_DIR = '.temp\\pages'

        const config = resolveConfig('build')

        assert.strictEqual(config.buildBase, 'build/prod')
        assert.strictEqual(config.tempBase, '.temp/pages')
        assert.strictEqual(config.paths.sass, 'build/prod/assets/css')
        assert.strictEqual(config.datasetPagesBuild, '.temp/pages/pages')
      } finally {
        if (oldOutDir === undefined) delete process.env.GULP_OUT_DIR
        else process.env.GULP_OUT_DIR = oldOutDir
        if (oldTempDir === undefined) delete process.env.GULP_TEMP_DIR
        else process.env.GULP_TEMP_DIR = oldTempDir
      }
    })
  })
})
