import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, it } from 'node:test'

import cleanBuild from '../../gulp/tasks/clean-build.js'

describe('Clean Build Task', () => {
  let testDir

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'clean-build-'))
  })

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true })
  })

  it('should delete existing files and directories', async () => {
    const fileToDelete = path.join(testDir, 'to-delete.txt')
    const dirToDelete = path.join(testDir, 'to-delete-dir')
    const nestedFile = path.join(dirToDelete, 'nested.txt')

    // Create test structure
    await fs.mkdir(testDir, { recursive: true })
    await fs.writeFile(fileToDelete, 'content')
    await fs.mkdir(dirToDelete, { recursive: true })
    await fs.writeFile(nestedFile, 'nested content')

    // Verify files exist before cleaning
    assert.ok(
      await fs
        .access(fileToDelete)
        .then(() => true)
        .catch(() => false),
      'File should exist before cleaning'
    )
    assert.ok(
      await fs
        .access(dirToDelete)
        .then(() => true)
        .catch(() => false),
      'Directory should exist before cleaning'
    )

    // Run clean
    const deleted = await cleanBuild([fileToDelete, dirToDelete])

    // Verify files are deleted
    assert.ok(
      await fs
        .access(fileToDelete)
        .then(() => false)
        .catch(() => true),
      'File should be deleted'
    )
    assert.ok(
      await fs
        .access(dirToDelete)
        .then(() => false)
        .catch(() => true),
      'Directory should be deleted'
    )

    // Verify return value
    assert.deepStrictEqual(
      deleted.map((p) => path.relative(process.cwd(), p)).sort(),
      [fileToDelete, dirToDelete]
        .map((p) => path.relative(process.cwd(), p))
        .sort()
    )
  })

  it('should return empty array for empty paths', async () => {
    const deleted = await cleanBuild([])
    assert.deepStrictEqual(deleted, [])

    const deleted2 = await cleanBuild(null)
    assert.deepStrictEqual(deleted2, [])
  })

  it('should handle non-existent paths gracefully', async () => {
    const nonExistent = path.join(testDir, 'does-not-exist.txt')
    const deleted = await cleanBuild(nonExistent)
    // deleteAsync should return empty array for non-existent paths
    assert.deepStrictEqual(deleted, [])
  })
})
