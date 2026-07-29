import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { describe, it } from 'node:test'

import createChangedFilter from '../../gulp/utils/changed-filter.js'
import { runInSandbox, writeFixtures } from '../test-helpers.js'

describe('Changed Filter Utility', () => {
  function createMockFile(filePath, base) {
    return { path: filePath, base }
  }

  async function collectFilteredFiles(filter, files) {
    const chunks = []

    filter.on('data', (chunk) => {
      chunks.push(chunk)
    })

    const completion = new Promise((resolve, reject) => {
      filter.on('end', resolve)
      filter.on('error', reject)
    })

    for (const file of files) {
      filter.write(file)
    }
    filter.end()
    await completion

    return chunks
  }

  it('should filter out unchanged files and let through changed ones', async () => {
    await runInSandbox('changed-filter', async (sandbox) => {
      const srcDir = path.join(sandbox, 'src')
      const destDir = path.join(sandbox, 'dest')

      await fs.mkdir(srcDir, { recursive: true })
      await fs.mkdir(destDir, { recursive: true })

      const srcFile = path.join(srcDir, 'file.txt')
      const destFile = path.join(destDir, 'file.txt')

      await fs.writeFile(srcFile, 'source')
      await fs.writeFile(destFile, 'destination')

      // Make destination newer than source to simulate unchanged
      const now = new Date()
      const future = new Date(now.getTime() + 10000)
      await fs.utimes(destFile, future, future)

      const newSrcFile = path.join(srcDir, 'new.txt')
      await fs.writeFile(newSrcFile, 'new')

      const filter = createChangedFilter(destDir)
      const chunks = await collectFilteredFiles(filter, [
        createMockFile(srcFile, srcDir),
        createMockFile(newSrcFile, srcDir),
      ])

      assert.strictEqual(chunks.length, 1)
      assert.strictEqual(chunks[0].path, newSrcFile)
    })
  })

  it('should preserve nested paths from file.base when file.relative is missing', async () => {
    await runInSandbox('changed-filter-base', async (sandbox) => {
      const srcDir = path.join(sandbox, 'src')
      const destDir = path.join(sandbox, 'dest')
      const srcFile = path.join(srcDir, 'nested', 'file.txt')
      const destFile = path.join(destDir, 'nested', 'file.txt')

      await fs.mkdir(path.dirname(srcFile), { recursive: true })
      await fs.mkdir(path.dirname(destFile), { recursive: true })
      await fs.writeFile(srcFile, 'source')
      await fs.writeFile(destFile, 'destination')

      const future = new Date(Date.now() + 10000)
      await fs.utimes(destFile, future, future)

      const filter = createChangedFilter(destDir)
      const chunks = await collectFilteredFiles(filter, [
        { path: srcFile, base: srcDir },
      ])

      assert.deepStrictEqual(chunks, [])
    })
  })

  it('should reject files without relative path context', async () => {
    await runInSandbox('changed-filter-missing-relative', async (sandbox) => {
      const srcFile = path.join(sandbox, 'file.txt')
      await fs.writeFile(srcFile, 'source')

      const filter = createChangedFilter(path.join(sandbox, 'dest'))

      await assert.rejects(async () => {
        await collectFilteredFiles(filter, [{ path: srcFile }])
      }, /file\.relative is required/)
    })
  })
})
