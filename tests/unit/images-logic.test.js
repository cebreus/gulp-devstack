import assert from 'node:assert/strict'
import { Transform } from 'node:stream'
import { describe, it } from 'node:test'

import {
  convertToWebp,
  detectType,
  optimizeJpg,
  optimizePng,
  optimizeSvg,
  optimizeWithSharp,
  validateImage,
} from '../../gulp/tasks/process-images.js'

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
    })

    it('should return null for unknown signatures', () => {
      assert.strictEqual(
        detectType(Buffer.from('not an image at all but quite a long string')),
        null
      )
    })
  })

  describe('validateImage stream', () => {
    const mockFile = (path, contents) => ({
      path,
      contents,
      isBuffer: () => !!contents,
      isNull: () => !contents,
    })

    it('should pass through non-buffer files', () => {
      return new Promise((resolve) => {
        const stream = validateImage('jpg')
        const file = mockFile('test.jpg', null)

        stream.on('data', (f) => {
          assert.strictEqual(f.contents, null)
          resolve()
        })
        stream.write(file)
      })
    })

    it('should flag UTF-8 corrupted files', () => {
      return new Promise((resolve) => {
        const stream = validateImage('png')
        const file = mockFile(
          'corrupted.png',
          Buffer.from([0xef, 0xbf, 0xbd, 0x50, 0x4e, 0x47])
        )

        stream.on('data', (f) => {
          assert.strictEqual(f._isInvalid, true)
          resolve()
        })
        stream.write(file)
      })
    })

    it('should flag unknown content as invalid', () => {
      return new Promise((resolve) => {
        const stream = validateImage('jpg')
        const file = mockFile(
          'text.jpg',
          Buffer.from('this is just some plain text that is long enough')
        )

        stream.on('data', (f) => {
          assert.strictEqual(f._isInvalid, true)
          resolve()
        })
        stream.write(file)
      })
    })

    it('should accept valid matching content', () => {
      return new Promise((resolve) => {
        const stream = validateImage('png')
        const file = mockFile(
          'valid.png',
          Buffer.from([0x89, 0x50, 0x4e, 0x47])
        )

        stream.on('data', (f) => {
          assert.ok(!f._isInvalid)
          resolve()
        })
        stream.write(file)
      })
    })

    it('should note mismatched extensions but not invalidate', () => {
      return new Promise((resolve) => {
        const stream = validateImage('jpg')
        const file = mockFile(
          'actually-png.jpg',
          Buffer.from([0x89, 0x50, 0x4e, 0x47])
        )

        stream.on('data', (f) => {
          assert.ok(!f._isInvalid)
          resolve()
        })
        stream.write(file)
      })
    })
  })

  describe('optimizeWithSharp (failure state)', () => {
    it('should throw error when sharp is missing', async () => {
      const input = Buffer.from('input')
      try {
        await optimizeWithSharp(input, 'jpg', 80)
        assert.fail('Should have thrown')
      } catch (err) {
        assert.ok(
          err.code === 'ERR_MODULE_NOT_FOUND' || err.message.includes('sharp')
        )
      }
    })
  })

  describe('Empty image source handling', () => {
    it('should handle empty input without crashing', async () => {
      // Calling with non-matching pattern in existing dir should just return/log but not crash
      await optimizeJpg('src/assets/images/non-existent-*.jpg', 'dest')
      await optimizePng('src/assets/images/non-existent-*.png', 'dest')
      await optimizeSvg('src/assets/images/non-existent-*.svg', 'dest')
      await convertToWebp(['src/assets/images/non-existent-*.png'], 'dest')
      assert.ok(true, 'Tasks did not crash on empty input')
    })
  })
})
