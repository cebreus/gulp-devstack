import assert from 'node:assert/strict'
import path from 'node:path'
import { afterEach, beforeEach, describe, it, mock } from 'node:test'

import validateHtml from '../../gulp/tasks/validate-html.js'
import { runInSandbox, writeFixtures } from '../test-helpers.js'

describe('Validate HTML Task', () => {
  let mockConsoleError
  let mockConsoleWarn
  let mockConsoleLog

  beforeEach(() => {
    mockConsoleError = mock.method(console, 'error', () => {})
    mockConsoleWarn = mock.method(console, 'warn', () => {})
    mockConsoleLog = mock.method(console, 'log', () => {})
  })

  afterEach(() => {
    mockConsoleError.mock.restore()
    mockConsoleWarn.mock.restore()
    mockConsoleLog.mock.restore()
  })

  describe('validateHtml', () => {
    it('should return a Transform stream', () => {
      const stream = validateHtml('src/**/*.html')
      assert.ok(
        stream.constructor.name === 'Transform',
        'Should return a Transform stream'
      )
    })

    it('should filter out private files and process public files', async () => {
      await runInSandbox('validate-html', async (sandboxPath) => {
        await writeFixtures(sandboxPath, {
          'src/public.html':
            '<!DOCTYPE html><html lang="en"><head><title>Test</title></head><body><h1>Public</h1></body></html>',
          'src/_private.html':
            '<!DOCTYPE html><html lang="en"><head><title>Test</title></head><body><h1>Private</h1></body></html>',
        })

        const globPath = path.join(sandboxPath, 'src/**/*.html')
        const stream = validateHtml(globPath)
        const processedFiles = []

        stream.on('data', (file) => {
          processedFiles.push(path.basename(file.path))
        })

        await new Promise((resolve, reject) => {
          stream.on('finish', resolve)
          stream.on('error', reject)
        })

        assert.strictEqual(
          processedFiles.length,
          1,
          'Should only process one file'
        )
        assert.strictEqual(
          processedFiles[0],
          'public.html',
          'Should process public.html and filter out _private.html'
        )
      })
    })

    it('should reject stream when HTML contains validation errors', async () => {
      await runInSandbox('validate-html-error', async (sandboxPath) => {
        // <center> is deprecated and triggers an error in recommended rules
        await writeFixtures(sandboxPath, {
          'src/invalid.html':
            '<!DOCTYPE html><html lang="en"><head><title>Test</title></head><body><center>Invalid</center></body></html>',
        })

        const globPath = path.join(sandboxPath, 'src/**/*.html')
        const stream = validateHtml(globPath)

        await assert.rejects(
          () =>
            new Promise((resolve, reject) => {
              stream.on('finish', resolve)
              stream.on('error', reject)
            }),
          /HTML validation finished: \d+ errors/
        )

        assert.ok(
          mockConsoleError.mock.calls.length > 0,
          'Expected validation errors to be intercepted by the test console mock'
        )
        assert.strictEqual(mockConsoleWarn.mock.calls.length, 0)
        assert.strictEqual(mockConsoleLog.mock.calls.length, 0)
      })
    })

    it('should ignore empty directories (null files)', async () => {
      await runInSandbox('validate-html-null', async (sandboxPath) => {
        // Write just a directory, src() without allowEmpty will skip it or read it as null if dot/allowEmpty
        await writeFixtures(sandboxPath, {
          'src/empty_dir/.keep': '',
        })

        // By targeting the directory itself with allowEmpty: true, or just letting src() read it.
        // Actually, validateHtml uses `src(input)` with default options.
        // It's easier to verify it doesn't crash on an empty directory match.
        const globPath = path.join(sandboxPath, 'src/empty_dir')
        const stream = validateHtml(globPath)

        await new Promise((resolve, reject) => {
          stream.on('finish', resolve)
          stream.on('error', reject)
        })
      })
    })
  })
})
