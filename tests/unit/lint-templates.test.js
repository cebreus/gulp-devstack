import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { afterEach, beforeEach, describe, it, mock } from 'node:test'

import lintTemplates from '../../gulp/tasks/lint-templates.js'
import { runInSandbox, writeFixtures } from '../test-helpers.js'

const originalCwd = process.cwd()

describe('Lint Templates Task', { concurrency: false }, () => {
  afterEach(() => {
    process.chdir(originalCwd)
  })

  describe('lintTemplates', () => {
    it('should log verbose message when no templates found', async () => {
      await runInSandbox('lint', async (sandbox) => {
        process.chdir(sandbox)

        const originalVerbose = process.env.VERBOSE
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
          if (originalVerbose === undefined) {
            delete process.env.VERBOSE
          } else {
            process.env.VERBOSE = originalVerbose
          }
        }
      })
    })

    it('should not throw error to prevent Gulp watch from crashing', async () => {
      await runInSandbox('lint-invalid', async (sandbox) => {
        await writeFixtures(sandbox, {
          'src/broken.njk': '{% if condition %}',
        })
        const originalBuildMode = process.env.BUILD_MODE
        const mockError = mock.method(console, 'error', () => {})
        process.env.BUILD_MODE = 'dev'
        process.chdir(sandbox)

        try {
          await assert.doesNotReject(() => lintTemplates())
          assert.ok(mockError.mock.calls.length > 0)
        } finally {
          process.chdir(originalCwd)
          mockError.mock.restore()
          if (originalBuildMode === undefined) {
            delete process.env.BUILD_MODE
          } else {
            process.env.BUILD_MODE = originalBuildMode
          }
        }
      })
    })
  })
})
