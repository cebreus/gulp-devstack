import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { describe, it } from 'node:test'

import { processData } from '../../gulp/tasks/process-data.js'
import { runInSandbox, writeFixtures } from '../test-helpers.js'

describe('processData Integration', function testProcessData() {
  it('should transform homepage markdown fixture into JSON dataset and menu', async function testDataTransformation() {
    await runInSandbox(
      'process-data',
      async function executeDataProcessing(sandboxPath) {
        const testSrcDir = path.join(sandboxPath, 'src')
        const testOutputDir = path.join(sandboxPath, 'output')
        const sourceFilePath = path.join(testSrcDir, 'index.md')

        await writeFixtures(sandboxPath, {
          'src/index.md':
            '---\ntitle: Home\nlayout: layout-default.njk\nmenuMain:\n  order: 1\n---\n# Home Content',
        })

        const stream = processData(sourceFilePath, testOutputDir, {
          routesRoot: testSrcDir,
        })

        await new Promise(function waitForStreamCompletion(resolve, reject) {
          stream.on('end', resolve)
          stream.on('error', reject)
          stream.on('finish', resolve)
          stream.resume()
        })

        const indexJsonPath = path.join(testOutputDir, 'index.json')
        const menuJsonPath = path.join(testOutputDir, 'menu.json')

        const indexContent = await fs.readFile(indexJsonPath, 'utf8')
        const menuContent = await fs.readFile(menuJsonPath, 'utf8')

        const indexData = JSON.parse(indexContent)
        const menuData = JSON.parse(menuContent)

        assert.strictEqual(indexData.title, 'Home')
        assert.strictEqual(indexData.content, '# Home Content')
        assert.ok(Array.isArray(menuData.menu))
        assert.strictEqual(menuData.menu[0].name, 'Home')
      }
    )
  })
})
