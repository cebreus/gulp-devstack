import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { validateImage } from '../../gulp/tasks/process-images.js'
import { detectType, optimizeWithSharp } from '../../gulp/utils/index.js'

describe('Image Processing Logic (Unit)', function imageLogicTests() {
  describe('detectType', function detectTypeTests() {
    it('should return null for short or empty buffers', function verifyEmptyBuffer() {
      assert.strictEqual(detectType(null), null)
      assert.strictEqual(detectType(Buffer.from([0x00, 0x01])), null)
    })

    it('should identify PNG signature', function verifyPngSignature() {
      const buf = Buffer.from([0x89, 0x50, 0x4e, 0x47])
      assert.strictEqual(detectType(buf), 'png')
    })

    it('should identify JPG signature', function verifyJpgSignature() {
      const buf = Buffer.from([0xff, 0xd8, 0xff])
      assert.strictEqual(detectType(buf), 'jpg')
    })

    it('should identify WebP signature', function verifyWebpSignature() {
      const buf = Buffer.alloc(12)
      buf.write('RIFF', 0)
      buf.write('WEBP', 8)
      assert.strictEqual(detectType(buf), 'webp')
    })

    it('should identify SVG signature', function verifySvgSignature() {
      assert.strictEqual(detectType(Buffer.from('<svg xmlns=...')), 'svg')
      assert.strictEqual(
        detectType(Buffer.from('   <?xml version="1.0" ?>\n<svg')),
        'svg'
      )
    })

    it('should return null for unknown signatures', function verifyUnknownSignature() {
      assert.strictEqual(
        detectType(Buffer.from('not an image at all but quite a long string')),
        null
      )
    })
  })

  describe('validateImage stream', function validateImageTests() {
    function createMockImageFile(filePath, contents) {
      return {
        path: filePath,
        contents,
        isBuffer: function checkIsBuffer() {
          return !!contents
        },
        isNull: function checkIsNull() {
          return !contents
        },
      }
    }

    it('should pass through non-buffer files', function verifyNonBufferPass() {
      return new Promise(function runNonBufferTest(resolve) {
        const stream = validateImage('jpg')
        const file = createMockImageFile('test.jpg', null)

        stream.on('data', function handleData(f) {
          assert.strictEqual(f.contents, null)
          resolve()
        })
        stream.write(file)
      })
    })

    it('should flag UTF-8 corrupted files', function verifyCorruptedFile() {
      return new Promise(function runCorruptedFileTest(resolve) {
        const stream = validateImage('png')
        const file = createMockImageFile(
          'corrupted.png',
          Buffer.from([0xef, 0xbf, 0xbd, 0x50, 0x4e, 0x47])
        )

        stream.on('data', function handleData(f) {
          assert.strictEqual(f._isInvalid, true)
          resolve()
        })
        stream.write(file)
      })
    })

    it('should flag unknown content as invalid', function verifyUnknownContent() {
      return new Promise(function runUnknownContentTest(resolve) {
        const stream = validateImage('jpg')
        const file = createMockImageFile(
          'text.jpg',
          Buffer.from('this is just some plain text that is long enough')
        )

        stream.on('data', function handleData(f) {
          assert.strictEqual(f._isInvalid, true)
          resolve()
        })
        stream.write(file)
      })
    })

    it('should accept valid matching content', function verifyValidContent() {
      return new Promise(function runValidContentTest(resolve) {
        const stream = validateImage('png')
        const file = createMockImageFile(
          'valid.png',
          Buffer.from([0x89, 0x50, 0x4e, 0x47])
        )

        stream.on('data', function handleData(f) {
          assert.ok(!f._isInvalid)
          resolve()
        })
        stream.write(file)
      })
    })

    it('should note mismatched extensions but not invalidate', function verifyMismatchedExtension() {
      return new Promise(function runMismatchedExtensionTest(resolve) {
        const stream = validateImage('jpg')
        const file = createMockImageFile(
          'actually-png.jpg',
          Buffer.from([0x89, 0x50, 0x4e, 0x47])
        )

        stream.on('data', function handleData(f) {
          assert.ok(!f._isInvalid)
          resolve()
        })
        stream.write(file)
      })
    })
  })

  describe('optimizeWithSharp (failure state)', function sharpFailureTests() {
    it('should throw error when sharp is missing', async function verifySharpMissing() {
      const inputBuffer = Buffer.from('input')
      await assert.rejects(
        async function runSharpOptimization() {
          await optimizeWithSharp(inputBuffer, 'jpg', 80)
        },
        function verifyError(err) {
          return (
            err.code === 'ERR_MODULE_NOT_FOUND' ||
            err.message.includes(
              'Input buffer contains unsupported image format'
            ) ||
            err.message.includes('sharp')
          )
        }
      )
    })
  })
})
