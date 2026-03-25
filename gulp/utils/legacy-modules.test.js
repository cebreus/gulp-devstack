/**
 * Unit tests for Legacy Modules utility
 * Tests CommonJS module loading and caching functionality
 */
import {
  clearLegacyModuleCache,
  getLegacyModuleStats,
  initializeGoogleWebFonts,
  isLegacyModuleAvailable,
  requireLegacyModule,
} from './legacy-modules.js'
import assert from 'node:assert'
import { afterEach, beforeEach, describe, it } from 'node:test'

describe('Legacy Modules', () => {
  beforeEach(() => {
    clearLegacyModuleCache()
  })

  afterEach(() => {
    clearLegacyModuleCache()
  })

  describe('requireLegacyModule', () => {
    it('should load and cache CommonJS modules', () => {
      const fs1 = requireLegacyModule('fs')
      const fs2 = requireLegacyModule('fs')

      assert.strictEqual(fs1, fs2, 'Modules should be identical (cached)')
      assert.ok(fs1.readFileSync, 'Should have fs functionality')

      const stats = getLegacyModuleStats()
      assert.strictEqual(
        stats.cachedLegacyModules,
        1,
        'Should have 1 cached module'
      )
      assert.ok(
        stats.cachedModuleNames.includes('fs'),
        'Should include fs module'
      )
    })

    it('should handle CommonJS module loading errors', () => {
      try {
        requireLegacyModule('non-existent-commonjs-module-12345')
        assert.fail('Should have thrown an error')
      } catch (error) {
        assert.ok(error.message.includes('Failed to load CommonJS module'))
        assert.ok(error.message.includes('non-existent-commonjs-module-12345'))
      }
    })

    it('should load built-in Node.js modules', () => {
      const path = requireLegacyModule('path')
      const crypto = requireLegacyModule('crypto')

      assert.ok(path.join, 'Should have path.join function')
      assert.ok(crypto.createHash, 'Should have crypto.createHash function')

      const stats = getLegacyModuleStats()
      assert.strictEqual(
        stats.cachedLegacyModules,
        2,
        'Should have 2 cached modules'
      )
    })
  })

  describe('initializeGoogleWebFonts', () => {
    it('should attempt to load Google Web Fonts module', () => {
      try {
        const googleWebFonts = initializeGoogleWebFonts()
        // If the module is installed, it should return something
        assert.ok(
          googleWebFonts !== undefined,
          'Should return the module if available'
        )
      } catch (error) {
        // If the module is not installed, it should throw an error
        assert.ok(
          error.message.includes('gulp-google-webfonts'),
          'Should mention the module name'
        )
      }
    })
  })

  describe('clearLegacyModuleCache', () => {
    it('should clear all cached legacy modules', () => {
      requireLegacyModule('fs')
      requireLegacyModule('path')

      let stats = getLegacyModuleStats()
      assert.strictEqual(
        stats.cachedLegacyModules,
        2,
        'Should have 2 cached modules'
      )

      clearLegacyModuleCache()

      stats = getLegacyModuleStats()
      assert.strictEqual(
        stats.cachedLegacyModules,
        0,
        'Should have no cached modules'
      )
    })

    it('should clear modules by pattern', () => {
      requireLegacyModule('fs')
      requireLegacyModule('path')
      requireLegacyModule('crypto')

      clearLegacyModuleCache('fs')

      const stats = getLegacyModuleStats()
      assert.strictEqual(
        stats.cachedLegacyModules,
        2,
        'Should have 2 remaining modules'
      )
      assert.ok(
        !stats.cachedModuleNames.includes('fs'),
        'Should not have fs module'
      )
      assert.ok(
        stats.cachedModuleNames.includes('path'),
        'Should still have path module'
      )
      assert.ok(
        stats.cachedModuleNames.includes('crypto'),
        'Should still have crypto module'
      )
    })
  })

  describe('getLegacyModuleStats', () => {
    it('should return accurate cache statistics', () => {
      const initialStats = getLegacyModuleStats()
      assert.strictEqual(initialStats.cachedLegacyModules, 0)
      assert.ok(Array.isArray(initialStats.cachedModuleNames))

      requireLegacyModule('fs')
      requireLegacyModule('path')

      const stats = getLegacyModuleStats()
      assert.strictEqual(
        stats.cachedLegacyModules,
        2,
        'Should have 2 cached modules'
      )
      assert.ok(
        stats.cachedModuleNames.includes('fs'),
        'Should include fs module'
      )
      assert.ok(
        stats.cachedModuleNames.includes('path'),
        'Should include path module'
      )
    })
  })

  describe('isLegacyModuleAvailable', () => {
    it('should check if built-in modules are available', () => {
      assert.strictEqual(
        isLegacyModuleAvailable('fs'),
        true,
        'fs module should be available'
      )
      assert.strictEqual(
        isLegacyModuleAvailable('path'),
        true,
        'path module should be available'
      )
      assert.strictEqual(
        isLegacyModuleAvailable('crypto'),
        true,
        'crypto module should be available'
      )
    })

    it('should return false for non-existent modules', () => {
      assert.strictEqual(
        isLegacyModuleAvailable('non-existent-module-12345'),
        false,
        'Non-existent module should not be available'
      )
    })

    it('should check third-party module availability', () => {
      // These tests depend on what's actually installed
      const gulpAvailable = isLegacyModuleAvailable('gulp')
      const gulpSassAvailable = isLegacyModuleAvailable('gulp-sass')

      assert.ok(
        typeof gulpAvailable === 'boolean',
        'Should return boolean for gulp'
      )
      assert.ok(
        typeof gulpSassAvailable === 'boolean',
        'Should return boolean for gulp-sass'
      )
    })
  })

  describe('performance', () => {
    it('should be faster on subsequent loads', () => {
      const start1 = performance.now()
      requireLegacyModule('crypto')
      const time1 = performance.now() - start1

      const start2 = performance.now()
      requireLegacyModule('crypto')
      const time2 = performance.now() - start2

      assert.ok(time2 < time1, 'Cached load should be faster than initial load')
    })
  })
})
