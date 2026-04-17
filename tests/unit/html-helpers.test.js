import assert from 'node:assert/strict'
import path from 'node:path'
import { describe, it } from 'node:test'

import {
  resolveTransformKey,
  transformJsonToHtml,
} from '../../gulp/utils/index.js'

describe('HTML Helpers (Unit)', function htmlHelperTests() {
  describe('resolveTransformKey', function transformKeyTests() {
    it('should map css -> transformCss', function verifyCssMapping() {
      assert.strictEqual(resolveTransformKey('css'), 'transformCss')
    })

    it('should map js -> transformJs', function verifyJsMapping() {
      assert.strictEqual(resolveTransformKey('js'), 'transformJs')
    })

    it('should map cdn-js -> transformCdnJs', function verifyCdnJsMapping() {
      assert.strictEqual(resolveTransformKey('cdn-js'), 'transformCdnJs')
    })

    it('should return null for unknown tags', function verifyUnknownTagMapping() {
      assert.strictEqual(resolveTransformKey('unknown'), null)
    })
  })

  describe('transformJsonToHtml', function jsonToHtmlTests() {
    const mockParams = {
      dataSource: '/tmp/src',
      output: '/tmp/dest',
    }

    it('should correctly transform file path and content', function verifyJsonTransformation() {
      const fileContent = JSON.stringify({
        title: 'Test Page',
        content: '# Hello',
      })
      const mockFile = {
        path: path.resolve(mockParams.dataSource, 'test.json'),
        base: path.resolve(mockParams.dataSource),
        contents: Buffer.from(fileContent),
        isBuffer: function isBuffer() {
          return true
        },
        isNull: function isNull() {
          return false
        },
      }

      const result = transformJsonToHtml(mockFile, mockParams)

      assert.ok(result.path.endsWith('test.html'))
      assert.ok(result.contents.toString().includes('layout-default.njk'))
      assert.strictEqual(result.data.title, 'Test Page')
    })

    it('should throw descriptive error for invalid JSON payload', function verifyInvalidJsonError() {
      const mockFile = {
        path: path.resolve(mockParams.dataSource, 'broken.json'),
        base: path.resolve(mockParams.dataSource),
        contents: Buffer.from('{"title":"Broken",'),
        isBuffer: function isBuffer() {
          return true
        },
        isNull: function isNull() {
          return false
        },
      }

      assert.throws(function runBrokenJson() {
        transformJsonToHtml(mockFile, mockParams)
      }, /Failed to parse JSON/)
    })

    it('should throw descriptive error when parsed payload is not an object', function verifyNonObjectJsonError() {
      const mockFile = {
        path: path.resolve(mockParams.dataSource, 'scalar.json'),
        base: path.resolve(mockParams.dataSource),
        contents: Buffer.from('"not-an-object"'),
        isBuffer: function isBuffer() {
          return true
        },
        isNull: function isNull() {
          return false
        },
      }

      assert.throws(function runScalarJson() {
        transformJsonToHtml(mockFile, mockParams)
      }, /Parsed JSON must be an object/)
    })
  })
})
