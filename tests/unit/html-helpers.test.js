import assert from 'node:assert/strict'
import path from 'node:path'
import { describe, it } from 'node:test'

import {
  buildGlobalContext,
  buildTemplateContext,
  getMenuDataArtifactPath,
  getPageDataArtifactPath,
  getRouteDataArtifactsDir,
  getSiteDataArtifactPath,
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

    it('should correctly transform file path and content', async function verifyJsonTransformation() {
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

      const result = await transformJsonToHtml(mockFile, mockParams)

      assert.ok(result.path.endsWith('test.html'))
      assert.ok(result.contents.toString().includes('layout-default.njk'))
      assert.strictEqual(result.data.title, 'Test Page')
    })

    it('should throw descriptive error for invalid JSON payload', async function verifyInvalidJsonError() {
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

      await assert.rejects(async function runBrokenJson() {
        await transformJsonToHtml(mockFile, mockParams)
      }, /Failed to parse JSON/)
    })

    it('should throw descriptive error when parsed payload is not an object', async function verifyNonObjectJsonError() {
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

      await assert.rejects(async function runScalarJson() {
        await transformJsonToHtml(mockFile, mockParams)
      }, /Parsed JSON must be an object/)
    })
  })

  describe('route content artifacts', function routeContentArtifactTests() {
    it('should resolve route artifacts into the pages temp directory', function verifyArtifactsDir() {
      assert.strictEqual(
        getRouteDataArtifactsDir('/tmp/build-data'),
        path.join('/tmp/build-data', 'pages')
      )
    })

    it('should resolve the site and menu artifact paths', function verifySharedArtifactPaths() {
      const artifactsBase = path.join('/tmp/build-data', 'pages')

      assert.strictEqual(
        getSiteDataArtifactPath('/tmp/build-data'),
        path.join('/tmp/build-data', 'site.json')
      )
      assert.strictEqual(
        getMenuDataArtifactPath(artifactsBase),
        path.join(artifactsBase, 'menu.json')
      )
    })

    it('should resolve a page artifact from the route path', function verifyPageArtifactPath() {
      const artifactPath = getPageDataArtifactPath({
        artifactsBase: '/tmp/build-data/pages',
        routesBase: '/tmp/project/src/routes',
        filePath: '/tmp/project/src/routes/about/index.njk',
      })

      assert.strictEqual(
        artifactPath,
        path.join('/tmp/build-data/pages', 'about/index.json')
      )
    })
  })

  describe('route content context', function routeContentContextTests() {
    it('should merge site and menu artifacts into one global context', function verifyGlobalContext() {
      const result = buildGlobalContext({
        siteData: { title: 'Site' },
        menuData: { menu: [{ name: 'Home' }] },
      })

      assert.deepStrictEqual(result, {
        title: 'Site',
        menu: [{ name: 'Home' }],
      })
    })

    it('should assemble the final template context shape', function verifyTemplateContextShape() {
      const result = buildTemplateContext({
        pageData: { title: 'About' },
        globalContext: { title: 'Site' },
        config: { version: 'dev' },
        pageStyles: ['/assets/css/about.css'],
        pageScripts: ['/assets/js/about.js'],
        isPrivate: function isPrivate(filePath) {
          return filePath.startsWith('_')
        },
      })

      assert.strictEqual(result.title, 'About')
      assert.deepStrictEqual(result.page, { title: 'About' })
      assert.deepStrictEqual(result.site, { title: 'Site' })
      assert.deepStrictEqual(result.pageStyles, ['/assets/css/about.css'])
      assert.deepStrictEqual(result.pageScripts, ['/assets/js/about.js'])
      assert.strictEqual(result.config.version, 'dev')
      assert.strictEqual(result.isPrivate('_draft.md'), true)
    })
  })
})
