import assert from 'node:assert/strict'
import { it } from 'node:test'

import { siteDefaults } from '../../src/config/site.js'

it('should require and normalize an HTTP(S) SITE_BASE_URL', () => {
  const previous = process.env.SITE_BASE_URL

  try {
    delete process.env.SITE_BASE_URL
    assert.throws(
      () => siteDefaults.baseUrl,
      /Missing required environment variable: SITE_BASE_URL/
    )

    process.env.SITE_BASE_URL = 'file:///tmp/site'
    assert.throws(() => siteDefaults.baseUrl, /Invalid URL in SITE_BASE_URL/)

    process.env.SITE_BASE_URL = 'https://example.test/path/?next=/#section/'
    assert.strictEqual(
      siteDefaults.baseUrl,
      'https://example.test/path?next=/#section/'
    )
  } finally {
    if (previous === undefined) delete process.env.SITE_BASE_URL
    else process.env.SITE_BASE_URL = previous
  }
})
