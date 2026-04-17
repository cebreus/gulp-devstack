import assert from 'node:assert/strict'
import path from 'node:path'
import { describe, it } from 'node:test'

import {
  calculateOutputPath,
  cleanHtmlComments,
  resolveInjectionUrl,
  stripXhtmlSlashes,
} from '../../gulp/utils/index.js'

describe('HTML Pipeline Utilities', function htmlPipelineTests() {
  describe('stripXhtmlSlashes', function stripSlashesTests() {
    it('should remove self-closing slashes from void elements', function verifyVoidElementSlashes() {
      const input = '<meta charset="UTF-8" /> <link rel="stylesheet" /> <br />'
      const expected = '<meta charset="UTF-8"> <link rel="stylesheet"> <br>'
      assert.strictEqual(stripXhtmlSlashes(input), expected)
    })

    it('should remove explicit closing tags for void elements', function verifyVoidElementClosingTags() {
      const input = '<img src="test.png"></img>'
      const expected = '<img src="test.png">'
      assert.strictEqual(stripXhtmlSlashes(input), expected)
    })

    it('should preserve self-closing slashes in SVG elements', function verifySvgSlashes() {
      const input =
        '<svg viewBox="0 0 16 16"><path d="M8 2" /><circle cx="8" cy="8" r="4" /><rect x="0" y="0" width="16" height="16" /></svg>'
      const expected =
        '<svg viewBox="0 0 16 16"><path d="M8 2" /><circle cx="8" cy="8" r="4" /><rect x="0" y="0" width="16" height="16" /></svg>'
      assert.strictEqual(stripXhtmlSlashes(input), expected)
    })
  })

  describe('cleanHtmlComments', function cleanCommentsTests() {
    it('should remove standard HTML comments', function verifyStandardComments() {
      const input = '<div><!-- comment -->Content</div>'
      const expected = '<div>Content</div>'
      assert.strictEqual(cleanHtmlComments(input), expected)
    })

    it('should preserve IE conditional comments', function verifyIeComments() {
      const input = '<!--[if IE 9]>IE content<![endif]-->'
      assert.strictEqual(cleanHtmlComments(input), input)
    })

    it('should not remove comments inside scripts or styles', function verifyScriptStyleComments() {
      const input = '<script><!-- var x = 1; --></script>'
      assert.strictEqual(cleanHtmlComments(input), input)
    })
  })

  describe('resolveInjectionUrl', function injectionUrlTests() {
    it('should resolve absolute URL path relative to build output', function verifyAbsoluteUrlResolution() {
      const buildOutput = '/abs/path/to/build-prod'
      const assetPath = '/abs/path/to/build-prod/assets/css/main.css'
      assert.strictEqual(
        resolveInjectionUrl(assetPath, buildOutput),
        '/assets/css/main.css'
      )
    })

    it('should handle backslashes by converting to forward slashes', function verifyBackslashHandling() {
      const root = process.cwd()
      const buildOutput = path.join(root, 'fake-build')
      const assetPath = path.join(buildOutput, 'assets\\js\\app.js')
      assert.strictEqual(
        resolveInjectionUrl(assetPath, buildOutput),
        '/assets/js/app.js'
      )
    })
  })

  describe('calculateOutputPath', function outputPathTests() {
    it('should map source path to destination with new extension', function verifyOutputPathMapping() {
      const inputPath = '/src/routes/about/index.njk'
      const baseDir = '/src/routes'
      const outDir = '/dist'
      assert.strictEqual(
        calculateOutputPath({
          inputPath,
          extFrom: '.njk',
          extTo: '.html',
          baseDir,
          outDir,
        }),
        path.resolve('/dist/about/index.html')
      )
    })
  })
})
