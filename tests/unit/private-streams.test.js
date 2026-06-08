import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it } from 'node:test'

import {
  createPrivateFileFilter,
  createTrackedFileCollector,
} from '../../gulp/utils/private-streams.js'

describe('Private Streams Utility', () => {
  function createMockFile(filePath) {
    return {
      path: filePath,
      contents: Buffer.from('test'),
      isBuffer: () => {
        return true
      },
      isNull: () => {
        return false
      },
    }
  }

  describe('createPrivateFileFilter', () => {
    it('should filter files based on the provided predicate', async () => {
      const filter = createPrivateFileFilter((filePath) => {
        return filePath.includes('private')
      })
      const chunks = []

      filter.on('data', (chunk) => {
        chunks.push(chunk)
      })

      const p = new Promise((resolve, reject) => {
        filter.on('end', resolve)
        filter.on('error', reject)
      })

      filter.write(createMockFile('public.txt'))
      filter.write(createMockFile('private.txt'))
      filter.end()

      await p

      assert.strictEqual(chunks.length, 1)
      assert.strictEqual(chunks[0].path, 'public.txt')
    })
  })

  describe('createTrackedFileCollector', () => {
    it('should collect file paths and transform them', async () => {
      const collection = []
      const collector = createTrackedFileCollector(collection, (filePath) => {
        return `relative/${filePath}`
      })

      const chunks = []
      collector.on('data', (chunk) => {
        chunks.push(chunk)
      })

      const p = new Promise((resolve, reject) => {
        collector.on('end', resolve)
        collector.on('error', reject)
      })

      collector.write(createMockFile('file1.txt'))
      collector.write(createMockFile('file2.txt'))
      collector.end()

      await p

      assert.strictEqual(chunks.length, 2)
      assert.deepStrictEqual(collection, [
        'relative/file1.txt',
        'relative/file2.txt',
      ])
    })
  })
})
