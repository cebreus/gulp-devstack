import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { getEsbuildConfig, processJs } from '../../gulp/tasks/process-js.js'

describe('JS Pipeline (Unit)', function jsPipelineTests() {
  const mockBuildConfig = {
    minifyJs: true,
    sourceMaps: false,
  }

  describe('getEsbuildConfig', function esbuildConfigTests() {
    it('should return default config when no options provided', function verifyDefaultConfig() {
      const esConfig = getEsbuildConfig({}, mockBuildConfig)
      assert.strictEqual(esConfig.bundle, false)
      assert.strictEqual(esConfig.minify, true)
      assert.strictEqual(esConfig.sourcemap, false)
    })

    it('should override global config with local options', function verifyConfigOverrides() {
      const esConfig = getEsbuildConfig(
        { minify: false, sourceMaps: true },
        mockBuildConfig
      )
      assert.strictEqual(esConfig.minify, false)
      assert.strictEqual(esConfig.sourcemap, 'external')
    })

    it('should use explicit ESM format by default', function verifyEsmFormat() {
      const esConfig = getEsbuildConfig({}, mockBuildConfig)
      assert.strictEqual(esConfig.format, 'esm')
    })
  })

  describe('processJs Guard Clauses', function guardClauseTests() {
    it('should resolve early when no files provided', async function verifyEmptyFileList() {
      await processJs(mockBuildConfig, [], './dist')
      await processJs(mockBuildConfig, null, './dist')
    })
  })
})
