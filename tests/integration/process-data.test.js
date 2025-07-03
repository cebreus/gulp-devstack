import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { afterEach, beforeEach, describe, it } from 'node:test'

import { processData } from '../../gulp/tasks/process-data.js'
import { streamToPromise } from '../../gulp/utils/helpers.js'
import {
  cleanupSandbox,
  createTestSandbox,
  writeFixtures,
} from '../test-helpers.js'

describe('processData Integration', () => {
  let sandbox

  beforeEach(async () => {
    sandbox = await createTestSandbox()
  })

  afterEach(async () => {
    await cleanupSandbox(sandbox)
  })

  it('should transform homepage markdown fixture into JSON dataset and menu', async () => {
    // Arrange
    const routesRoot = path.join(sandbox, 'src/routes')
    const destDir = path.join(sandbox, 'temp/pages')

    const fixtures = {
      'src/routes/index.md':
        '---\ntitle: Home\nmenu_main:\n  order: 1\n---\n# Welcome',
    }

    await writeFixtures(sandbox, fixtures)

    // Act
    const stream = processData(path.join(routesRoot, '**/*.md'), destDir, {
      routesRoot,
    })
    await streamToPromise(stream)

    // Assert
    const indexJson = JSON.parse(
      await fs.readFile(path.join(destDir, 'index.json'), 'utf8')
    )
    const menuJson = JSON.parse(
      await fs.readFile(path.join(destDir, 'menu.json'), 'utf8')
    )

    assert.strictEqual(indexJson.title, 'Home')
    assert.strictEqual(indexJson.path, '/')
    assert.strictEqual(indexJson.page_id, 'home')

    assert.strictEqual(menuJson.menu.length, 1)
    assert.strictEqual(menuJson.menu[0].name, 'Home')
  })

  // Removed nested routes test as per request to focus only on homepage
})
