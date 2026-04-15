import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, it } from 'node:test'

import { debugBuild } from '../../gulp/tasks/debug-build.js'
import { cleanupSandbox, createTestSandbox } from '../test-helpers.js'

describe('Debug Task (Unit)', () => {
  let sandbox

  beforeEach(async () => {
    sandbox = await createTestSandbox()
  })

  afterEach(async () => {
    await cleanupSandbox(sandbox)
  })

  it('should run diagnostic without crashing when files exist', async () => {
    const routesDir = path.join(sandbox, 'src/routes')
    const buildDir = path.join(sandbox, 'build-dev')

    fs.mkdirSync(routesDir, { recursive: true })
    fs.mkdirSync(buildDir, { recursive: true })

    fs.writeFileSync(path.join(routesDir, 'index.njk'), '<html></html>')
    fs.writeFileSync(path.join(buildDir, 'index.html'), '<html></html>')

    await assert.doesNotReject(async () => {
      await debugBuild({
        routesBaseOverride: routesDir,
        buildBaseOverride: () => buildDir,
      })
    })
  })

  it('should handle missing files gracefully', async () => {
    const routesDir = path.join(sandbox, 'empty-routes')
    const buildDir = path.join(sandbox, 'empty-build')

    fs.mkdirSync(routesDir, { recursive: true })
    fs.mkdirSync(buildDir, { recursive: true })

    // No files created

    await assert.doesNotReject(async () => {
      await debugBuild({
        routesBaseOverride: routesDir,
        buildBaseOverride: () => buildDir,
      })
    })
  })
})
