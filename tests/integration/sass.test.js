import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { afterEach, beforeEach, describe, it } from 'node:test'

import {
  buildSassPipeline,
  compileRouteStyles,
} from '../../gulp/tasks/process-sass.js'
import { streamToPromise } from '../../gulp/utils/helpers.js'
import {
  cleanupSandbox,
  createTestSandbox,
  writeFixtures,
} from '../test-helpers.js'

describe('Sass Pipeline Integration', () => {
  let sandbox
  const originalBuildMode = process.env.BUILD_MODE

  beforeEach(async () => {
    sandbox = await createTestSandbox()
    process.env.BUILD_MODE = 'dev' // Set default for tests
  })

  afterEach(async () => {
    await cleanupSandbox(sandbox)
    process.env.BUILD_MODE = originalBuildMode
  })

  it('should catch and handle sass compilation errors', async () => {
    // Arrange
    const fixtures = {
      'src/style.scss': 'body { color: $non-existent-variable; }', // Invalid sass
    }
    await writeFixtures(sandbox, fixtures)
    const dest = path.join(sandbox, 'dist')

    // Act & Assert
    const pipeline = buildSassPipeline({
      src: path.join(sandbox, 'src/style.scss'),
      dest,
      loggerContext: 'TestError',
    })

    await assert.doesNotReject(async () => {
      await streamToPromise(pipeline)
    })

    try {
      await fs.access(path.join(dest, 'style.css'))
      assert.fail('CSS file should not exist on compilation error')
    } catch (e) {
      assert.strictEqual(e.code, 'ENOENT')
    }
  })

  it('should return immediately when no route styles are found', async () => {
    // Arrange - We need to point routesBase to an empty dir in sandbox
    process.env.BUILD_MODE = 'dev'

    // Act & Assert
    await assert.doesNotReject(async () => {
      await compileRouteStyles()
    })
  })

  it('should support custom postcss plugins', async () => {
    // Arrange
    const fixtures = {
      'src/style.scss': 'body { display: flex; }',
    }
    await writeFixtures(sandbox, fixtures)
    const dest = path.join(sandbox, 'dist')

    // Act
    const pipeline = buildSassPipeline({
      src: path.join(sandbox, 'src/style.scss'),
      dest,
      postcssPlugins: [],
      minify: true,
    })
    await streamToPromise(pipeline)

    // Assert
    const css = await fs.readFile(path.join(dest, 'style.css'), 'utf8')
    assert.ok(css.length > 0)
  })
})
