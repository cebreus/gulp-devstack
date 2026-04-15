import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, it } from 'node:test'

import { isReportEmpty } from '../../gulp/tasks/generate-todo.js'
import { cleanupSandbox, createTestSandbox } from '../test-helpers.js'

describe('TODO Task (Unit)', () => {
  let sandbox

  beforeEach(async () => {
    sandbox = await createTestSandbox()
  })

  afterEach(async () => {
    await cleanupSandbox(sandbox)
  })

  describe('isReportEmpty()', () => {
    const header = [
      '### Project TODO Inventory',
      '| Filename | Line | Task Description |',
      '|:---------|:----:|:-----------------|',
    ].join('\n')

    it('should return true for a basic header without content', () => {
      assert.strictEqual(isReportEmpty(header), true)
    })

    it('should return false if there are data rows', () => {
      const withContent = header + '\n| file.js | 10 | Fix this |'
      assert.strictEqual(isReportEmpty(withContent), false)
    })

    it('should return false for unrelated text', () => {
      assert.strictEqual(isReportEmpty('Not a TODO report at all'), false)
    })
  })
})
