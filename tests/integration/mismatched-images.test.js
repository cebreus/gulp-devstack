import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { describe, test } from 'node:test'

import { optimizeJpg, optimizePng } from '../../gulp/tasks/process-images.js'
import { runInSandbox } from '../test-helpers.js'

describe('Image Mismatch Integration Tests', function testImageMismatch() {
  const imagesFixturesDir = path.resolve('tests/fixtures/images')

  test('should skip non-image files named as PNG', async function testSkipNonImage() {
    await runInSandbox(
      'mismatch-non-image',
      async function executeNonImageTest(sandbox) {
        const srcPath = path.join(imagesFixturesDir, 'synt-not-png.png')
        const outputDir = path.join(sandbox, 'output')
        await fs.mkdir(outputDir, { recursive: true })

        await optimizePng(srcPath, outputDir)

        const outputExists = await fs
          .access(path.join(outputDir, 'synt-not-png.png'))
          .then(function onAccessSuccess() {
            return true
          })
          .catch(function onAccessError() {
            return false
          })

        assert.strictEqual(
          outputExists,
          false,
          'Non-image file should not be in output'
        )
      }
    )
  })

  test('should skip corrupted signature PNG files', async function testSkipCorrupted() {
    await runInSandbox(
      'mismatch-corrupted',
      async function executeCorruptedTest(sandbox) {
        const srcPath = path.join(
          imagesFixturesDir,
          'synt-corrupted-signature.png'
        )
        const outputDir = path.join(sandbox, 'output')
        await fs.mkdir(outputDir, { recursive: true })

        await optimizePng(srcPath, outputDir)

        const outputExists = await fs
          .access(path.join(outputDir, 'synt-corrupted-signature.png'))
          .then(function onAccessSuccess() {
            return true
          })
          .catch(function onAccessError() {
            return false
          })

        assert.strictEqual(
          outputExists,
          false,
          'Corrupted file should not be in output'
        )
      }
    )
  })

  test('should process PNG file named as JPG (mismatched extension)', async function testMismatchedExtension() {
    await runInSandbox(
      'mismatch-extension',
      async function executeMismatchedTest(sandbox) {
        const srcPath = path.join(imagesFixturesDir, 'mismatched-extension.jpg')
        const outputDir = path.join(sandbox, 'output')
        await fs.mkdir(outputDir, { recursive: true })

        await optimizeJpg(srcPath, outputDir)

        const outputExists = await fs
          .access(path.join(outputDir, 'mismatched-extension.jpg'))
          .then(function onAccessSuccess() {
            return true
          })
          .catch(function onAccessError() {
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
          0x89,
          'Should still have PNG signature'
        )
        assert.strictEqual(
          imageBuffer[1],
          0x50,
          'Should still have PNG signature'
        )
      }
    )
  })
})
