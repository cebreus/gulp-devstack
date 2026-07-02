import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { getDirFromGlob } from '../../gulp/utils/core.js'
import { resolvePageLocation } from '../../gulp/utils/route-data.js'
import { isDirectRun } from '../../scripts/run-njklint.js'

describe('Windows Compatibility Robustness (Cross-Platform Logic)', () => {
  describe('getDirFromGlob', () => {
    it('should extract directory using forward slashes', () => {
      assert.strictEqual(getDirFromGlob('src/assets/**/*.js'), 'src/assets/')
    })

    it('should extract directory using backward slashes (Windows style)', () => {
      assert.strictEqual(
        getDirFromGlob('src\\assets\\**\\*.js'),
        'src\\assets\\'
      )
    })

    it('should handle mixed slashes gracefully', () => {
      assert.strictEqual(
        getDirFromGlob('src/assets\\scripts/**/*.js'),
        'src/assets\\scripts/'
      )
    })
  })

  describe('resolvePageLocation (Routing)', () => {
    const routesRoot = '/absolute/repo/src/routes'

    it('should normalize Windows paths to POSIX URLs', () => {
      const filePath = '/absolute/repo/src/routes/nested\\page.njk'
      const { relativeDir, pagePath } = resolvePageLocation(
        filePath,
        'page',
        routesRoot
      )

      assert.strictEqual(
        relativeDir,
        'nested',
        'relativeDir should use forward slashes'
      )
      assert.strictEqual(
        pagePath,
        '/nested/page',
        'pagePath should be a valid URL'
      )
    })

    it('should handle deep Windows nesting', () => {
      const filePath = '/absolute/repo/src/routes/a\\b\\c\\index.njk'
      const { relativeDir, pagePath } = resolvePageLocation(
        filePath,
        'index',
        routesRoot
      )

      assert.strictEqual(relativeDir, 'a/b/c')
      assert.strictEqual(pagePath, '/a/b/c/')
    })
  })

  describe('isDirectRun (Case Sensitivity & Drive Letters)', () => {
    it('should return true for case-insensitive matches on Windows', () => {
      const moduleUrl = 'file:///C:/Repo/scripts/hook.js'
      const argvPath = 'c:\\repo\\scripts\\hook.js'

      if (process.platform === 'win32') {
        assert.strictEqual(isDirectRun(moduleUrl, argvPath), true)
      } else {
        assert.strictEqual(isDirectRun('file:///repo/a.js', '/repo/a.js'), true)
        assert.strictEqual(
          isDirectRun('file:///repo/A.js', '/repo/a.js'),
          false
        )
      }
    })
  })
})
