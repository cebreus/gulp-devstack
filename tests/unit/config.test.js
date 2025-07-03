import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  concatFiles,
  faviconBuild,
  fontLoadConfig,
  fontsBuild,
  formatCode,
  generateFavicons,
  getBaseUrl,
  getBuildConfig,
  getBuildPaths,
  getConfig,
  htmlBeautifyOptionsGetter,
  iconsBuild,
  imagesBuild,
  injectCdnJs,
  injectCss,
  injectJs,
  jsBuild,
  minifyCss,
  minifyJs,
  optimizeImages,
  postcssPluginsBase,
  sassBuild,
  sourceMaps,
  tplBuild,
  version,
} from '../../gulp/config.js'
import { getEnv as getEnvFromEnv } from '../../gulp/utils/env.js'
import { getEnv as getEnvFromHelpers } from '../../gulp/utils/helpers.js'
import { mockEnv } from '../test-helpers.js'

describe('Environment Utilities', () => {
  describe('getEnv', () => {
    it('should return fallback when key is missing', () => {
      // Arrange
      const env = {}

      // Act & Assert
      assert.strictEqual(getEnvFromEnv('MISSING', 'fallback', env), 'fallback')
      assert.strictEqual(
        getEnvFromHelpers('MISSING', 'fallback', env),
        'fallback'
      )
    })

    it('should parse boolean strings correctly', () => {
      // Arrange
      const env = {
        TRUE_VAL: 'true',
        FALSE_VAL: 'false',
      }

      // Act & Assert
      assert.strictEqual(getEnvFromEnv('TRUE_VAL', null, env), true)
      assert.strictEqual(getEnvFromEnv('FALSE_VAL', null, env), false)
    })

    it('should parse numeric strings correctly', () => {
      // Arrange
      const env = {
        NUM_VAL: '42',
        ZERO_VAL: '0',
      }

      // Act & Assert
      assert.strictEqual(getEnvFromEnv('NUM_VAL', null, env), 42)
      assert.strictEqual(getEnvFromEnv('ZERO_VAL', null, env), 0)
    })

    it('should keep regular strings unchanged', () => {
      // Arrange
      const env = {
        TEXT_VAL: 'hello-world',
      }

      // Act & Assert
      assert.strictEqual(getEnvFromEnv('TEXT_VAL', null, env), 'hello-world')
    })
  })

  describe('Configuration Resolution', () => {
    it('should return correct config for valid modes', () => {
      // Act
      const devConfig = getConfig('dev')
      const buildConfig = getConfig('build')

      // Assert
      assert.strictEqual(devConfig.version, 'dev')
      assert.strictEqual(buildConfig.version, 'prod')
    })

    it('should throw error for invalid build mode', () => {
      // Act & Assert
      assert.throws(() => {
        getConfig('invalid')
      }, /Invalid BUILD_MODE/)
    })

    it('should throw error when mode is missing in getConfig', () => {
      // Act & Assert
      assert.throws(() => {
        getConfig()
      }, /Build mode is required/)
    })

    it('should return normalized flags in getBuildConfig', () => {
      // Act
      const modeConfig = getBuildConfig('export')

      // Assert
      assert.strictEqual(modeConfig.minifyJs, false)
      assert.strictEqual(modeConfig.optimizeImages, true)
      assert.strictEqual(modeConfig.formatCode, true)
    })

    it('should throw error when BUILD_MODE is missing in env', () => {
      // Arrange
      const env = {} // Empty env, no BUILD_MODE

      // Act & Assert
      assert.throws(() => {
        getBuildConfig(undefined, env)
      }, /BUILD_MODE must be set/)
    })

    it('should resolve config using BUILD_MODE from provided env', () => {
      // Arrange
      const env = mockEnv({ BUILD_MODE: 'build' })

      // Act
      const config = getBuildConfig(undefined, env)

      // Assert
      assert.strictEqual(config.minifyJs, true)
      assert.strictEqual(config.sourceMaps, false)
    })

    it('should return correct individual flag values via getters', () => {
      // Arrange
      const devEnv = mockEnv({
        BUILD_MODE: 'dev',
        SITE_BASE_URL: 'http://dev.local',
      })
      const prodEnv = mockEnv({ BUILD_MODE: 'build' })
      const exportEnv = mockEnv({ BUILD_MODE: 'export' })

      // Act & Assert - Core flags
      assert.strictEqual(version(devEnv), 'dev')
      assert.strictEqual(version(prodEnv), 'prod')
      assert.strictEqual(sourceMaps(devEnv), true)
      assert.strictEqual(sourceMaps(prodEnv), false)
      assert.strictEqual(minifyJs(prodEnv), true)
      assert.strictEqual(minifyCss(prodEnv), true)
      assert.strictEqual(concatFiles(prodEnv), true)
      assert.strictEqual(optimizeImages(prodEnv), true)
      assert.strictEqual(generateFavicons(prodEnv), true)
      assert.strictEqual(formatCode(exportEnv), true)
      assert.strictEqual(getBaseUrl(devEnv), 'http://dev.local')
      assert.ok(Array.isArray(postcssPluginsBase(devEnv)))

      // Act & Assert - Complex objects
      assert.strictEqual(typeof htmlBeautifyOptionsGetter(devEnv), 'object')
      assert.strictEqual(typeof fontLoadConfig(devEnv), 'object')
      assert.ok(Array.isArray(injectCdnJs(devEnv)))

      // Act & Assert - Injection path resolution (the .map() logic)
      const jsPatterns = injectJs(devEnv)
      assert.ok(jsPatterns[0].includes('./build-dev'))

      const cssPatterns = injectCss(prodEnv)
      assert.ok(cssPatterns[0].includes('./build-prod'))

      // Act & Assert - Remaining directory getters
      assert.strictEqual(iconsBuild(devEnv), './build-dev/assets/icons')
      assert.strictEqual(faviconBuild(devEnv), './build-dev/assets/favicons')
    })
  })

  describe('Target Directory Getters', () => {
    it('should return correct paths for dev mode', () => {
      // Arrange
      const env = mockEnv({ BUILD_MODE: 'dev' })

      // Act & Assert
      assert.strictEqual(sassBuild(env), './build-dev/assets/css')
      assert.strictEqual(jsBuild(env), './build-dev/assets/js')
      assert.strictEqual(fontsBuild(env), './build-dev/assets/fonts')
      assert.strictEqual(tplBuild(env), './build-dev')
    })

    it('should return correct paths for build mode', () => {
      // Arrange
      const env = mockEnv({ BUILD_MODE: 'build' })

      // Act & Assert
      assert.strictEqual(sassBuild(env), './build-prod/assets/css')
      assert.strictEqual(imagesBuild(env), './build-prod/assets/images')
      assert.strictEqual(faviconBuild(env), './build-prod/assets/favicons')
    })

    it('should return all build paths via getBuildPaths', () => {
      // Arrange
      const env = mockEnv({ BUILD_MODE: 'export' })

      // Act
      const paths = getBuildPaths(env)

      // Assert
      assert.strictEqual(paths.buildBase, './build-export')
      assert.strictEqual(paths.sassBuild, './build-export/assets/css')
      assert.strictEqual(paths.jsBuild, './build-export/assets/js')
      assert.strictEqual(paths.imagesBuild, './build-export/assets/images')
    })
  })
})
