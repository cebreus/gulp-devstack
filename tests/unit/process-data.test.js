import assert from 'node:assert/strict'
import path from 'node:path'
import { describe, it } from 'node:test'

import { resolveDataExpressions } from '../../gulp/tasks/process-data.js'
import {
  applySeoDefaults,
  buildPageData,
  resolvePageLocation,
} from '../../gulp/utils/index.js'

describe('Process Data Pure Logic', function processDataLogicTests() {
  describe('resolveDataExpressions', function dataExpressionTests() {
    const context = {
      site: { version: '4.5.0' },
      page: { title: 'Home' },
    }

    it('should leave plain strings untouched', function verifyPlainStrings() {
      const input = 'Hello World'
      const result = resolveDataExpressions(input, context)
      assert.strictEqual(result, 'Hello World')
    })

    it('should resolve simple Nunjucks expressions', function verifySimpleExpressions() {
      const input = 'Version {{ site.version }}'
      const result = resolveDataExpressions(input, context)
      assert.strictEqual(result, 'Version 4.5.0')
    })

    it('should resolve expressions in nested objects', function verifyNestedObjectExpressions() {
      const input = {
        hero: {
          badge: 'v{{ site.version }}',
          text: 'Welcome to {{ page.title }}',
        },
      }
      const expected = {
        hero: {
          badge: 'v4.5.0',
          text: 'Welcome to Home',
        },
      }
      const result = resolveDataExpressions(input, context)
      assert.deepStrictEqual(result, expected)
    })

    it('should resolve expressions in arrays', function verifyArrayExpressions() {
      const input = ['{{ site.version }}', 'other']
      const expected = ['4.5.0', 'other']
      const result = resolveDataExpressions(input, context)
      assert.deepStrictEqual(result, expected)
    })

    it('should handle invalid expressions gracefully by returning original string', function verifyInvalidExpressions() {
      const input = '{{ site.invalid.path }}'
      assert.doesNotThrow(function runInvalidExpression() {
        resolveDataExpressions(input, context)
      })
    })
  })

  describe('resolvePageLocation', function pageLocationTests() {
    const routesRoot = './src/routes'
    const absRoutesRoot = path.resolve(routesRoot)

    it('should resolve root index correctly', function verifyRootIndexLocation() {
      const filePath = path.join(absRoutesRoot, 'index.md')
      const result = resolvePageLocation(filePath, 'index', routesRoot)
      assert.strictEqual(result.pagePath, '/')
      assert.strictEqual(result.relativeDir, '')
    })

    it('should resolve nested index correctly', function verifyNestedIndexLocation() {
      const filePath = path.join(absRoutesRoot, 'about/index.md')
      const result = resolvePageLocation(filePath, 'index', routesRoot)
      assert.strictEqual(result.pagePath, '/about/')
      assert.strictEqual(result.relativeDir, 'about')
    })

    it('should resolve deep nested file correctly', function verifyDeepFileLocation() {
      const filePath = path.join(absRoutesRoot, 'blog/2024/post.md')
      const result = resolvePageLocation(filePath, 'post', routesRoot)
      assert.strictEqual(result.pagePath, '/blog/2024/post')
      assert.strictEqual(result.relativeDir, 'blog/2024')
    })
  })

  describe('applySeoDefaults', function seoDefaultsTests() {
    it('should generate canonical URL correctly', function verifyCanonicalUrl() {
      const pageData = { title: 'Test' }
      const siteConfig = { baseUrl: 'https://example.com' }
      const result = applySeoDefaults(pageData, '/my-page', siteConfig)

      assert.strictEqual(
        result.seo.canonicalSelf,
        'https://example.com/my-page'
      )
      assert.strictEqual(result.openGraph.url, 'https://example.com/my-page')
    })

    it('should preserve existing SEO metadata', function verifySeoPreservation() {
      const pageData = { seo: { title_suffix: ' - Custom' } }
      const result = applySeoDefaults(pageData, '/', { baseUrl: '' })
      assert.strictEqual(result.seo.title_suffix, ' - Custom')
    })
  })

  describe('buildPageData', function pageDataBuilderTests() {
    it('should assemble full page payload with auto pageId', function verifyPagePayload() {
      const frontmatter = { title: 'Hello' }
      const content = '# Body'
      const result = buildPageData({
        frontmatter,
        content,
        fileName: 'my-file',
        pagePath: '/blog/my-file',
      })

      assert.strictEqual(result.title, 'Hello')
      assert.strictEqual(result.content, '# Body')
      assert.strictEqual(result.pageId, 'my-file')
      assert.strictEqual(result.path, '/blog/my-file')
    })

    it('should use "home" as pageId for root index', function verifyRootPageId() {
      const result = buildPageData({
        frontmatter: {},
        content: '',
        fileName: 'index',
        pagePath: '/',
      })
      assert.strictEqual(result.pageId, 'home')
    })
  })
})
