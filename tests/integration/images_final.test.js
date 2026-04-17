import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import { describe, it } from 'node:test'

import images from '../../gulp/tasks/process-images.js'
import { runInSandbox } from '../test-helpers.js'

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

describe('Image Pipeline Final Integration', function testImagePipeline() {
  it('should handle JPG task without crashing even if sharp fails', async function testJpgProcessing() {
    await runInSandbox('images-jpg', async function executeJpgTest(sandbox) {
      const srcPath = await writeImageToSandbox(
        sandbox,
        'test.jpg',
        IMAGE_FIXTURES.jpg
      )
      const destDir = path.join(sandbox, 'build')

      await images.jpg(srcPath, destDir)

      const optimizedPath = path.join(destDir, 'test.jpg')
      assert.ok(
        existsSync(optimizedPath),
        'JPG should exist in build even if not optimized'
      )
    })
  })

  it('should handle PNG task without crashing even if UPNG fails', async function testPngProcessing() {
    await runInSandbox('images-png', async function executePngTest(sandbox) {
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
      assert.ok(existsSync(optimizedPath), 'PNG should exist in build')
    })
  })

  it('should handle WebP task without crashing even if sharp fails', async function testWebpProcessing() {
    await runInSandbox('images-webp', async function executeWebpTest(sandbox) {
      const pngFixtureSource = path.resolve(
        'tests/fixtures/images/synt-metadata-heavy.png'
      )
      const pngContent = await fs.readFile(pngFixtureSource)
      const srcPath = path.join(sandbox, 'src/convert.png')
      await fs.mkdir(path.dirname(srcPath), { recursive: true })
      await fs.writeFile(srcPath, pngContent)
      const destDir = path.join(sandbox, 'build')

      await images.webp(srcPath, destDir)

      const outPath = path.join(destDir, 'convert.png')
      assert.ok(
        existsSync(outPath) || existsSync(path.join(destDir, 'convert.webp')),
        'File should exist'
      )
    })
  })

  it('should optimize SVG and clean content', async function testSvgProcessing() {
    await runInSandbox('images-svg', async function executeSvgTest(sandbox) {
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
