import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import { afterEach, beforeEach, describe, it, mock } from 'node:test'

import images from '../../gulp/tasks/process-images.js'
import { runInSandbox, silenceConsole } from '../test-helpers.js'

silenceConsole(beforeEach, afterEach, mock)

const IMAGE_FIXTURES = {
  png: 'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAALElEQVR42u3BAQEAAACAkP6v7ggKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8GcYKAEAAS99S7YAAAAASUVORK5CYII=',
  jpg: '/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAKAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAVAWMAH//Z',
  svg: 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iYmxhY2siLz48L3N2Zz4=',
}

async function writeImageToSandbox(sandbox, fileName, base64) {
  const filePath = path.join(sandbox, 'src', fileName)
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, Buffer.from(base64, 'base64'))
  return filePath
}

describe('Image Pipeline Final Integration', () => {
  let mockConsoleError

  beforeEach(() => {
    mockConsoleError = mock.method(console, 'error', () => {})
  })

  afterEach(() => {
    mockConsoleError.mock.restore()
  })
  it('should handle JPG task without crashing even if sharp fails', async () => {
    await runInSandbox('images-jpg', async (sandbox) => {
      const srcPath = await writeImageToSandbox(
        sandbox,
        'test.jpg',
        IMAGE_FIXTURES.jpg
      )
      const destDir = path.join(sandbox, 'build')

      await images.jpg(srcPath, destDir)

      const optimizedPath = path.join(destDir, 'test.jpg')
      const outputBuffer = await fs.readFile(optimizedPath)
      // JPEG magic bytes: FF D8 FF
      assert.strictEqual(
        outputBuffer[0],
        0xff,
        'Output should have JPEG magic byte 0'
      )
      assert.strictEqual(
        outputBuffer[1],
        0xd8,
        'Output should have JPEG magic byte 1'
      )
      assert.ok(outputBuffer.length > 0, 'JPG output should not be empty')
    })
  })

  it('should handle PNG task without crashing even if Sharp fails', async () => {
    await runInSandbox('images-png', async (sandbox) => {
      const pngFixtureSource = path.resolve(
        'tests/fixtures/images/synt-metadata-heavy.png'
      )
      const pngContent = await fs.readFile(pngFixtureSource)
      const srcPath = path.join(sandbox, 'src/test.png')
      await fs.mkdir(path.dirname(srcPath), { recursive: true })
      await fs.writeFile(srcPath, pngContent)

      const destDir = path.join(sandbox, 'build')

      await images.png(srcPath, destDir)

      const optimizedPath = path.join(destDir, 'test.png')
      const outputBuffer = await fs.readFile(optimizedPath)
      // PNG magic bytes: 89 50 4E 47
      assert.strictEqual(
        outputBuffer[0],
        0x89,
        'Output should have PNG magic byte 0'
      )
      assert.strictEqual(
        outputBuffer[1],
        0x50,
        'Output should have PNG magic byte 1'
      )
      assert.strictEqual(
        outputBuffer[2],
        0x4e,
        'Output should have PNG magic byte 2'
      )
      assert.strictEqual(
        outputBuffer[3],
        0x47,
        'Output should have PNG magic byte 3'
      )
    })
  })

  it('should handle WebP task without crashing even if sharp fails', async () => {
    await runInSandbox('images-webp', async (sandbox) => {
      const pngFixtureSource = path.resolve(
        'tests/fixtures/images/synt-metadata-heavy.png'
      )
      const pngContent = await fs.readFile(pngFixtureSource)
      const srcPath = path.join(sandbox, 'src/convert.png')
      await fs.mkdir(path.dirname(srcPath), { recursive: true })
      await fs.writeFile(srcPath, pngContent)
      const destDir = path.join(sandbox, 'build')

      await images.webp(srcPath, destDir)

      // Output may be WebP (sharp succeeded) or PNG fallback (sharp unavailable)
      const webpPath = path.join(destDir, 'convert.webp')
      const pngPath = path.join(destDir, 'convert.png')
      const webpExists = existsSync(webpPath)
      const pngExists = existsSync(pngPath)

      assert.ok(
        webpExists || pngExists,
        'Output file (WebP or PNG fallback) should exist in build'
      )

      // Verify the output file has a valid image signature for whichever format was produced
      const outputBuffer = await fs.readFile(webpExists ? webpPath : pngPath)
      assert.ok(outputBuffer.length > 0, 'Output image must not be empty')

      if (webpExists) {
        // WebP magic bytes: RIFF....WEBP (bytes 0-3 = 'RIFF', bytes 8-11 = 'WEBP')
        assert.strictEqual(
          outputBuffer.toString('ascii', 0, 4),
          'RIFF',
          'WebP output should start with RIFF header'
        )
        assert.strictEqual(
          outputBuffer.toString('ascii', 8, 12),
          'WEBP',
          'WebP output should have WEBP marker at offset 8'
        )
      } else {
        // PNG fallback magic bytes: 89 50 4E 47
        assert.strictEqual(
          outputBuffer[0],
          0x89,
          'PNG fallback should have PNG magic byte 0'
        )
        assert.strictEqual(
          outputBuffer[1],
          0x50,
          'PNG fallback should have PNG magic byte 1'
        )
      }
    })
  })

  it('should optimize SVG and clean content', async () => {
    await runInSandbox('images-svg', async (sandbox) => {
      const srcPath = await writeImageToSandbox(
        sandbox,
        'test.svg',
        IMAGE_FIXTURES.svg
      )
      const destDir = path.join(sandbox, 'build')

      await images.svg(srcPath, destDir)

      const optimizedPath = path.join(destDir, 'test.svg')
      const optimizedContent = await fs.readFile(optimizedPath, 'utf8')
      assert.ok(optimizedContent.startsWith('<svg'), 'Valid SVG header')
    })
  })
})
