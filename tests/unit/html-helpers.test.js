import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { describe, it } from 'node:test'

import {
  clearRouteAssetCache,
  discoverRouteStyles,
} from '../../gulp/utils/navigation-assets.js'
import {
  getMenuDataArtifactPath,
  getPageDataArtifactPath,
  getRouteDataArtifactsDir,
  getSiteDataArtifactPath,
  loadPageDataArtifact,
  loadRouteArtifactsContext,
  writeMenuDataArtifact,
  writePageDataArtifact,
} from '../../gulp/utils/route-data.js'
import { runInSandbox } from '../test-helpers.js'

describe('HTML Helpers (Unit)', () => {
  describe('route content artifacts', () => {
    it('should resolve route artifacts into the pages temp directory', () => {
      assert.strictEqual(
        getRouteDataArtifactsDir('/tmp/build-data'),
        path.join('/tmp/build-data', 'pages')
      )
    })

    it('should resolve the site and menu artifact paths', () => {
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

    it('should resolve a page artifact from the route path', () => {
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

    it('should write and reload page and menu artifacts through route-data seam', async () => {
      await runInSandbox('route-artifact-io', async (sandbox) => {
        const tempBase = path.join(sandbox, '.tmp')
        const routesBase = path.join(sandbox, 'src', 'routes')
        const filePath = path.join(routesBase, 'about', 'index.md')
        const artifactsBase = getRouteDataArtifactsDir(tempBase)
        const pageData = { title: 'About', pageId: 'about', path: '/about/' }

        await writePageDataArtifact({
          artifactsBase,
          routesBase,
          filePath,
          pageData,
        })
        await writeMenuDataArtifact(artifactsBase, [
          { name: 'About', order: 2, path: '/about/' },
        ])
        await fs.mkdir(tempBase, { recursive: true })
        await fs.writeFile(
          getSiteDataArtifactPath(tempBase),
          JSON.stringify({ title: 'Sandbox Site' }, null, 2)
        )

        const loadedPage = await loadPageDataArtifact({
          artifactsBase,
          routesBase,
          filePath,
        })
        const loadedContext = await loadRouteArtifactsContext(tempBase)

        assert.deepStrictEqual(loadedPage, pageData)
        assert.deepStrictEqual(loadedContext, {
          siteData: { title: 'Sandbox Site' },
          menuData: {
            menu: [{ name: 'About', order: 2, path: '/about/' }],
          },
        })
      })
    })

    it('should return empty objects when route artifacts are missing', async () => {
      await runInSandbox('route-artifact-empty', async (sandbox) => {
        const tempBase = path.join(sandbox, '.tmp')
        const loadedContext = await loadRouteArtifactsContext(tempBase)

        assert.deepStrictEqual(loadedContext, {
          siteData: {},
          menuData: {},
        })
      })
    })

    it('should throw with cause when a route artifact contains invalid json', async () => {
      await runInSandbox('route-artifact-invalid-json', async (sandbox) => {
        const tempBase = path.join(sandbox, '.tmp')
        const routesBase = path.join(sandbox, 'src', 'routes')
        const artifactsBase = getRouteDataArtifactsDir(tempBase)
        const filePath = path.join(routesBase, 'about', 'index.njk')
        const artifactPath = getPageDataArtifactPath({
          artifactsBase,
          routesBase,
          filePath,
        })

        await fs.mkdir(path.dirname(artifactPath), { recursive: true })
        await fs.writeFile(artifactPath, '{invalid json')

        await assert.rejects(
          () =>
            loadPageDataArtifact({
              artifactsBase,
              routesBase,
              filePath,
            }),
          (error) => {
            assert.match(error.message, /Failed to read route artifact/)
            assert.ok(error.cause instanceof Error)
            return true
          }
        )
      })
    })
  })

  describe('route asset discovery', () => {
    it('should expose newly added route styles after cache clear', async () => {
      await runInSandbox('route-asset-cache', async (sandbox) => {
        const assetDir = path.join(sandbox, 'assets/css/about')
        await fs.mkdir(assetDir, { recursive: true })

        const emptyResult = await discoverRouteStyles('about', 'index', sandbox)
        assert.deepStrictEqual(emptyResult, [])

        await fs.writeFile(path.join(assetDir, 'index.css'), '.about {}')
        clearRouteAssetCache()

        const updatedResult = await discoverRouteStyles(
          'about',
          'index',
          sandbox
        )
        assert.deepStrictEqual(updatedResult, ['/assets/css/about/index.css'])
      })
    })
  })
})
