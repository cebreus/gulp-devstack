import assert from 'node:assert'
import fs from 'node:fs/promises'
import path from 'node:path'
import { after, before, describe, test } from 'node:test'

import { optimizeJpg, optimizePng } from '../../gulp/tasks/process-images.js'

describe('Image Mismatch Integration Tests', () => {
  const fixturesDir = path.resolve('tests/fixtures/images')
  const outputDir = path.resolve('.temp/tests/mismatch')

  before(async () => {
    await fs.mkdir(outputDir, { recursive: true })
  })

  after(async () => {
    // Cleanup if needed
    // await fs.rm(outputDir, { recursive: true, force: true });
  })

  test('should skip non-image files named as PNG', async () => {
    const src = path.join(fixturesDir, 'synt-not-png.png')

    // We expect the task to complete successfully (not crash)
    await optimizePng(src, outputDir)

    // The file should NOT exist in output because it was skipped
    const outputExists = await fs
      .access(path.join(outputDir, 'synt-not-png.png'))
      .then(() => true)
      .catch(() => false)

    assert.strictEqual(
      outputExists,
      false,
      'Non-image file should not be in output'
    )
  })

  test('should skip corrupted signature PNG files', async () => {
    const src = path.join(fixturesDir, 'synt-corrupted-signature.png')

    await optimizePng(src, outputDir)

    const outputExists = await fs
      .access(path.join(outputDir, 'synt-corrupted-signature.png'))
      .then(() => true)
      .catch(() => false)

    assert.strictEqual(
      outputExists,
      false,
      'Corrupted file should not be in output'
    )
  })

  test('should process PNG file named as JPG (mismatched extension)', async () => {
    const src = path.join(fixturesDir, 'mismatched-extension.jpg')

    // Should NOT crash even if we use optimizeJpg on a PNG file
    await optimizeJpg(src, outputDir)

    const outputExists = await fs
      .access(path.join(outputDir, 'mismatched-extension.jpg'))
      .then(() => true)
      .catch(() => false)

    assert.strictEqual(
      outputExists,
      true,
      'Mismatched file should be processed if it is a valid image'
    )

    // Verify it is still a PNG by reading magic bytes
    const buffer = await fs.readFile(
      path.join(outputDir, 'mismatched-extension.jpg')
    )
    assert.strictEqual(buffer[0], 0x89, 'Should still have PNG signature')
    assert.strictEqual(buffer[1], 0x50, 'Should still have PNG signature')
  })
})
