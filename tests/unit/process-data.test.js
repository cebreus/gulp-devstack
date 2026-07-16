import assert from 'node:assert/strict'
import path from 'node:path'
import { describe, it } from 'node:test'

import * as processDataModule from '../../gulp/tasks/process-data.js'
import {
  applySeoDefaults,
  buildPageData,
  buildRouteExpressionContext,
  resolvePageLocation,
} from '../../gulp/utils/route-data.js'

describe('Process Data public API', () => {
  it('should expose only the Gulp task', () => {
    assert.deepStrictEqual(Object.keys(processDataModule), ['default'])
  })
})

describe('Process Data Pure Logic - buildRouteExpressionContext', () => {
  it('should expose site and page objects for frontmatter rendering', () => {
    const result = buildRouteExpressionContext({
      frontmatter: { title: 'Home' },
      siteConfig: { version: '4.5.0' },
    })

    assert.deepStrictEqual(result, {
      site: { version: '4.5.0' },
      page: { title: 'Home' },
    })
  })
})

describe('Process Data Pure Logic - resolvePageLocation', () => {
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
    assert.strictEqual(result.pagePath, '/about/')
    assert.strictEqual(result.relativeDir, 'about')
  })

  it('should resolve deep nested file correctly', () => {
    const filePath = path.join(absRoutesRoot, 'blog/2024/post.md')
    const result = resolvePageLocation(filePath, 'post', routesRoot)
    assert.strictEqual(result.pagePath, '/blog/2024/post')
    assert.strictEqual(result.relativeDir, 'blog/2024')
  })
})

describe('Process Data Pure Logic - applySeoDefaults', () => {
  it('should generate canonical URL correctly', () => {
    const pageData = { title: 'Test' }
    const siteConfig = { baseUrl: 'https://example.com' }
    const result = applySeoDefaults(pageData, '/my-page', siteConfig)

    assert.strictEqual(result.seo.canonicalSelf, 'https://example.com/my-page')
    assert.strictEqual(result.openGraph.url, 'https://example.com/my-page')
  })

  it('should preserve existing SEO metadata', () => {
    const pageData = { seo: { title_suffix: ' - Custom' } }
    const result = applySeoDefaults(pageData, '/', { baseUrl: '' })
    assert.strictEqual(result.seo.title_suffix, ' - Custom')
  })
})

describe('Process Data Pure Logic - buildPageData', () => {
  it('should assemble full page payload with auto pageId', () => {
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

  it('should use "home" as pageId for root index', () => {
    const result = buildPageData({
      frontmatter: {},
      content: '',
      fileName: 'index',
      pagePath: '/',
    })
    assert.strictEqual(result.pageId, 'home')
  })
})
