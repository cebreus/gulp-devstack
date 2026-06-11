import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, it } from 'node:test'

import copyStatic from '../../gulp/tasks/copy-static.js'

describe('Copy Static Task', () => {
  let srcDir
  let destDir

  beforeEach(async () => {
    const sandbox = await fs.mkdtemp(path.join(os.tmpdir(), 'copy-static-'))
    srcDir = path.join(sandbox, 'src')
    destDir = path.join(sandbox, 'dest')
  })

  afterEach(async () => {
    await fs.rm(path.dirname(srcDir), { recursive: true, force: true })
  })

  it('should copy files from source to destination', async () => {
    const testFile = path.join(srcDir, 'test.txt')
    const nestedDir = path.join(srcDir, 'nested')
    const nestedFile = path.join(nestedDir, 'nested.txt')

    // Create source files
    await fs.mkdir(srcDir, { recursive: true })
    await fs.writeFile(testFile, 'Hello World')
    await fs.mkdir(nestedDir, { recursive: true })
    await fs.writeFile(nestedFile, 'Nested Content')

    // Run copy task
    await copyStatic(
      path.join(srcDir, '**/*').replace(/\\/g, '/'),
      srcDir,
      destDir
    )

    // Verify files were copied
    const copiedTestFile = path.join(destDir, 'test.txt')
    const copiedNestedFile = path.join(destDir, 'nested', 'nested.txt')

    assert.ok(
      await fs
        .access(copiedTestFile)
        .then(() => true)
        .catch(() => false),
      'Test file should be copied'
    )
    assert.ok(
      await fs
        .access(copiedNestedFile)
        .then(() => true)
        .catch(() => false),
      'Nested file should be copied'
    )

    // Verify content
    const testContent = await fs.readFile(copiedTestFile, 'utf8')
    assert.strictEqual(testContent, 'Hello World')

    const nestedContent = await fs.readFile(copiedNestedFile, 'utf8')
    assert.strictEqual(nestedContent, 'Nested Content')
  })

  it('should filter out private files', async () => {
    // Create source files including private ones
    await fs.mkdir(srcDir, { recursive: true })
    await fs.writeFile(path.join(srcDir, 'public.txt'), 'Public')
    await fs.writeFile(path.join(srcDir, '_private.txt'), 'Private')
    await fs.writeFile(path.join(srcDir, '__hidden.txt'), 'Hidden')
    await fs.mkdir(path.join(srcDir, 'subdir'), { recursive: true })
    await fs.writeFile(
      path.join(srcDir, 'subdir', '_private.txt'),
      'Private in subdir'
    )
    await fs.writeFile(
      path.join(srcDir, 'subdir', 'public.txt'),
      'Public in subdir'
    )

    // Run copy task
    await copyStatic(
      path.join(srcDir, '**/*').replace(/\\/g, '/'),
      srcDir,
      destDir
    )

    // Verify only non-private files were copied
    const publicFile = path.join(destDir, 'public.txt')
    const subdirPublicFile = path.join(destDir, 'subdir', 'public.txt')
    const privateFile = path.join(destDir, '_private.txt')
    const hiddenFile = path.join(destDir, '__hidden.txt')
    const subdirPrivateFile = path.join(destDir, 'subdir', '_private.txt')

    assert.ok(
      await fs
        .access(publicFile)
        .then(() => true)
        .catch(() => false),
      'Public file should be copied'
    )
    assert.ok(
      await fs
        .access(subdirPublicFile)
        .then(() => true)
        .catch(() => false),
      'Public file in subdir should be copied'
    )
    assert.ok(
      await fs
        .access(privateFile)
        .then(() => false)
        .catch(() => true),
      'Private file should NOT be copied'
    )
    assert.ok(
      await fs
        .access(hiddenFile)
        .then(() => false)
        .catch(() => true),
      'Hidden file should NOT be copied'
    )
    assert.ok(
      await fs
        .access(subdirPrivateFile)
        .then(() => false)
        .catch(() => true),
      'Private file in subdir should NOT be copied'
    )
  })
})
