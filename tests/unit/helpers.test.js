import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { describe, it } from 'node:test'

import {
  ensureDirectoryExists,
  getDirFromGlob,
  getRelativePath,
  handleEmptyPaths,
  isPrivateFile,
  streamToPromise,
  suppressOutdatedBootstrapWarnings,
  toKebabCase,
} from '../../gulp/utils/index.js'
import { cleanupSandbox, createTestSandbox } from '../test-helpers.js'

describe('Helpers Utility', function helperUtilityTests() {
  describe('getRelativePath', function relativePathTests() {
    it('should return relative path from current working directory', function verifyRelativePath() {
      const absolutePath = path.join(process.cwd(), 'src/assets/css/main.css')
      const expected = 'src/assets/css/main.css'

      const result = getRelativePath(absolutePath)

      assert.strictEqual(result, expected)
    })
  })

  describe('ensureDirectoryExists', function directoryExistsTests() {
    it('should create directory if it does not exist', async function verifyDirectoryCreation() {
      const sandbox = await createTestSandbox()
      const targetDir = path.join(sandbox, 'new/nested/dir')

      await ensureDirectoryExists(targetDir)

      const stats = await fs.promises.stat(targetDir)
      assert.ok(stats.isDirectory())

      await cleanupSandbox(sandbox)
    })

    it('should not throw if directory already exists', async function verifyExistingDirectory() {
      const sandbox = await createTestSandbox()

      await assert.doesNotReject(async function runEnsureDir() {
        await ensureDirectoryExists(sandbox)
      })

      await cleanupSandbox(sandbox)
    })
  })

  describe('toKebabCase', function kebabCaseTests() {
    it('should convert mixed case and spaces to kebab-case', function verifyKebabCaseConversion() {
      assert.strictEqual(toKebabCase('Hello World'), 'hello-world')
      assert.strictEqual(
        toKebabCase('My Custom Property'),
        'my-custom-property'
      )
    })

    it('should handle special characters and extra dashes', function verifyKebabCaseSpecialChars() {
      assert.strictEqual(toKebabCase('Hello! @World'), 'hello-world')
      assert.strictEqual(
        toKebabCase('---multiple---dashes---'),
        'multiple-dashes'
      )
    })
  })

  describe('getDirFromGlob', function dirFromGlobTests() {
    it('should extract base directory from simple glob', function verifySimpleGlobDir() {
      assert.strictEqual(
        getDirFromGlob('src/assets/js/**/*.js'),
        'src/assets/js/'
      )
    })

    it('should handle array of globs by taking the first one', function verifyGlobArray() {
      assert.strictEqual(
        getDirFromGlob(['src/css/*.css', 'other/*.css']),
        'src/css/'
      )
    })

    it('should return empty string for empty input', function verifyEmptyGlob() {
      assert.strictEqual(getDirFromGlob(''), '')
      assert.strictEqual(getDirFromGlob(), '')
      assert.strictEqual(getDirFromGlob([]), '')
    })
  })

  describe('handleEmptyPaths', function emptyPathsTests() {
    it('should return true and log for empty array', function verifyEmptyArray() {
      assert.strictEqual(handleEmptyPaths([], 'Empty list'), true)
    })

    it('should return true for null or undefined', function verifyNullish() {
      assert.strictEqual(handleEmptyPaths(null, 'Null path'), true)
      assert.strictEqual(handleEmptyPaths(undefined, 'Undefined path'), true)
    })

    it('should return false for valid paths', function verifyValidPaths() {
      assert.strictEqual(handleEmptyPaths(['src/main.js'], 'Valid list'), false)
      assert.strictEqual(
        handleEmptyPaths('src/style.css', 'Valid string'),
        false
      )
    })
  })

  describe('ensureDirectoryExists (Array)', function dirExistsArrayTests() {
    it('should create multiple directories recursively', async function verifyMultiDirCreation() {
      const sandbox = await createTestSandbox()
      const targets = [
        path.join(sandbox, 'multi/dir1'),
        path.join(sandbox, 'multi/dir2'),
      ]

      await ensureDirectoryExists(targets)

      for (const target of targets) {
        const stats = await fs.promises.stat(target)
        assert.ok(stats.isDirectory())
      }

      await cleanupSandbox(sandbox)
    })
  })

  describe('suppressOutdatedBootstrapWarnings', function suppressWarningsTests() {
    it('should return true for deprecation warnings', function verifyDeprecation() {
      assert.strictEqual(
        suppressOutdatedBootstrapWarnings('Deprecation: this is old'),
        true
      )
      assert.strictEqual(
        suppressOutdatedBootstrapWarnings('slash as division is deprecated'),
        true
      )
    })

    it('should return false for other messages', function verifyOtherMessages() {
      assert.strictEqual(
        suppressOutdatedBootstrapWarnings('Compilation success'),
        false
      )
      assert.strictEqual(suppressOutdatedBootstrapWarnings(null), false)
    })
  })

  describe('isPrivateFile', function privateFileTests() {
    it('should return true for files starting with _ or __', function verifyPrivatePrefix() {
      assert.strictEqual(isPrivateFile('_private.njk'), true)
      assert.strictEqual(isPrivateFile('__hidden.js'), true)
    })

    it('should return true if any parent directory starts with _ or __', function verifyPrivateParentDir() {
      assert.strictEqual(
        isPrivateFile('src/lib/components/_debug/test.js'),
        true
      )
      assert.strictEqual(isPrivateFile('_drafts/post.md'), true)
      assert.strictEqual(isPrivateFile('src/__tests/helper.js'), true)
    })

    it('should return false for standard files and paths', function verifyStandardFile() {
      assert.strictEqual(isPrivateFile('src/main.js'), false)
      assert.strictEqual(isPrivateFile('index.njk'), false)
      assert.strictEqual(isPrivateFile('assets/css/_variables.scss'), true)
    })

    it('should return false for empty or null input', function verifyNullishInput() {
      assert.strictEqual(isPrivateFile(''), false)
      assert.strictEqual(isPrivateFile(null), false)
    })
  })

  describe('streamToPromise', function streamToPromiseTests() {
    it('should resolve when stream ends', async function verifyStreamResolution() {
      const { PassThrough } = await import('node:stream')
      const stream = new PassThrough()
      const promise = streamToPromise(stream)
      stream.end('test data')
      stream.resume()
      await promise
    })

    it('should reject when stream emits error', async function verifyStreamRejection() {
      const { PassThrough } = await import('node:stream')
      const stream = new PassThrough()
      const promise = streamToPromise(stream)
      stream.destroy(new Error('Stream error'))
      await assert.rejects(promise, /Stream error/)
    })
  })
})
