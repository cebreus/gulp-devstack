import assert from 'node:assert/strict'
import path from 'node:path'
import { describe, it } from 'node:test'

import {
  applySeoDefaults,
  buildPageData,
  resolvePageLocation,
} from '../../gulp/tasks/process-data.js'

describe('Process Data Pure Logic', () => {
  describe('resolvePageLocation', () => {
    const routesRoot = './src/routes'
    const absRoutesRoot = path.resolve(routesRoot)

    it('should resolve root index correctly', () => {
      const filePath = path.join(absRoutesRoot, 'index.md')
      const result = resolvePageLocation(filePath, 'index', routesRoot)
      assert.strictEqual(result.pagePath, '/')
      assert.strictEqual(result.relativeDir, '')
    })

    it('should resolve nested index correctly', () => {
      const filePath = path.join(absRoutesRoot, 'about/index.md')
      const result = resolvePageLocation(filePath, 'index', routesRoot)
      assert.strictEqual(result.pagePath, '/about')
      assert.strictEqual(result.relativeDir, 'about')
    })

    it('should resolve deep nested file correctly', () => {
      const filePath = path.join(absRoutesRoot, 'blog/2024/post.md')
      const result = resolvePageLocation(filePath, 'post', routesRoot)
      assert.strictEqual(result.pagePath, '/blog/2024/post')
      assert.strictEqual(result.relativeDir, 'blog/2024')
    })
  })

  describe('applySeoDefaults', () => {
    it('should generate canonical URL correctly', () => {
      const data = { title: 'Test' }
      const siteConfig = { baseUrl: 'https://example.com' }
      const result = applySeoDefaults(data, '/my-page', siteConfig)

      assert.strictEqual(
        result.seo.canonical_self,
        'https://example.com/my-page'
      )
      assert.strictEqual(result.open_graph.url, 'https://example.com/my-page')
    })

    it('should preserve existing SEO metadata', () => {
      const data = { seo: { title_suffix: ' - Custom' } }
      const result = applySeoDefaults(data, '/', { baseUrl: '' })
      assert.strictEqual(result.seo.title_suffix, ' - Custom')
    })
  })

  describe('buildPageData', () => {
    it('should assemble full page payload with auto page_id', () => {
      const frontmatter = { title: 'Hello' }
      const content = '# Body'
      const result = buildPageData(
        frontmatter,
        content,
        'my-file',
        '/blog/my-file'
      )

      assert.strictEqual(result.title, 'Hello')
      assert.strictEqual(result.content, '# Body')
      assert.strictEqual(result.page_id, 'my-file')
      assert.strictEqual(result.path, '/blog/my-file')
    })

    it('should use "home" as page_id for root index', () => {
      const result = buildPageData({}, '', 'index', '/')
      assert.strictEqual(result.page_id, 'home')
    })
  })
})
