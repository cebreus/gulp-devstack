import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'

import serveSite, { buildErrorMiddleware } from '../../gulp/tasks/serve-site.js'

afterEach(() => {
  serveSite.ready()
})

describe('Serve Site build errors', () => {
  it('should serve an escaped 503 page instead of stale HTML', () => {
    serveSite.fail(new Error('Invalid <date>'))
    let nextCalled = false
    const response = {
      body: '',
      end(body) {
        this.body = body
      },
      writeHead(statusCode, headers) {
        this.headers = headers
        this.statusCode = statusCode
      },
    }

    buildErrorMiddleware(
      { headers: { accept: 'text/html' }, method: 'GET', url: '/' },
      response,
      () => {
        nextCalled = true
      }
    )

    assert.strictEqual(response.statusCode, 503)
    assert.match(response.body, /Build failed/)
    assert.match(response.body, /Invalid &lt;date&gt;/)
    assert.strictEqual(nextCalled, false)

    serveSite.ready()
    buildErrorMiddleware(
      { headers: { accept: 'text/html' }, method: 'GET', url: '/' },
      response,
      () => {
        nextCalled = true
      }
    )
    assert.strictEqual(nextCalled, true)
  })
})
