import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { afterEach, beforeEach, describe, it, mock } from 'node:test'

import processData from '../../gulp/tasks/process-data.js'
import { runInSandbox, silenceConsole, writeFixtures } from '../test-helpers.js'

silenceConsole(beforeEach, afterEach, mock)

describe('processData Integration', () => {
  it('should transform homepage markdown fixture into JSON dataset and menu', async () => {
    await runInSandbox('process-data', async (sandboxPath) => {
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

      await new Promise((resolve, reject) => {
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
      assert.strictEqual(indexData.readingTime.words, 2)
      assert.strictEqual(indexData.readingTime.minutes, 1)
      assert.ok(Array.isArray(menuData.menu))
      assert.strictEqual(menuData.menu[0].name, 'Home')
    })
  })
})
