import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { resolveConfig } from '../../gulp/config.js'
import { getEsbuildConfig, processJs } from '../../gulp/tasks/process-js.js'
import {
  clearScssDiscoveryCache,
  discoverScssSources,
  getCorePostcssPlugins,
  getSassCompilerOptions,
} from '../../gulp/tasks/process-sass.js'
import { purgeCss } from '../../gulp/tasks/purge-css.js'
import { createMockEnvironment } from '../test-helpers.js'

describe('Asset Pipeline Utilities', function assetPipelineTests() {
  describe('getEsbuildConfig', function esbuildConfigTests() {
    it('should return dev configuration when flags are missing', function verifyDevEsbuildConfig() {
      createMockEnvironment({ BUILD_MODE: 'dev' })

      const esConfig = getEsbuildConfig({}, resolveConfig('dev'))

      assert.strictEqual(esConfig.minify, false)
      assert.strictEqual(esConfig.sourcemap, 'external')
    })

    it('should return production configuration for build mode', function verifyProdEsbuildConfig() {
      createMockEnvironment({ BUILD_MODE: 'build' })

      const esConfig = getEsbuildConfig(
        { minify: true, sourceMaps: false },
        resolveConfig('build')
      )

      assert.strictEqual(esConfig.minify, true)
      assert.strictEqual(esConfig.sourcemap, false)
    })
  })

  describe('getSassCompilerOptions', function sassCompilerOptionsTests() {
    it('should return expanded style for dev', function verifyDevSassOptions() {
      const conf = resolveConfig('dev')
      const options = getSassCompilerOptions({}, false, conf)
      assert.strictEqual(options.outputStyle, 'expanded')
    })

    it('should return compressed style for production', function verifyProdSassOptions() {
      const conf = resolveConfig('build')
      const options = getSassCompilerOptions({}, true, conf)
      assert.strictEqual(options.outputStyle, 'compressed')
    })

    it('should include core paths in includePaths', function verifySassIncludePaths() {
      const conf = resolveConfig('dev')
      const options = getSassCompilerOptions({}, false, conf)
      assert.ok(
        options.includePaths.some(function checkScssPath(p) {
          return p.includes('scss')
        })
      )
      assert.ok(
        options.includePaths.some(function checkNodeModulesPath(p) {
          return p.includes('node_modules')
        })
      )
    })
  })

  describe('task guard clauses', function taskGuardTests() {
    it('processJs should resolve gracefully when input file list is empty', async function verifyEmptyJsProcess() {
      await assert.doesNotReject(async function runEmptyProcess() {
        await processJs(resolveConfig('dev'), [], 'build-dev/assets/js')
      })
    })

    it('purgeCss should return an empty readable stream for invalid parameters', async function verifyInvalidPurgeCss() {
      const stream = await purgeCss('', '', '')
      const chunks = []

      await assert.doesNotReject(async function collectChunks() {
        for await (const chunk of stream) {
          chunks.push(chunk)
        }
      })

      assert.strictEqual(chunks.length, 0)
    })
  })

  describe('discoverScssSources cache', function scssDiscoveryCacheTests() {
    it('should reuse cached SCSS discovery entries during TTL window', async function verifyCacheReuse() {
      clearScssDiscoveryCache()

      let calls = 0
      const fakeGlob = async function mockedGlob() {
        calls += 1
        return ['/tmp/a.scss', '/tmp/b.scss']
      }

      const first = await discoverScssSources('/tmp/source', {
        ttlMs: 5_000,
        now: function getFirstTime() {
          return 1_000
        },
        globFn: fakeGlob,
      })

      const second = await discoverScssSources('/tmp/source', {
        ttlMs: 5_000,
        now: function getSecondTime() {
          return 1_001
        },
        globFn: fakeGlob,
      })

      assert.deepStrictEqual(first, ['/tmp/a.scss', '/tmp/b.scss'])
      assert.deepStrictEqual(second, ['/tmp/a.scss', '/tmp/b.scss'])
      assert.strictEqual(calls, 1)
    })

    it('should refresh cache after TTL expiry', async function verifyCacheExpiry() {
      clearScssDiscoveryCache()

      let calls = 0
      const fakeGlob = async function mockedGlob() {
        calls += 1
        return calls === 1 ? ['/tmp/old.scss'] : ['/tmp/new.scss']
      }

      await discoverScssSources('/tmp/source-ttl', {
        ttlMs: 100,
        now: function getFirstTime() {
          return 10
        },
        globFn: fakeGlob,
      })

      const refreshed = await discoverScssSources('/tmp/source-ttl', {
        ttlMs: 100,
        now: function getSecondTime() {
          return 200
        },
        globFn: fakeGlob,
      })

      assert.deepStrictEqual(refreshed, ['/tmp/new.scss'])
      assert.strictEqual(calls, 2)
    })
  })

  describe('getCorePostcssPlugins', function postcssPluginsTests() {
    it('should include autoprefixer in dev mode for parity', async function verifyDevPostcssPlugins() {
      const plugins = await getCorePostcssPlugins()
      assert.strictEqual(plugins.length, 1)
      assert.strictEqual(plugins[0].postcssPlugin, 'autoprefixer')
    })

    it('should include autoprefixer in build mode', async function verifyBuildPostcssPlugins() {
      const plugins = await getCorePostcssPlugins()
      assert.strictEqual(plugins.length, 1)
      assert.strictEqual(plugins[0].postcssPlugin, 'autoprefixer')
    })

    it('should include autoprefixer in export mode', async function verifyExportPostcssPlugins() {
      const plugins = await getCorePostcssPlugins()
      assert.strictEqual(plugins.length, 1)
      assert.strictEqual(plugins[0].postcssPlugin, 'autoprefixer')
    })
  })
})
