import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { describe, it } from 'node:test'

import { resolveConfig } from '../../gulp/config.js'
import { debugBuild } from '../../gulp/tasks/debug-build.js'
import { runInSandbox } from '../test-helpers.js'

describe('Debug Task (Unit)', function testDebugTask() {
  it('should run diagnostic without crashing when files exist', async function testDebugWithFiles() {
    await runInSandbox(
      'debug-exists',
      async function executeDebugExistsTest(sandbox) {
        const routesDir = path.join(sandbox, 'src/routes')
        const buildDir = path.join(sandbox, 'build-dev')

        fs.mkdirSync(routesDir, { recursive: true })
        fs.mkdirSync(buildDir, { recursive: true })

        fs.writeFileSync(path.join(routesDir, 'index.njk'), '<html></html>')
        fs.writeFileSync(path.join(buildDir, 'index.html'), '<html></html>')

        await assert.doesNotReject(async function runDebugDiagnostic() {
          await debugBuild(resolveConfig('dev'), {
            routesBaseOverride: routesDir,
            buildBaseOverride: buildDir,
          })
        })
      }
    )
  })

  it('should handle missing files gracefully', async function testDebugMissingFiles() {
    await runInSandbox(
      'debug-missing',
      async function executeDebugMissingTest(sandbox) {
        const routesDir = path.join(sandbox, 'empty-routes')
        const buildDir = path.join(sandbox, 'empty-build')

        fs.mkdirSync(routesDir, { recursive: true })
        fs.mkdirSync(buildDir, { recursive: true })

        await assert.doesNotReject(async function runDebugDiagnosticEmpty() {
          await debugBuild(resolveConfig('dev'), {
            routesBaseOverride: routesDir,
            buildBaseOverride: buildDir,
          })
        })
      }
    )
  })
})
