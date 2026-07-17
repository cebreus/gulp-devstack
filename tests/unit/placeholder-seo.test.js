import assert from 'node:assert/strict'
import { Transform } from 'node:stream'
import { describe, it } from 'node:test'

import { createPlaceholderSeoWarningTransform } from '../../gulp/tasks/process-html.js'

function createFakeFile(html) {
  return {
    path: '/project/build-prod/index.html',
    contents: Buffer.from(html),
    isBuffer: () => true,
  }
}

function runTransform(file) {
  return new Promise((resolve, reject) => {
    const stream = createPlaceholderSeoWarningTransform(Transform)
    stream.on('data', resolve)
    stream.on('error', reject)
    stream.end(file)
  })
}

describe('createPlaceholderSeoWarningTransform', () => {
  it('rejects the stream when a placeholder SEO value is present', async () => {
    const file = createFakeFile('<title>New Project SEO Title</title>')
    await assert.rejects(runTransform(file), /Placeholder SEO value/)
  })

  it('passes clean files through unchanged', async () => {
    const file = createFakeFile('<title>Real Project</title>')
    const result = await runTransform(file)
    assert.strictEqual(result, file)
  })

  it('does not crash on non-buffer files', async () => {
    const file = { path: 'x', isBuffer: () => false }
    const result = await runTransform(file)
    assert.strictEqual(result, file)
  })
})
