import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, it, mock } from 'node:test'

import { resolveConfig } from '../../gulp/config.js'
import debugBuild from '../../gulp/tasks/debug-build.js'
import { runInSandbox, silenceConsole } from '../test-helpers.js'

silenceConsole(beforeEach, afterEach, mock)

describe('Debug Task (Integration)', () => {
  let mockConsoleWarn
  let mockConsoleError

  beforeEach(() => {
    mockConsoleWarn = mock.method(console, 'warn', () => {})
    mockConsoleError = mock.method(console, 'error', () => {})
  })

  afterEach(() => {
    mockConsoleWarn.mock.restore()
    mockConsoleError.mock.restore()
  })

  it('should run diagnostic without crashing when files exist', async () => {
    await runInSandbox('debug-exists', async (sandbox) => {
      const routesDir = path.join(sandbox, 'src/routes')
      const buildDir = path.join(sandbox, 'build-dev')

      fs.mkdirSync(routesDir, { recursive: true })
      fs.mkdirSync(buildDir, { recursive: true })

      fs.writeFileSync(path.join(routesDir, 'index.njk'), '<html></html>')
      fs.writeFileSync(path.join(buildDir, 'index.html'), '<html></html>')

      await debugBuild(resolveConfig('dev'), {
        routesBaseOverride: routesDir,
        buildBaseOverride: buildDir,
      })

      // When index.html exists, debugBuild must not emit any console.error calls
      assert.strictEqual(
        mockConsoleError.mock.calls.length,
        0,
        'No errors should be emitted when all expected files exist'
      )
      // debugBuild only calls logger.warn on missing-path branches; the happy path
      // (routes dir exists, build dir exists, index.html present) has no warn-level calls.
      assert.strictEqual(
        mockConsoleWarn.mock.calls.length,
        0,
        'No warnings should be emitted when all expected files exist'
      )
    })
  })

  it('should fail when build directory is present but index.html is missing', async () => {
    await runInSandbox('debug-missing-index', async (sandbox) => {
      const routesDir = path.join(sandbox, 'src/routes')
      const buildDir = path.join(sandbox, 'build-dev')

      fs.mkdirSync(routesDir, { recursive: true })
      fs.mkdirSync(buildDir, { recursive: true })
      // routes dir has a file, but build has no index.html
      fs.writeFileSync(path.join(routesDir, 'index.njk'), '<html></html>')

      await assert.rejects(
        () =>
          debugBuild(resolveConfig('dev'), {
            routesBaseOverride: routesDir,
            buildBaseOverride: buildDir,
          }),
        (error) => {
          assert.ok(error.message.includes(path.join(buildDir, 'index.html')))
          return true
        }
      )
    })
  })

  it('should warn when source routes directory is missing', async () => {
    await runInSandbox('debug-missing-routes', async (sandbox) => {
      const routesDir = path.join(sandbox, 'nonexistent-routes')
      const buildDir = path.join(sandbox, 'build-dev')

      fs.mkdirSync(buildDir, { recursive: true })
      fs.writeFileSync(path.join(buildDir, 'index.html'), '<html></html>')

      await debugBuild(resolveConfig('dev'), {
        routesBaseOverride: routesDir,
        buildBaseOverride: buildDir,
      })

      // debugBuild calls logger.warn when routes base is missing
      assert.ok(
        mockConsoleWarn.mock.calls.some((call) =>
          call.arguments.some(
            (argument) =>
              typeof argument === 'string' && argument.includes(routesDir)
          )
        ),
        'Should identify the missing routes directory'
      )
    })
  })
})
