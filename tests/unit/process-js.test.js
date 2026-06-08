import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it, mock } from 'node:test'

import processJs, { getEsbuildConfig } from '../../gulp/tasks/process-js.js'

describe('JS Pipeline (Unit)', () => {
  const MOCK_BUILD_CONFIG = {
    minifyJs: true,
    sourceMaps: false,
  }

  describe('getEsbuildConfig', () => {
    it('should return default config when no options provided', () => {
      const esConfig = getEsbuildConfig({}, MOCK_BUILD_CONFIG)
      assert.strictEqual(esConfig.bundle, false)
      assert.strictEqual(esConfig.minify, true)
      assert.strictEqual(esConfig.sourcemap, false)
    })

    it('should override global config with local options', () => {
      const esConfig = getEsbuildConfig(
        { minify: false, sourceMaps: true },
        MOCK_BUILD_CONFIG
      )
      assert.strictEqual(esConfig.minify, false)
      assert.strictEqual(esConfig.sourcemap, 'external')
    })

    it('should use explicit ESM format by default', () => {
      const esConfig = getEsbuildConfig({}, MOCK_BUILD_CONFIG)
      assert.strictEqual(esConfig.format, 'esm')
    })
  })

  describe('processJs Guard Clauses', () => {
    let mockConsoleWarn

    beforeEach(() => {
      mockConsoleWarn = mock.method(console, 'warn', () => {})
    })

    afterEach(() => {
      mockConsoleWarn.mock.restore()
    })

    it('should resolve early when no files provided', async () => {
      await processJs(MOCK_BUILD_CONFIG, [], './dist')
      await processJs(MOCK_BUILD_CONFIG, null, './dist')

      assert.strictEqual(
        MOCK_BUILD_CONFIG.minifyJs,
        true,
        'Precondition: mock config must be prod-like'
      )
      assert.strictEqual(
        mockConsoleWarn.mock.calls.length,
        2,
        'Should emit exactly one warn per empty call'
      )
    })
  })
})
