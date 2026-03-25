import logger from '../utils/logger.js'
import clean from './clean.js'
import fs from 'fs'
import mock from 'mock-fs'
import assert from 'node:assert'
import { afterEach, beforeEach, describe, it } from 'node:test'

const buildDir = '.temp/build-single'
const anotherDir = '.temp/build-multi'

/**
 * Sets up a single directory with a file for cleaning tests.
 */
function setupSingleDir() {
  mock({
    [buildDir]: {
      'old-single.txt': 'to be deleted',
    },
  })
}

/**
 * Sets up multiple directories with files for cleaning tests.
 */
function setupMultipleDirs() {
  mock({
    [buildDir]: {
      'old-multi.txt': 'to be deleted',
    },
    [anotherDir]: {
      'file-multi.txt': 'test',
    },
  })
}

describe('clean task', () => {
  let loggerInfoSpy
  let loggerErrorSpy

  beforeEach(() => {
    // Mock logger methods to suppress output during tests.
    loggerInfoSpy = { restore: () => {} }
    loggerErrorSpy = { restore: () => {} }
    logger.info = () => {}
    logger.error = () => {}
  })

  afterEach(() => {
    // Restore the mock file system and logger spies after each test.
    mock.restore()
    if (loggerInfoSpy) loggerInfoSpy.restore()
    if (loggerErrorSpy) loggerErrorSpy.restore()
  })

  describe('when cleaning a single directory', () => {
    beforeEach(() => {
      setupSingleDir()
    })

    it('removes the specified directory and logs success', async () => {
      // Assert that the directory exists before cleaning.
      assert.strictEqual(fs.existsSync(buildDir), true)
      const result = await clean(buildDir)
      // Assert that the directory does not exist after cleaning.
      assert.strictEqual(fs.existsSync(buildDir), false)
      assert.ok(Array.isArray(result))
      assert.ok(result.some((path) => path.includes(buildDir)))
    })
  })

  describe('when cleaning multiple directories', () => {
    beforeEach(() => {
      setupMultipleDirs()
    })

    it('removes multiple directories and logs all paths', async () => {
      // Assert that both directories exist before cleaning.
      assert.strictEqual(fs.existsSync(buildDir), true)
      assert.strictEqual(fs.existsSync(anotherDir), true)
      const result = await clean([buildDir, anotherDir])
      // Assert that both directories do not exist after cleaning.
      assert.strictEqual(fs.existsSync(buildDir), false)
      assert.strictEqual(fs.existsSync(anotherDir), false)
      assert.strictEqual(result.length, 2)
    })
  })

  describe('edge cases', () => {
    it('resolves when cleaning a nonexistent directory', async () => {
      // Should resolve with an empty array if the directory does not exist.
      const result = await clean('nonexistent')
      assert.deepStrictEqual(result, [])
    })

    it('resolves when given an empty string as path', async () => {
      // Should resolve with an empty array if the path is an empty string.
      const result = await clean('')
      assert.deepStrictEqual(result, [])
    })

    it('resolves when given an empty array as path', async () => {
      // Should resolve with an empty array if the path is an empty array.
      const result = await clean([])
      assert.deepStrictEqual(result, [])
    })

    it('resolves when given null as path', async () => {
      // Should resolve with an empty array if the path is null.
      const result = await clean(null)
      assert.deepStrictEqual(result, [])
    })

    it('resolves when given undefined as path', async () => {
      // Should resolve with an empty array if the path is undefined.
      const result = await clean(undefined)
      assert.deepStrictEqual(result, [])
    })

    it('handles whitespace-only strings', async () => {
      // Should resolve with an empty array if the path is whitespace only.
      const result = await clean('   ')
      assert.deepStrictEqual(result, [])
    })
  })

  describe('return value validation', () => {
    it('returns array of deleted paths for single directory', async () => {
      // Should return an array of deleted paths for a single directory.
      setupSingleDir()
      const result = await clean(buildDir)
      assert.strictEqual(Array.isArray(result), true)
      assert.ok(result.length > 0)
      assert.ok(result.every((path) => typeof path === 'string'))
    })

    it('returns array of deleted paths for multiple directories', async () => {
      // Should return an array of deleted paths for multiple directories.
      setupMultipleDirs()
      const result = await clean([buildDir, anotherDir])
      assert.strictEqual(Array.isArray(result), true)
      assert.strictEqual(result.length, 2)
      assert.ok(result.every((path) => typeof path === 'string'))
    })
  })
})
