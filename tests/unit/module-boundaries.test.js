import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import * as cleanBuildModule from '../../gulp/tasks/clean-build.js'
import * as copyStaticModule from '../../gulp/tasks/copy-static.js'
import * as faviconsModule from '../../gulp/tasks/generate-favicons.js'
import * as processHtmlModule from '../../gulp/tasks/process-html.js'
import * as imageTasksModule from '../../gulp/tasks/process-images.js'
import * as purgeCssModule from '../../gulp/tasks/purge-css.js'
import * as serveSiteModule from '../../gulp/tasks/serve-site.js'
import * as validateHtmlModule from '../../gulp/tasks/validate-html.js'
import * as htmlOutputModule from '../../gulp/utils/html-output.js'
import * as htmlRenderingModule from '../../gulp/utils/html-rendering.js'
import * as imagePipelineModule from '../../gulp/utils/image-pipeline.js'
import * as loggerModule from '../../gulp/utils/logger.js'
import * as navigationAssetsModule from '../../gulp/utils/navigation-assets.js'
import * as routeDataModule from '../../gulp/utils/route-data.js'
import * as sassDependencyCacheModule from '../../gulp/utils/sass-dependency-cache.js'
import * as sassPipelineModule from '../../gulp/utils/sass-pipeline.js'
import * as envModule from '../../src/config/env.js'
import * as testHelpersModule from '../test-helpers.js'

describe('Module Boundaries', () => {
  it('should expose logger through default service and createLogger seam', () => {
    assert.deepStrictEqual(Object.keys(loggerModule).sort(), [
      'createLogger',
      'default',
    ])
  })

  it('should expose serve-site as a default-only orchestration module', () => {
    assert.deepStrictEqual(Object.keys(serveSiteModule), ['default'])
  })

  it('should expose process-images task API through the default service plus validate seam', () => {
    assert.deepStrictEqual(Object.keys(imageTasksModule).sort(), [
      'default',
      'validateImage',
    ])
  })

  it('should expose env config through the default object only', () => {
    assert.deepStrictEqual(Object.keys(envModule), ['default'])
  })

  it('should expose clean-build as a default-only task module', () => {
    assert.deepStrictEqual(Object.keys(cleanBuildModule), ['default'])
  })

  it('should expose favicon generation as a default-only task module', () => {
    assert.deepStrictEqual(Object.keys(faviconsModule), ['default'])
  })

  it('should expose copy-static as a default-only task module', () => {
    assert.deepStrictEqual(Object.keys(copyStaticModule), ['default'])
  })

  it('should expose process-html as a default-only task module', () => {
    assert.deepStrictEqual(Object.keys(processHtmlModule), ['default'])
  })

  it('should expose html-rendering as a default-only internal service module', () => {
    assert.deepStrictEqual(Object.keys(htmlRenderingModule), ['default'])
  })

  it('should expose purge-css as a default-only task module', () => {
    assert.deepStrictEqual(Object.keys(purgeCssModule), ['default'])
  })

  it('should expose image-pipeline as a default-only internal service module', () => {
    assert.deepStrictEqual(Object.keys(imagePipelineModule), ['default'])
  })

  it('should keep test helper exports limited to active helpers', () => {
    assert.deepStrictEqual(Object.keys(testHelpersModule).sort(), [
      'cleanupSandbox',
      'createMockEnvironment',
      'createTestSandbox',
      'runInSandbox',
      'silenceConsole',
      'writeFixtures',
    ])
  })

  it('should expose validate-html as a default-only task module', () => {
    assert.deepStrictEqual(Object.keys(validateHtmlModule), ['default'])
  })

  it('should expose sass-pipeline as a default-only internal service module', () => {
    assert.deepStrictEqual(Object.keys(sassPipelineModule), ['default'])
  })

  it('should expose sass-dependency-cache as a default-only internal service module', () => {
    assert.deepStrictEqual(Object.keys(sassDependencyCacheModule), ['default'])
  })

  it('should expose route-data through explicit domain seams only', () => {
    assert.deepStrictEqual(Object.keys(routeDataModule).sort(), [
      'applySeoDefaults',
      'buildMenuData',
      'buildPageData',
      'buildRouteExpressionContext',
      'extractMenuEntry',
      'getMenuDataArtifactPath',
      'getPageDataArtifactPath',
      'getRouteDataArtifactsDir',
      'getSiteDataArtifactPath',
      'loadPageDataArtifact',
      'loadRouteArtifactsContext',
      'resolvePageLocation',
      'writeMenuDataArtifact',
      'writePageDataArtifact',
    ])
  })

  it('should expose html-output through explicit output seams only', () => {
    assert.deepStrictEqual(Object.keys(htmlOutputModule).sort(), [
      'cleanHtmlComments',
      'resolveInjectionUrl',
      'sortGlobalAssetPaths',
      'stripTrailingLineWhitespace',
      'stripXhtmlSlashes',
    ])
  })

  it('should expose navigation-assets through explicit asset discovery seams only', () => {
    assert.deepStrictEqual(Object.keys(navigationAssetsModule).sort(), [
      'clearRouteAssetCache',
      'default',
      'discoverRouteScripts',
      'discoverRouteStyles',
    ])
  })
})
