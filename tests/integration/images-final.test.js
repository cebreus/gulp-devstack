import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { afterEach, beforeEach, describe, it, mock } from 'node:test'

import images from '../../gulp/tasks/process-images.js'
import { runInSandbox, silenceConsole } from '../test-helpers.js'

silenceConsole(beforeEach, afterEach, mock)

const IMAGE_FIXTURES = {
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

  it('should preserve JPG input when Sharp fails', async () => {
    await runInSandbox('images-jpg', async (sandbox) => {
      const invalidJpg = Buffer.from([0xff, 0xd8, 0xff])
      const srcPath = await writeImageToSandbox(
        sandbox,
        'test.jpg',
        invalidJpg.toString('base64')
      )
      const destDir = path.join(sandbox, 'build')

      await images.jpg(srcPath, destDir)

      const optimizedPath = path.join(destDir, 'test.jpg')
      const outputBuffer = await fs.readFile(optimizedPath)
      assert.deepStrictEqual(outputBuffer, invalidJpg)
    })
  })

  it('should preserve PNG input when Sharp fails', async () => {
    await runInSandbox('images-png', async (sandbox) => {
      const pngContent = Buffer.from([0x89, 0x50, 0x4e, 0x47])
      const srcPath = path.join(sandbox, 'src/test.png')
      await fs.mkdir(path.dirname(srcPath), { recursive: true })
      await fs.writeFile(srcPath, pngContent)

      const destDir = path.join(sandbox, 'build')

      await images.png(srcPath, destDir)

      const optimizedPath = path.join(destDir, 'test.png')
      const outputBuffer = await fs.readFile(optimizedPath)
      assert.deepStrictEqual(outputBuffer, pngContent)
    })
  })

  it('should fail WebP conversion when Sharp fails', async () => {
    await runInSandbox('images-webp', async (sandbox) => {
      const pngContent = Buffer.from([0x89, 0x50, 0x4e, 0x47])
      const srcPath = path.join(sandbox, 'src/convert.png')
      await fs.mkdir(path.dirname(srcPath), { recursive: true })
      await fs.writeFile(srcPath, pngContent)
      const destDir = path.join(sandbox, 'build')

      await assert.rejects(images.webp(srcPath, destDir))
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
