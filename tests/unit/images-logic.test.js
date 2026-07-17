import assert from 'node:assert/strict'
import { finished } from 'node:stream/promises'
import { afterEach, beforeEach, describe, it, mock } from 'node:test'

import { validateImage } from '../../gulp/tasks/process-images.js'
import {
  detectType,
  optimizeWithSharp,
} from '../../gulp/utils/image-helpers.js'

const MINIMAL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
)

describe('Image Processing Logic (Unit)', () => {
  describe('detectType', () => {
    it('should return null for short or empty buffers', () => {
      assert.strictEqual(detectType(null), null)
      assert.strictEqual(detectType(Buffer.from([0x00, 0x01])), null)
    })

    it('should identify PNG signature', () => {
      const buf = Buffer.from([0x89, 0x50, 0x4e, 0x47])
      assert.strictEqual(detectType(buf), 'png')
    })

    it('should identify JPG signature', () => {
      const buf = Buffer.from([0xff, 0xd8, 0xff])
      assert.strictEqual(detectType(buf), 'jpg')
    })

    it('should identify WebP signature', () => {
      const buf = Buffer.alloc(12)
      buf.write('RIFF', 0)
      buf.write('WEBP', 8)
      assert.strictEqual(detectType(buf), 'webp')
    })

    it('should identify SVG signature', () => {
      assert.strictEqual(detectType(Buffer.from('<svg xmlns=...')), 'svg')
      assert.strictEqual(
        detectType(Buffer.from('   <?xml version="1.0" ?>\n<svg')),
        'svg'
      )
      assert.strictEqual(
        detectType(
          Buffer.from(
            `<!--${'long preamble '.repeat(20)}--><!DOCTYPE svg><svg></svg>`
          )
        ),
        'svg'
      )
    })

    it('should return null for unknown signatures', () => {
      assert.strictEqual(
        detectType(Buffer.from('not an image at all but quite a long string')),
        null
      )
    })
  })

  describe('validateImage stream', () => {
    let mockConsoleWarn
    let mockConsoleError

    beforeEach(() => {
      mockConsoleWarn = mock.method(console, 'warn', () => {})
      mockConsoleError = mock.method(console, 'error', () => {})
    })

    afterEach(() => {
      mockConsoleWarn.mock.restore()
      mockConsoleError.mock.restore()
    })

    function createMockImageFile(filePath, contents) {
      return {
        path: filePath,
        contents,
        isBuffer: () => {
          return Boolean(contents)
        },
        isNull: () => {
          return !contents
        },
      }
    }

    async function testValidateImage(format, fileName, content, shouldReject) {
      const stream = validateImage(format)
      const output = []
      stream.on('data', (file) => output.push(file))
      stream.end(createMockImageFile(fileName, content))

      if (shouldReject) {
        await assert.rejects(finished(stream))
        assert.strictEqual(output.length, 0)
        return
      }

      await finished(stream)
      assert.strictEqual(output.length, 1)
      assert.ok(!output[0]._isInvalid)
    }

    it('should pass through non-buffer files', async () => {
      const stream = validateImage('jpg')
      const output = []
      stream.on('data', (file) => output.push(file))
      stream.end(createMockImageFile('test.jpg', null))
      await finished(stream)

      assert.strictEqual(output.length, 1)
      assert.strictEqual(output[0].contents, null)
    })

    it('should reject UTF-8 corrupted files', () => {
      return testValidateImage(
        'png',
        'corrupted.png',
        Buffer.from([0xef, 0xbf, 0xbd, 0x50, 0x4e, 0x47]),
        true
      )
    })

    it('should reject unknown content', () => {
      return testValidateImage(
        'jpg',
        'text.jpg',
        Buffer.from('this is just some plain text that is long enough'),
        true
      )
    })

    it('should accept valid matching content', () => {
      return testValidateImage('png', 'valid.png', MINIMAL_PNG, false)
    })

    it('should accept valid content despite an extension mismatch', () => {
      return testValidateImage('jpg', 'actually-png.jpg', MINIMAL_PNG, false)
    })
  })

  describe('optimizeWithSharp (failure state)', () => {
    it('should reject unsupported target formats', async () => {
      await assert.rejects(
        optimizeWithSharp(MINIMAL_PNG, 'gif', 80),
        RangeError
      )
    })

    it('should throw an error when given an unsupported image buffer', async () => {
      const inputBuffer = Buffer.from('not a valid image buffer')
      await assert.rejects(
        async () => {
          await optimizeWithSharp(inputBuffer, 'jpg', 80)
        },
        (err) => {
          return err.message.includes('unsupported image format')
        }
      )
    })
  })
})
