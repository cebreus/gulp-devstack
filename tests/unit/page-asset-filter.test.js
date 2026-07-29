import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { isCriticalPageAsset } from '../e2e/page-asset-filter.js'

describe('E2E page asset filter', () => {
  it('should treat local CSS and JS as critical page assets', () => {
    assert.strictEqual(
      isCriticalPageAsset('http://localhost:3000/assets/css/index.css'),
      true
    )
    assert.strictEqual(
      isCriticalPageAsset('http://localhost:3000/assets/js/main.js?cache=1'),
      true
    )
  })

  it('should ignore non-CSS and non-JS assets such as external badges', () => {
    assert.strictEqual(
      isCriticalPageAsset(
        'https://github.com/cebreus/gulp-devstack/actions/workflows/github-pages-deploy-pnpm.yml/badge.svg'
      ),
      false
    )
    assert.strictEqual(
      isCriticalPageAsset(
        'https://img.shields.io/github/license/cebreus/gulp-devstack'
      ),
      false
    )
    assert.strictEqual(isCriticalPageAsset('/docs?source=main.js'), false)
    assert.strictEqual(isCriticalPageAsset('/docs#main.js'), false)
    assert.strictEqual(isCriticalPageAsset('http://[invalid'), false)
  })
})
