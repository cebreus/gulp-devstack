import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { Readable } from 'node:stream'
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
} from '../../gulp/utils/helpers.js'
import { cleanupSandbox, createTestSandbox } from '../test-helpers.js'

describe('Helpers Utility', () => {
  describe('getRelativePath', () => {
    it('should return relative path from current working directory', () => {
      // Arrange
      const absolutePath = path.join(process.cwd(), 'src/assets/css/main.css')
      const expected = 'src/assets/css/main.css'

      // Act
      const result = getRelativePath(absolutePath)

      // Assert
      assert.strictEqual(result, expected)
    })
  })

  describe('ensureDirectoryExists', () => {
    it('should create directory if it does not exist', async () => {
      // Arrange
      const sandbox = await createTestSandbox()
      const targetDir = path.join(sandbox, 'new/nested/dir')

      // Act
      await ensureDirectoryExists(targetDir)

      // Assert
      const stats = await fs.promises.stat(targetDir)
      assert.ok(stats.isDirectory())

      // Cleanup
      await cleanupSandbox(sandbox)
    })

    it('should not throw if directory already exists', async () => {
      // Arrange
      const sandbox = await createTestSandbox()

      // Act & Assert
      await assert.doesNotReject(async () => {
        await ensureDirectoryExists(sandbox)
      })

      // Cleanup
      await cleanupSandbox(sandbox)
    })
  })

  describe('toKebabCase', () => {
    it('should convert mixed case and spaces to kebab-case', () => {
      assert.strictEqual(toKebabCase('Hello World'), 'hello-world')
      assert.strictEqual(
        toKebabCase('My Custom Property'),
        'my-custom-property'
      )
    })

    it('should handle special characters and extra dashes', () => {
      assert.strictEqual(toKebabCase('Hello! @World'), 'hello-world')
      assert.strictEqual(
        toKebabCase('---multiple---dashes---'),
        'multiple-dashes'
      )
    })
  })

  describe('getDirFromGlob', () => {
    it('should extract base directory from simple glob', () => {
      assert.strictEqual(
        getDirFromGlob('src/assets/js/**/*.js'),
        'src/assets/js'
      )
    })

    it('should handle array of globs by taking the first one', () => {
      assert.strictEqual(
        getDirFromGlob(['src/css/*.css', 'other/*.css']),
        'src/css'
      )
    })

    it('should return empty string for empty input', () => {
      assert.strictEqual(getDirFromGlob(''), '')
    })
  })

  describe('handleEmptyPaths', () => {
    it('should return true and log for empty array', () => {
      assert.strictEqual(handleEmptyPaths([], 'Empty list'), true)
    })

    it('should return true for null or undefined', () => {
      assert.strictEqual(handleEmptyPaths(null, 'Null path'), true)
      assert.strictEqual(handleEmptyPaths(undefined, 'Undefined path'), true)
    })

    it('should return false for valid paths', () => {
      assert.strictEqual(handleEmptyPaths(['src/main.js'], 'Valid list'), false)
      assert.strictEqual(
        handleEmptyPaths('src/style.css', 'Valid string'),
        false
      )
    })
  })

  describe('suppressOutdatedBootstrapWarnings', () => {
    it('should return true for deprecation warnings', () => {
      assert.strictEqual(
        suppressOutdatedBootstrapWarnings('Deprecation: this is old'),
        true
      )
      assert.strictEqual(
        suppressOutdatedBootstrapWarnings('slash as division is deprecated'),
        true
      )
    })

    it('should return false for other messages', () => {
      assert.strictEqual(
        suppressOutdatedBootstrapWarnings('Compilation success'),
        false
      )
      assert.strictEqual(suppressOutdatedBootstrapWarnings(null), false)
    })
  })

  describe('isPrivateFile', () => {
    it('should return true for files starting with _ or __', () => {
      assert.strictEqual(isPrivateFile('_private.njk'), true)
      assert.strictEqual(isPrivateFile('__hidden.js'), true)
    })

    it('should return true if any parent directory starts with _ or __', () => {
      assert.strictEqual(
        isPrivateFile('src/lib/components/_debug/test.js'),
        true
      )
      assert.strictEqual(isPrivateFile('_drafts/post.md'), true)
      assert.strictEqual(isPrivateFile('src/__tests/helper.js'), true)
    })

    it('should return false for standard files and paths', () => {
      assert.strictEqual(isPrivateFile('src/main.js'), false)
      assert.strictEqual(isPrivateFile('index.njk'), false)
      assert.strictEqual(isPrivateFile('assets/css/_variables.scss'), true)
    })

    it('should return false for empty or null input', () => {
      assert.strictEqual(isPrivateFile(''), false)
      assert.strictEqual(isPrivateFile(null), false)
    })
  })

  describe('streamToPromise', () => {
    it('should resolve when stream ends', async () => {
      // Arrange
      const stream = Readable.from(['data'])

      // Act & Assert
      const promise = streamToPromise(stream)
      stream.resume() // Consume the stream to trigger 'end'

      await assert.doesNotReject(async () => {
        await promise
      })
    })

    it('should reject when stream emits error', async () => {
      // Arrange
      const stream = new Readable({
        read() {},
      })

      // Act & Assert
      const promise = streamToPromise(stream)

      // Emit error after listener is attached
      process.nextTick(() => {
        stream.emit('error', new Error('Stream error'))
      })

      await assert.rejects(async () => {
        await promise
      }, /Stream error/)
    })
  })
})
