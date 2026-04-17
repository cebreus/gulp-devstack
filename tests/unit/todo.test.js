import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { isReportEmpty } from '../../gulp/tasks/generate-todo.js'

describe('TODO Task (Unit)', function todoTaskTestSuite() {
  describe('isReportEmpty()', function isReportEmptyTestSuite() {
    const reportHeader = [
      '### Project TODO Inventory',
      '| Filename | Line | Task Description |',
      '|:---------|:----:|:-----------------|',
    ].join('\n')

    it('should return true for a basic header without content', function testEmptyHeader() {
      assert.strictEqual(isReportEmpty(reportHeader), true)
    })

    it('should return false if there are data rows', function testWithContent() {
      const reportWithContent = reportHeader + '\n| file.js | 10 | Fix this |'
      assert.strictEqual(isReportEmpty(reportWithContent), false)
    })

    it('should return false for unrelated text', function testUnrelatedText() {
      assert.strictEqual(isReportEmpty('Not a TODO report at all'), false)
    })
  })
})
