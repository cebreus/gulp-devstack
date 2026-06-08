import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it, mock } from 'node:test'

import { resolveConfig } from '../../gulp/config.js'
import processJs, { getEsbuildConfig } from '../../gulp/tasks/process-js.js'
import {
  clearScssDiscoveryCache,
  discoverScssSources,
  getSassCompilerOptions,
} from '../../gulp/tasks/process-sass.js'
import purgeCss from '../../gulp/tasks/purge-css.js'
import { createMockEnvironment } from '../test-helpers.js'

describe('Asset Pipeline Utilities', () => {
  describe('getEsbuildConfig', () => {
    it('should return dev configuration when flags are missing', () => {
      createMockEnvironment({ BUILD_MODE: 'dev' })

      const esConfig = getEsbuildConfig({}, resolveConfig('dev'))

      assert.strictEqual(esConfig.minify, false)
      assert.strictEqual(esConfig.sourcemap, 'external')
    })

    it('should return production configuration for build mode', () => {
      createMockEnvironment({ BUILD_MODE: 'build' })

      const esConfig = getEsbuildConfig(
        { minify: true, sourceMaps: false },
        resolveConfig('build')
      )

      assert.strictEqual(esConfig.minify, true)
      assert.strictEqual(esConfig.sourcemap, false)
    })
  })

  describe('getSassCompilerOptions', () => {
    it('should return expanded style for dev', () => {
      const conf = resolveConfig('dev')
      const options = getSassCompilerOptions({}, false, conf)
      assert.strictEqual(options.outputStyle, 'expanded')
    })

    it('should return compressed style for production', () => {
      const conf = resolveConfig('build')
      const options = getSassCompilerOptions({}, true, conf)
      assert.strictEqual(options.outputStyle, 'compressed')
    })

    it('should include core paths in includePaths', () => {
      const conf = resolveConfig('dev')
      const options = getSassCompilerOptions({}, false, conf)
      assert.ok(
        options.includePaths.some((p) => {
          return p.includes('scss')
        })
      )
      assert.ok(
        options.includePaths.some((p) => {
          return p.includes('node_modules')
        })
      )
    })
  })

  describe('task guard clauses', () => {
    let mockConsoleWarn

    beforeEach(() => {
      mockConsoleWarn = mock.method(console, 'warn', () => {})
    })

    afterEach(() => {
      mockConsoleWarn.mock.restore()
    })

    it('processJs should resolve gracefully when input file list is empty', async () => {
      await assert.doesNotReject(async () => {
        await processJs(resolveConfig('dev'), [], 'build-dev/assets/js')
      })
      // Guard-clause path: warn should have been emitted, no file created
      assert.ok(
        mockConsoleWarn.mock.calls.length > 0,
        'processJs should emit a warn when file list is empty'
      )
    })

    it('purgeCss should return an empty readable stream for invalid parameters', async () => {
      const stream = await purgeCss('', '', '')
      const chunks = []

      await assert.doesNotReject(async () => {
        for await (const chunk of stream) {
          chunks.push(chunk)
        }
      })

      assert.strictEqual(chunks.length, 0)
    })
  })

  describe('discoverScssSources cache', () => {
    it('should reuse cached SCSS discovery entries during TTL window', async () => {
      clearScssDiscoveryCache()

      let calls = 0
      const fakeGlob = async () => {
        calls += 1
        return ['/tmp/a.scss', '/tmp/b.scss']
      }

      const first = await discoverScssSources('/tmp/source', {
        ttlMs: 5_000,
        now: () => {
          return 1_000
        },
        globFn: fakeGlob,
      })

      const second = await discoverScssSources('/tmp/source', {
        ttlMs: 5_000,
        now: () => {
          return 1_001
        },
        globFn: fakeGlob,
      })

      assert.deepStrictEqual(first, ['/tmp/a.scss', '/tmp/b.scss'])
      assert.deepStrictEqual(second, ['/tmp/a.scss', '/tmp/b.scss'])
      assert.strictEqual(calls, 1)
    })

    it('should refresh cache after TTL expiry', async () => {
      clearScssDiscoveryCache()

      let calls = 0
      const fakeGlob = async () => {
        calls += 1
        return calls === 1 ? ['/tmp/old.scss'] : ['/tmp/new.scss']
      }

      await discoverScssSources('/tmp/source-ttl', {
        ttlMs: 100,
        now: () => {
          return 10
        },
        globFn: fakeGlob,
      })

      const refreshed = await discoverScssSources('/tmp/source-ttl', {
        ttlMs: 100,
        now: () => {
          return 200
        },
        globFn: fakeGlob,
      })

      assert.deepStrictEqual(refreshed, ['/tmp/new.scss'])
      assert.strictEqual(calls, 2)
    })
  })
})
