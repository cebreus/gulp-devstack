import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { afterEach, beforeEach, describe, it, mock } from 'node:test'

import lintTemplates from '../../gulp/tasks/lint-templates.js'
import { runInSandbox } from '../test-helpers.js'

const originalCwd = process.cwd()

describe('Lint Templates Task', { concurrency: false }, () => {
  afterEach(() => {
    process.chdir(originalCwd)
  })

  describe('lintTemplates', () => {
    it('should log verbose message when no templates found', async () => {
      await runInSandbox('lint', async (sandbox) => {
        process.chdir(sandbox)

        process.env.VERBOSE = 'true'
        const mockLog = mock.method(console, 'log', () => {})

        try {
          await lintTemplates()

          assert.ok(
            mockLog.mock.calls.length > 0,
            'Should have called console.log'
          )
          const loggedArgs = mockLog.mock.calls[0].arguments
          assert.ok(
            loggedArgs.some(
              (arg) =>
                typeof arg === 'string' &&
                arg.includes('No templates found to lint')
            )
          )
        } finally {
          process.chdir(originalCwd)
          mockLog.mock.restore()
          delete process.env.VERBOSE
        }
      })
    })

    it('should not throw error to prevent Gulp watch from crashing', async () => {
      // The key behavior is that it catches errors and doesn't throw
      await assert.doesNotReject(async () => {
        await lintTemplates()
      })
    })
  })
})
