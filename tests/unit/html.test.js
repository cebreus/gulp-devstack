import assert from 'node:assert/strict'
import path from 'node:path'
import { describe, it } from 'node:test'

import {
  cleanHtmlComments,
  resolveInjectionUrl,
  sortGlobalAssetPaths,
  stripTrailingLineWhitespace,
  stripXhtmlSlashes,
} from '../../gulp/utils/html-output.js'
import htmlRendering from '../../gulp/utils/html-rendering.js'

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

    it('should remove explicit closing tags for all tracked void elements', () => {
      const input = '<source srcset="hero.webp"></source><wbr></wbr>'
      const expected = '<source srcset="hero.webp"><wbr>'
      assert.strictEqual(stripXhtmlSlashes(input), expected)
    })

    it('should preserve self-closing slashes in SVG elements', () => {
      const input =
        '<svg viewBox="0 0 16 16"><path d="M8 2" /><circle cx="8" cy="8" r="4" /><rect x="0" y="0" width="16" height="16" /></svg>'
      const expected =
        '<svg viewBox="0 0 16 16"><path d="M8 2" /><circle cx="8" cy="8" r="4" /><rect x="0" y="0" width="16" height="16" /></svg>'
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

      const styleInput = '<style><!-- .example { color: red; } --></style>'
      assert.strictEqual(cleanHtmlComments(styleInput), styleInput)
    })

    it('should treat tag-like script strings as raw text', () => {
      const input =
        '<script>const value = "<script>"; <!-- keep --></script><!-- remove -->'
      const expected =
        '<script>const value = "<script>"; <!-- keep --></script>'
      assert.strictEqual(cleanHtmlComments(input), expected)
    })

    it('should preserve comments inside scripts after comparison operators', () => {
      const input =
        '<script>if (count < max) { <!-- legacy marker --> }</script>'
      assert.strictEqual(cleanHtmlComments(input), input)
    })

    it('should remove comments after a closed script block', () => {
      const input =
        '<script>const ok = true</script><!-- remove me --><main></main>'
      const expected = '<script>const ok = true</script><main></main>'
      assert.strictEqual(cleanHtmlComments(input), expected)
    })
  })

  describe('stripTrailingLineWhitespace', () => {
    it('should remove trailing whitespace from each rendered line', () => {
      const input = '<div>  \n  <span>Test</span>\t\n</div>   '
      const expected = '<div>\n  <span>Test</span>\n</div>'

      assert.strictEqual(stripTrailingLineWhitespace(input), expected)
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

    it('should handle backslashes by converting to forward slashes', () => {
      const root = process.cwd()
      const buildOutput = path.join(root, 'fake-build')
      const assetPath = path.join(buildOutput, 'assets\\js\\app.js')
      assert.strictEqual(
        resolveInjectionUrl(assetPath, buildOutput),
        '/assets/js/app.js'
      )
    })

    it('should reject assets outside the build output', () => {
      assert.throws(
        () =>
          resolveInjectionUrl('/abs/path/to/main.css', '/abs/path/to/build'),
        /Asset is outside the build output/
      )
    })
  })

  describe('formatTemplateDate', () => {
    it('should preserve epoch zero and reject invalid dates', () => {
      assert.strictEqual(
        htmlRendering.formatTemplateDate(0),
        '1970-01-01T00:00:00.000Z'
      )
      assert.throws(
        () => htmlRendering.formatTemplateDate('invalid'),
        /Invalid template date/
      )
    })
  })

  describe('sortGlobalAssetPaths', () => {
    it('should sort global assets by explicit build priority', () => {
      const result = sortGlobalAssetPaths([
        '/build/assets/css/main.css',
        '/build/assets/css/bootstrap.css',
        '/build/assets/css/u-devstack.css',
        '/build/assets/css/components.css',
      ])

      assert.deepStrictEqual(result, [
        '/build/assets/css/bootstrap.css',
        '/build/assets/css/components.css',
        '/build/assets/css/main.css',
        '/build/assets/css/u-devstack.css',
      ])
    })
  })
})
