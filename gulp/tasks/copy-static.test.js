import copyStatic from './copy-static.js'
import fs from 'fs'
import assert from 'node:assert'
import { describe, it } from 'node:test'
import path from 'path'
import { fileURLToPath } from 'url'

// Define temporary test directories and file paths.
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.resolve(__dirname, '../../..')
const TEST_TEMP_DIR = path.join(PROJECT_ROOT, '.temp')
const TEST_SRC_DIR = path.join(TEST_TEMP_DIR, 'static-src')
const TEST_DEST_DIR = path.join(TEST_TEMP_DIR, 'static-dest')
const TEST_FILE = 'test.txt'
const TEST_FILE_PATH = path.join(TEST_SRC_DIR, TEST_FILE)

/**
 * Removes the temporary test directory and its contents.
 */
function cleanUp() {
  try {
    if (fs.existsSync(TEST_TEMP_DIR))
      fs.rmSync(TEST_TEMP_DIR, { recursive: true, force: true })
  } catch {
    // Ignore cleanup errors.
  }
}

/**
 * Sets up the test environment by cleaning up and creating necessary test files and directories.
 */
function setup() {
  cleanUp()
  fs.mkdirSync(TEST_SRC_DIR, { recursive: true })
  fs.writeFileSync(TEST_FILE_PATH, 'hello world')
}

describe('copyStatic', () => {
  it('copies an existing file', (_, done) => {
    setup()
    copyStatic(TEST_FILE_PATH, TEST_SRC_DIR, TEST_DEST_DIR, {
      cb: () => {
        const destFile = path.join(TEST_DEST_DIR, TEST_FILE)
        assert.ok(fs.existsSync(destFile))
        assert.strictEqual(fs.readFileSync(destFile, 'utf8'), 'hello world')
        cleanUp()
        done()
      },
    })
  })

  it('throws if required parameters are missing', () => {
    assert.throws(() => copyStatic(), /Invalid glob argument/)
    assert.throws(
      () => copyStatic('test.txt'),
      /Invalid dest\(\) folder argument/
    )
    assert.throws(
      () => copyStatic('test.txt', 'src'),
      /Invalid dest\(\) folder argument/
    )
  })

  it('handles non-existent source files gracefully', async () => {
    setup()
    const nonExistentSrc = path.join(TEST_SRC_DIR, 'does-not-exist.txt')

    // With allowEmpty: true, non-existent files should not throw.
    await new Promise((resolve) => {
      const stream = copyStatic(nonExistentSrc, TEST_SRC_DIR, TEST_DEST_DIR, {
        cb: () => {
          // Should complete without error, destination directory should not be created for empty source.
          assert.strictEqual(fs.existsSync(TEST_DEST_DIR), false)
          resolve()
        },
      })

      // Handle any potential errors in the stream.
      if (stream && typeof stream.on === 'function') {
        stream.on('error', () => resolve())
      }
    })

    cleanUp()
  })

  it('accepts array of sources', async () => {
    setup()
    const file2 = path.join(TEST_SRC_DIR, 'test2.txt')
    fs.writeFileSync(file2, 'second')

    await new Promise((resolve) => {
      copyStatic([TEST_FILE_PATH, file2], TEST_SRC_DIR, TEST_DEST_DIR, {
        cb: () => {
          assert.ok(fs.existsSync(path.join(TEST_DEST_DIR, TEST_FILE)))
          assert.ok(fs.existsSync(path.join(TEST_DEST_DIR, 'test2.txt')))
          resolve()
        },
      })
    })

    cleanUp()
  })

  it('creates destination directory if it does not exist', async () => {
    setup()
    assert.ok(!fs.existsSync(TEST_DEST_DIR))

    await new Promise((resolve) => {
      copyStatic(TEST_FILE_PATH, TEST_SRC_DIR, TEST_DEST_DIR, {
        cb: () => {
          assert.ok(fs.existsSync(TEST_DEST_DIR))
          resolve()
        },
      })
    })

    cleanUp()
  })
})
