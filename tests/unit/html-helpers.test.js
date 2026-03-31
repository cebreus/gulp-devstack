import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { after, before, describe, it } from 'node:test'

import {
  ensureBuildDirs,
  resolveTransformKey,
  transformJsonToHtml,
} from '../../gulp/tasks/process-html.js'

describe('HTML Helpers (Unit)', () => {
  describe('resolveTransformKey', () => {
    it('should map css -> transformCss', () => {
      assert.strictEqual(resolveTransformKey('css'), 'transformCss')
    })

    it('should map js -> transformJs', () => {
      assert.strictEqual(resolveTransformKey('js'), 'transformJs')
    })

    it('should map cdn-js -> transformCdnJs', () => {
      assert.strictEqual(resolveTransformKey('cdn-js'), 'transformCdnJs')
    })

    it('should return null for unknown tags', () => {
      assert.strictEqual(resolveTransformKey('unknown'), null)
    })
  })

  describe('ensureBuildDirs', () => {
    let tempDir

    before(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-dirs-'))
    })

    after(() => {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true })
      }
    })

    it('should create non-existent directories recursively', () => {
      const target = path.join(tempDir, 'deep/nested/path')
      ensureBuildDirs([target])

      const exists = fs.existsSync(target)
      assert.ok(exists, 'Directory should be created')
    })

    it('should not throw if directories already exist', () => {
      const target = path.join(tempDir, 'existing')
      fs.mkdirSync(target)

      assert.doesNotThrow(() => ensureBuildDirs([target]))
    })
  })

  describe('transformJsonToHtml', () => {
    const mockParams = {
      dataSource: '/tmp/src',
      output: '/tmp/dest',
    }

    it('should correctly transform file path and content', () => {
      const fileContent = JSON.stringify({
        title: 'Test Page',
        content: '# Hello',
      })
      const mockFile = {
        path: path.resolve(mockParams.dataSource, 'test.json'),
        base: path.resolve(mockParams.dataSource),
        contents: Buffer.from(fileContent),
        isBuffer: () => true,
        isNull: () => false,
      }

      const result = transformJsonToHtml(mockFile, mockParams)

      // Check path transformation (.json -> .html)
      assert.ok(result.path.endsWith('test.html'))
      // Check content transformation (Markdown template)
      assert.ok(result.contents.toString().includes('layout-default.njk'))
      // Check data parsing
      assert.strictEqual(result.data.title, 'Test Page')
    })
  })
})
