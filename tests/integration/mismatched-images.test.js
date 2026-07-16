import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { afterEach, beforeEach, describe, it, mock } from 'node:test'

import imageTasks from '../../gulp/tasks/process-images.js'
import { runInSandbox, silenceConsole } from '../test-helpers.js'

silenceConsole(beforeEach, afterEach, mock)

describe('Image Mismatch Integration Tests', () => {
  const imagesFixturesDir = path.resolve('tests/fixtures/images')
  let mockConsoleWarn

  beforeEach(() => {
    mockConsoleWarn = mock.method(console, 'warn', () => {})
  })

  afterEach(() => {
    mockConsoleWarn.mock.restore()
  })

  it('should skip non-image files named as PNG', async () => {
    await runInSandbox('mismatch-non-image', async (sandbox) => {
      const srcPath = path.join(imagesFixturesDir, 'synt-not-png.png')
      const outputDir = path.join(sandbox, 'output')
      await fs.mkdir(outputDir, { recursive: true })

      await imageTasks.png(srcPath, outputDir)

      const outputExists = await fs
        .access(path.join(outputDir, 'synt-not-png.png'))
        .then(() => {
          return true
        })
        .catch(() => {
          return false
        })

      assert.strictEqual(
        outputExists,
        false,
        'Non-image file should not be in output'
      )
    })
  })

  it('should skip corrupted signature PNG files', async () => {
    await runInSandbox('mismatch-corrupted', async (sandbox) => {
      const srcPath = path.join(
        imagesFixturesDir,
        'synt-corrupted-signature.png'
      )
      const outputDir = path.join(sandbox, 'output')
      await fs.mkdir(outputDir, { recursive: true })

      await imageTasks.png(srcPath, outputDir)

      const outputExists = await fs
        .access(path.join(outputDir, 'synt-corrupted-signature.png'))
        .then(() => {
          return true
        })
        .catch(() => {
          return false
        })

      assert.strictEqual(
        outputExists,
        false,
        'Corrupted file should not be in output'
      )
    })
  })

  it('should process PNG file named as JPG (mismatched extension)', async () => {
    await runInSandbox('mismatch-extension', async (sandbox) => {
      const srcPath = path.join(imagesFixturesDir, 'mismatched-extension.jpg')
      const outputDir = path.join(sandbox, 'output')
      await fs.mkdir(outputDir, { recursive: true })

      await imageTasks.jpg(srcPath, outputDir)

      const outputExists = await fs
        .access(path.join(outputDir, 'mismatched-extension.jpg'))
        .then(() => {
          return true
        })
        .catch(() => {
          return false
        })

      assert.strictEqual(
        outputExists,
        true,
        'Mismatched file should be processed if it is a valid image'
      )

      const imageBuffer = await fs.readFile(
        path.join(outputDir, 'mismatched-extension.jpg')
      )
      assert.strictEqual(
        imageBuffer[0],
        0xff,
        'Output should have JPEG signature'
      )
      assert.strictEqual(
        imageBuffer[1],
        0xd8,
        'Output should have JPEG signature'
      )
      assert.strictEqual(
        imageBuffer[2],
        0xff,
        'Output should have JPEG signature'
      )
    })
  })
})
