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
    const allowedRoot = path.join(testDir, 'project')
    const fileToDelete = path.join(allowedRoot, 'to-delete.txt')
    const dirToDelete = path.join(allowedRoot, 'to-delete-dir')
    const nestedFile = path.join(dirToDelete, 'nested.txt')

    // Create test structure
    await fs.mkdir(allowedRoot, { recursive: true })
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
    const deleted = await cleanBuild([fileToDelete, dirToDelete], allowedRoot)

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

  it('should reject paths outside the allowed root', async () => {
    const allowedRoot = path.join(testDir, 'project')
    const outsideFile = path.join(testDir, 'outside.txt')
    await fs.mkdir(allowedRoot, { recursive: true })
    await fs.writeFile(outsideFile, 'content')

    await assert.rejects(
      cleanBuild(outsideFile, allowedRoot),
      /Path is outside the allowed root/
    )
    await fs.access(outsideFile)
  })

  it('should reject a relative brace-expanded pattern that resolves outside the allowed root', async () => {
    const allowedRoot = path.join(testDir, 'project')
    const outsideFile = path.join(testDir, 'outside.txt')
    await fs.mkdir(allowedRoot, { recursive: true })
    await fs.writeFile(outsideFile, 'content')

    const originalCwd = process.cwd()
    process.chdir(allowedRoot)
    // Resolve root via cwd() (not the pre-chdir path string) so a symlinked
    // tmpdir (e.g. macOS /tmp -> /private/tmp) can't desync root vs. resolved
    // targets and produce a false "outside root" on its own.
    const resolvedRoot = process.cwd()
    try {
      // No `/` precedes `..`, so it is one literal glob-brace segment, not a
      // resolvable path component — path.resolve() on the raw string treats
      // it as an opaque name and never sees the traversal. Only *after* del
      // expands the brace does `..` (the project's parent) become a real
      // deletion target, which is why the fix must validate expanded matches.
      await assert.rejects(
        cleanBuild(['{to-delete.txt,..}'], resolvedRoot),
        /Path is outside the allowed root/
      )
    } finally {
      process.chdir(originalCwd)
    }
    await fs.access(outsideFile)
  })

  it('should return empty array for empty paths', async () => {
    const deleted = await cleanBuild([])
    assert.deepStrictEqual(deleted, [])

    const deleted2 = await cleanBuild(null)
    assert.deepStrictEqual(deleted2, [])
  })

  it('should handle non-existent paths gracefully', async () => {
    const nonExistent = path.join(testDir, 'does-not-exist.txt')
    const deleted = await cleanBuild(nonExistent, testDir)
    // deleteAsync should return empty array for non-existent paths
    assert.deepStrictEqual(deleted, [])
  })
})
