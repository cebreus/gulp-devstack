import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { describe, it } from 'node:test'

import * as utilsModule from '../../gulp/utils/index.js'
import {
  ensureDirectoryExists,
  getDirFromGlob,
  getRelativePath,
  handleEmptyPaths,
  isPrivateFile,
  streamToPromise,
  suppressOutdatedBootstrapWarnings,
  toKebabCase,
} from '../../gulp/utils/index.js'
import { cleanupSandbox, createTestSandbox } from '../test-helpers.js'

describe('Helpers Utility - public API boundaries', () => {
  it('should expose only explicit shared seams from the utils barrel', () => {
    assert.ok(!('applySeoDefaults' in utilsModule))
    assert.ok(!('buildGlobalContext' in utilsModule))
    assert.ok(!('buildMenuData' in utilsModule))
    assert.ok(!('buildPageData' in utilsModule))
    assert.ok(!('buildRouteExpressionContext' in utilsModule))
    assert.ok(!('buildTemplateContext' in utilsModule))
    assert.ok(!('calculateOutputPath' in utilsModule))
    assert.equal(typeof utilsModule.cleanHtmlComments, 'function')
    assert.equal(typeof utilsModule.createLogger, 'function')
    assert.ok(!('deepTrimStrings' in utilsModule))
    assert.ok(!('discoverRouteAssets' in utilsModule))
    assert.equal(typeof utilsModule.discoverRouteScripts, 'function')
    assert.equal(typeof utilsModule.discoverRouteStyles, 'function')
    assert.equal(typeof utilsModule.detectType, 'function')
    assert.ok(!('extractMenuEntry' in utilsModule))
    assert.equal(typeof utilsModule.getLqsPlaceholder, 'function')
    assert.ok(!('getMenuDataArtifactPath' in utilsModule))
    assert.ok(!('getPageDataArtifactPath' in utilsModule))
    assert.ok(!('getRouteDataArtifactsDir' in utilsModule))
    assert.ok(!('getSiteDataArtifactPath' in utilsModule))
    assert.equal(typeof utilsModule.optimizeWithSharp, 'function')
    assert.equal(typeof utilsModule.resolveInjectionUrl, 'function')
    assert.ok(!('resolveMetadataUrls' in utilsModule))
    assert.ok(!('resolvePageLocation' in utilsModule))
    assert.equal(typeof utilsModule.stripXhtmlSlashes, 'function')
    assert.ok(!('toBooleanFlag' in utilsModule))
  })
})

describe('Helpers Utility - getRelativePath', () => {
  it('should return relative path from current working directory', () => {
    const absolutePath = path.join(process.cwd(), 'src/assets/css/main.css')
    const expected = 'src/assets/css/main.css'

    const result = getRelativePath(absolutePath)

    assert.strictEqual(result, expected)
  })
})

describe('Helpers Utility - ensureDirectoryExists', () => {
  it('should create directory if it does not exist', async () => {
    const sandbox = await createTestSandbox()
    const targetDir = path.join(sandbox, 'new/nested/dir')

    await ensureDirectoryExists(targetDir)

    const stats = await fs.promises.stat(targetDir)
    assert.ok(stats.isDirectory())

    await cleanupSandbox(sandbox)
  })

  it('should not throw if directory already exists', async () => {
    const sandbox = await createTestSandbox()

    await assert.doesNotReject(async () => {
      await ensureDirectoryExists(sandbox)
    })

    // Verify directory still exists and was not altered
    const stats = await fs.promises.stat(sandbox)
    assert.ok(
      stats.isDirectory(),
      'Sandbox directory should still exist after no-op call'
    )

    await cleanupSandbox(sandbox)
  })
})

describe('Helpers Utility - toKebabCase', () => {
  it('should convert mixed case and spaces to kebab-case', () => {
    assert.strictEqual(toKebabCase('Hello World'), 'hello-world')
    assert.strictEqual(toKebabCase('My Custom Property'), 'my-custom-property')
  })

  it('should handle special characters and extra dashes', () => {
    assert.strictEqual(toKebabCase('Hello! @World'), 'hello-world')
    assert.strictEqual(
      toKebabCase('---multiple---dashes---'),
      'multiple-dashes'
    )
  })
})

