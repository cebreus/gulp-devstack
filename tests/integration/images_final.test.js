import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import { afterEach, beforeEach, describe, it } from 'node:test'

import images from '../../gulp/tasks/process-images.js'
import { cleanupSandbox, createTestSandbox } from '../test-helpers.js'

/**
 * Image fixtures in Base64
 */
const FIXTURES = {
  png: 'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAALElEQVR42u3BAQEAAACAkP6v7ggKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8GcYKAEAAS99S7YAAAAASUVORK5CYII=',
  jpg: '/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAKAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AJUAB//Z',
  svg: 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iYmxhY2siLz48L3N2Zz4=',
}

describe('Image Pipeline Final Integration', () => {
  let sandbox

  beforeEach(async () => {
    sandbox = await createTestSandbox()
  })

  afterEach(async () => {
    await cleanupSandbox(sandbox)
  })

  async function writeImage(fileName, base64) {
    const filePath = path.join(sandbox, 'src', fileName)
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, Buffer.from(base64, 'base64'))
    return filePath
  }

  it('should handle JPG task without crashing even if sharp fails', async () => {
    const src = await writeImage('test.jpg', FIXTURES.jpg)
    const dest = path.join(sandbox, 'build')

    await images.jpg(src, dest)

    const optimizedPath = path.join(dest, 'test.jpg')
    assert.ok(
      existsSync(optimizedPath),
      'JPG should exist in build even if not optimized'
    )
  })

  it('should handle PNG task without crashing even if UPNG fails', async () => {
    const pngFixture = path.resolve(
      'tests/fixtures/images/synt-metadata-heavy.png'
    )
    const content = await fs.readFile(pngFixture)
    const src = path.join(sandbox, 'src/test.png')
    await fs.mkdir(path.dirname(src), { recursive: true })
    await fs.writeFile(src, content)

    const dest = path.join(sandbox, 'build')

    await images.png(src, dest)

    const optimizedPath = path.join(dest, 'test.png')
    assert.ok(existsSync(optimizedPath), 'PNG should exist in build')
  })

  it('should handle WebP task without crashing even if sharp fails', async () => {
    const pngFixture = path.resolve(
      'tests/fixtures/images/synt-metadata-heavy.png'
    )
    const content = await fs.readFile(pngFixture)
    const src = path.join(sandbox, 'src/convert.png')
    await fs.mkdir(path.dirname(src), { recursive: true })
    await fs.writeFile(src, content)
    const dest = path.join(sandbox, 'build')

    await images.webp(src, dest)

    const outPath = path.join(dest, 'convert.png')
    // WebP task creates convert.png (original) if it's smaller, or just skips if sharp fails
    assert.ok(
      existsSync(outPath) || existsSync(path.join(dest, 'convert.webp')),
      'File should exist'
    )
  })

  it('should optimize SVG and clean content', async () => {
    const src = await writeImage('test.svg', FIXTURES.svg)
    const dest = path.join(sandbox, 'build')

    await images.svg(src, dest)

    const optimizedPath = path.join(dest, 'test.svg')
    const content = await fs.readFile(optimizedPath, 'utf8')
    assert.ok(content.startsWith('<svg'), 'Valid SVG header')
  })
})
