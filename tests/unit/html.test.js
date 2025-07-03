import assert from 'node:assert/strict'
import path from 'node:path'
import { afterEach, beforeEach, describe, it } from 'node:test'

import {
  calculateOutputPath,
  cleanHtmlComments,
  resolveInjectionUrl,
  stripXhtmlSlashes,
} from '../../gulp/tasks/process-html.js'

describe('HTML Pipeline Utilities', () => {
  describe('stripXhtmlSlashes', () => {
    it('should remove self-closing slashes from void elements', () => {
      const input = '<meta charset="UTF-8" /> <link rel="stylesheet" /> <br />'
      const expected = '<meta charset="UTF-8"> <link rel="stylesheet"> <br>'
      assert.strictEqual(stripXhtmlSlashes(input), expected)
    })

    it('should remove explicit closing tags for void elements', () => {
      const input = '<img src="test.png"></img>'
      const expected = '<img src="test.png">'
      assert.strictEqual(stripXhtmlSlashes(input), expected)
    })
  })

  describe('cleanHtmlComments', () => {
    it('should remove standard HTML comments', () => {
      const input = '<div><!-- comment -->Content</div>'
      const expected = '<div>Content</div>'
      assert.strictEqual(cleanHtmlComments(input), expected)
    })

    it('should preserve IE conditional comments', () => {
      const input = '<!--[if IE 9]>IE content<![endif]-->'
      assert.strictEqual(cleanHtmlComments(input), input)
    })

    it('should not remove comments inside scripts or styles', () => {
      const input = '<script><!-- var x = 1; --></script>'
      assert.strictEqual(cleanHtmlComments(input), input)
    })
  })

  describe('resolveInjectionUrl', () => {
    it('should resolve absolute URL path relative to build output', () => {
      const buildOutput = '/abs/path/to/build-prod'
      const assetPath = '/abs/path/to/build-prod/assets/css/main.css'
      assert.strictEqual(
        resolveInjectionUrl(assetPath, buildOutput),
        '/assets/css/main.css'
      )
    })

    it('should handle windows-style paths by converting to forward slashes', () => {
      const buildOutput = 'C:\\build'
      const assetPath = 'C:\\build\\assets\\js\\app.js'
      assert.strictEqual(
        resolveInjectionUrl(assetPath, buildOutput),
        '/assets/js/app.js'
      )
    })
  })

  describe('calculateOutputPath', () => {
    it('should map source path to destination with new extension', () => {
      const input = '/src/routes/about/index.njk'
      const base = '/src/routes'
      const out = '/dist'
      assert.strictEqual(
        calculateOutputPath(input, '.njk', '.html', base, out),
        path.resolve('/dist/about/index.html')
      )
    })
  })
})
