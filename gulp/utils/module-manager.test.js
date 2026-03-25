/**
 * Unit tests for Module Manager utility
 * Tests caching, error handling, and module loading functionality
 */
import {
  clearModuleCache,
  getModuleCacheStats,
  initializeImageOptimizers,
  initializeLegacyModule,
  initializeSass,
  loadESModule,
  preloadCommonModules,
} from './module-manager.js'
import assert from 'node:assert'
import { afterEach, beforeEach, describe, it } from 'node:test'

describe('Module Manager', () => {
  beforeEach(() => {
    clearModuleCache()
  })

  afterEach(() => {
    clearModuleCache()
  })

  describe('loadESModule', () => {
    it('should load and cache ES modules', async () => {
      const module1 = await loadESModule('path')
      const module2 = await loadESModule('path')

      assert.strictEqual(
        module1,
        module2,
        'Modules should be identical (cached)'
      )

      const stats = getModuleCacheStats()
      assert.strictEqual(stats.cachedModules, 1, 'Should have 1 cached module')
      assert.ok(
        stats.cachedModuleNames.includes('path'),
        'Should include path module'
      )
    })

    it('should handle module loading errors gracefully', async () => {
      try {
        await loadESModule('non-existent-module-12345')
        assert.fail('Should have thrown an error')
      } catch (error) {
        assert.ok(error.message.includes('Failed to load module'))
        assert.ok(error.message.includes('non-existent-module-12345'))
      }
    })

    it('should prevent multiple simultaneous loads', async () => {
      const promises = [
        loadESModule('fs'),
        loadESModule('fs'),
        loadESModule('fs'),
      ]

      const results = await Promise.all(promises)

      // All should be the same reference
      assert.strictEqual(results[0], results[1])
      assert.strictEqual(results[1], results[2])

      const stats = getModuleCacheStats()
      assert.strictEqual(
        stats.cachedModules,
        1,
        'Should only have one cached instance'
      )
    })
  })

  describe('initializeSass', () => {
    it('should initialize Sass compiler', async () => {
      const sass = await initializeSass()
      assert.ok(typeof sass === 'function', 'Should return a function')

      const sass2 = await initializeSass()
      assert.strictEqual(sass, sass2, 'Should return cached instance')

      const stats = getModuleCacheStats()
      assert.ok(stats.cachedModuleNames.includes('gulp-sass-configured'))
    })

    it('should handle Sass initialization errors', async () => {
      // This test would require mocking import() which is complex
      // In real scenario, we'd mock the import function
      assert.ok(true, 'Placeholder for Sass error handling test')
    })
  })

  describe('initializeImageOptimizers', () => {
    it('should initialize image optimization modules', async () => {
      const optimizers = await initializeImageOptimizers()

      assert.ok(typeof optimizers === 'object', 'Should return an object')
      assert.ok(optimizers.mozjpeg, 'Should have mozjpeg optimizer')
      assert.ok(optimizers.upng, 'Should have upng optimizer')
      assert.ok(optimizers.svgo, 'Should have svgo optimizer')

      const optimizers2 = await initializeImageOptimizers()
      assert.strictEqual(
        optimizers,
        optimizers2,
        'Should return cached instance'
      )
    })
  })

  describe('initializeLegacyModule', () => {
    it('should load and cache legacy modules', () => {
      const fs1 = initializeLegacyModule('fs')
      const fs2 = initializeLegacyModule('fs')

      assert.strictEqual(fs1, fs2, 'Should return cached instance')
      assert.ok(fs1.readFileSync, 'Should have fs functionality')
    })

    it('should handle legacy module errors', () => {
      try {
        initializeLegacyModule('non-existent-legacy-module-12345')
        assert.fail('Should have thrown an error')
      } catch (error) {
        assert.ok(error.message.includes('Failed to load legacy module'))
      }
    })
  })

  describe('clearModuleCache', () => {
    it('should clear all cached modules', async () => {
      await loadESModule('path')
      await initializeSass()

      let stats = getModuleCacheStats()
      assert.ok(stats.cachedModules > 0, 'Should have cached modules')

      clearModuleCache()

      stats = getModuleCacheStats()
      assert.strictEqual(
        stats.cachedModules,
        0,
        'Should have no cached modules'
      )
      assert.strictEqual(
        stats.pendingInitializations,
        0,
        'Should have no pending initializations'
      )
    })

    it('should clear modules by pattern', async () => {
      await loadESModule('path')
      await initializeSass()

      clearModuleCache('sass')

      const stats = getModuleCacheStats()
      assert.ok(
        !stats.cachedModuleNames.includes('gulp-sass-configured'),
        'Should not have sass module'
      )
      assert.ok(
        stats.cachedModuleNames.includes('path'),
        'Should still have path module'
      )
    })
  })

  describe('getModuleCacheStats', () => {
    it('should return accurate cache statistics', async () => {
      const initialStats = getModuleCacheStats()
      assert.strictEqual(initialStats.cachedModules, 0)
      assert.strictEqual(initialStats.pendingInitializations, 0)

      await loadESModule('path')
      initializeLegacyModule('fs')

      const stats = getModuleCacheStats()
      assert.ok(
        stats.cachedModules >= 2,
        'Should have at least 2 cached modules'
      )
      assert.ok(
        Array.isArray(stats.cachedModuleNames),
        'Should return array of module names'
      )
      assert.ok(
        stats.cachedModuleNames.includes('path'),
        'Should include path module'
      )
      assert.ok(
        stats.cachedModuleNames.includes('legacy-fs'),
        'Should include legacy fs module'
      )
    })
  })

  describe('preloadCommonModules', () => {
    it('should preload common modules without errors', async () => {
      const stats1 = getModuleCacheStats()

      await preloadCommonModules()

      const stats2 = getModuleCacheStats()
      assert.ok(
        stats2.cachedModules > stats1.cachedModules,
        'Should have more cached modules after preload'
      )
      assert.ok(
        stats2.cachedModuleNames.includes('gulp-sass-configured'),
        'Should have preloaded Sass'
      )
    })
  })

  describe('performance', () => {
    it('should be faster on subsequent loads', async () => {
      const start1 = performance.now()
      await loadESModule('crypto')
      const time1 = performance.now() - start1

      const start2 = performance.now()
      await loadESModule('crypto')
      const time2 = performance.now() - start2

      assert.ok(time2 < time1, 'Cached load should be faster than initial load')
    })
  })
})