describe('Helpers Utility - getDirFromGlob', () => {
  it('should extract base directory from simple glob', () => {
    assert.strictEqual(
      getDirFromGlob('src/assets/js/**/*.js'),
      'src/assets/js/'
    )
  })

  it('should handle array of globs by taking the first one', () => {
    assert.strictEqual(
      getDirFromGlob(['src/css/*.css', 'other/*.css']),
      'src/css/'
    )
  })

  it('should return empty string for empty input', () => {
    assert.strictEqual(getDirFromGlob(''), '')
    assert.strictEqual(getDirFromGlob(), '')
    assert.strictEqual(getDirFromGlob([]), '')
  })
})

describe('Helpers Utility - handleEmptyPaths', () => {
  it('should return true and log for empty array', () => {
    assert.strictEqual(handleEmptyPaths([], 'Empty list'), true)
  })

  it('should return true for null or undefined', () => {
    assert.strictEqual(handleEmptyPaths(null, 'Null path'), true)
    assert.strictEqual(handleEmptyPaths(undefined, 'Undefined path'), true)
  })

  it('should return false for valid paths', () => {
    assert.strictEqual(handleEmptyPaths(['src/main.js'], 'Valid list'), false)
    assert.strictEqual(handleEmptyPaths('src/style.css', 'Valid string'), false)
  })
})

describe('Helpers Utility - ensureDirectoryExists (Array)', () => {
  it('should create multiple directories recursively', async () => {
    const sandbox = await createTestSandbox()
    const targets = [
      path.join(sandbox, 'multi/dir1'),
      path.join(sandbox, 'multi/dir2'),
    ]

    await ensureDirectoryExists(targets)

    for (const target of targets) {
      const stats = await fs.promises.stat(target)
      assert.ok(stats.isDirectory())
    }

    await cleanupSandbox(sandbox)
  })
})

describe('Helpers Utility - suppressOutdatedBootstrapWarnings', () => {
  it('should return true for deprecation warnings', () => {
    assert.strictEqual(
      suppressOutdatedBootstrapWarnings('Deprecation: this is old'),
      true
    )
    assert.strictEqual(
      suppressOutdatedBootstrapWarnings('slash as division is deprecated'),
      true
    )
  })

  it('should return false for other messages', () => {
    assert.strictEqual(
      suppressOutdatedBootstrapWarnings('Compilation success'),
      false
    )
    assert.strictEqual(suppressOutdatedBootstrapWarnings(null), false)
  })
})

describe('Helpers Utility - isPrivateFile', () => {
  it('should return true for files starting with _ or __', () => {
    assert.strictEqual(isPrivateFile('_private.njk'), true)
    assert.strictEqual(isPrivateFile('__hidden.js'), true)
  })

  it('should return true if any parent directory starts with _ or __', () => {
    assert.strictEqual(isPrivateFile('src/lib/components/_debug/test.js'), true)
    assert.strictEqual(isPrivateFile('_drafts/post.md'), true)
    assert.strictEqual(isPrivateFile('src/__tests/helper.js'), true)
  })

  it('should return false for standard files and paths', () => {
    assert.strictEqual(isPrivateFile('src/main.js'), false)
    assert.strictEqual(isPrivateFile('index.njk'), false)
    assert.strictEqual(isPrivateFile('assets/css/_variables.scss'), true)
  })

  it('should return false for empty or null input', () => {
    assert.strictEqual(isPrivateFile(''), false)
    assert.strictEqual(isPrivateFile(null), false)
  })
})

describe('Helpers Utility - streamToPromise', () => {
  it('should resolve when stream ends', async () => {
    const { PassThrough } = await import('node:stream')
    const stream = new PassThrough()
    const chunks = []
    stream.on('data', (chunk) => {
      chunks.push(chunk)
    })
    const promise = streamToPromise(stream)
    stream.end('test data')
    await promise
    assert.strictEqual(
      Buffer.concat(chunks).toString(),
      'test data',
      'Stream should have emitted the written data before resolving'
    )
  })

  it('should reject when stream emits error', async () => {
    const { PassThrough } = await import('node:stream')
    const stream = new PassThrough()
    const promise = streamToPromise(stream)
    stream.destroy(new Error('Stream error'))
    await assert.rejects(promise, /Stream error/)
  })
})
