import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { formatBrokenLinksReport } from '../e2e/page-link-report.js'

describe('Page Link Report', () => {
  it('should include detailed broken-link lines in the assertion message', () => {
    const message = formatBrokenLinksReport([
      {
        url: 'https://example.test/missing',
        status: 404,
        parent: 'http://localhost:3000/about/',
      },
      {
        url: 'https://example.test/anchor',
        status: 'BROKEN_ANCHOR',
        parent: 'http://localhost:3000/',
      },
    ])

    assert.match(message, /Found 2 broken links\/anchors\./)
    assert.match(
      message,
      /- https:\/\/example\.test\/missing \(Status: 404\) found on http:\/\/localhost:3000\/about\//
    )
    assert.match(
      message,
      /- https:\/\/example\.test\/anchor \(Status: BROKEN_ANCHOR\) found on http:\/\/localhost:3000\//
    )
  })

  it('should return a short zero-count summary when no links are broken', () => {
    const message = formatBrokenLinksReport([])

    assert.strictEqual(message, 'Found 0 broken links/anchors.')
  })
})
