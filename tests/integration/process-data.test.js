import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { afterEach, beforeEach, describe, it, mock } from 'node:test'

import processData from '../../gulp/tasks/process-data.js'
import { runInSandbox, silenceConsole, writeFixtures } from '../test-helpers.js'

silenceConsole(beforeEach, afterEach, mock)

function waitForStream(stream) {
  return new Promise((resolve, reject) => {
    stream.on('end', resolve)
    stream.on('error', reject)
    stream.on('finish', resolve)
    stream.resume()
  })
}

describe('processData Integration', () => {
  it('should transform homepage markdown fixture into JSON dataset and menu', async () => {
    await runInSandbox('process-data', async (sandboxPath) => {
      const testSrcDir = path.join(sandboxPath, 'src')
      const testOutputDir = path.join(sandboxPath, 'output')
      const sourceFilePath = path.join(testSrcDir, 'index.md')

      await writeFixtures(sandboxPath, {
        'src/index.md':
          '---\ntitle: Home\nlayout: layout-default.njk\nhero:\n  badge: "Welcome to {{ page.title }}"\n  labels:\n    - "{{ page.title }}"\n    - Plain\nstartsAt: 2026-10-10T18:00:00.000Z\nmenuMain:\n  order: 1\n---\n# Home Content',
      })

      const stream = processData(sourceFilePath, testOutputDir, {
        routesRoot: testSrcDir,
      })

      await waitForStream(stream)

      const indexJsonPath = path.join(testOutputDir, 'index.json')
      const menuJsonPath = path.join(testOutputDir, 'menu.json')

      const indexContent = await fs.readFile(indexJsonPath, 'utf8')
      const menuContent = await fs.readFile(menuJsonPath, 'utf8')

      const indexData = JSON.parse(indexContent)
      const menuData = JSON.parse(menuContent)

      assert.strictEqual(indexData.title, 'Home')
      assert.strictEqual(indexData.hero.badge, 'Welcome to Home')
      assert.deepStrictEqual(indexData.hero.labels, ['Home', 'Plain'])
      assert.strictEqual(indexData.startsAt, '2026-10-10T18:00:00.000Z')
      assert.strictEqual(indexData.content, '# Home Content')
      assert.strictEqual(indexData.readingTime.words, 2)
      assert.strictEqual(indexData.readingTime.minutes, 1)
      assert.ok(Array.isArray(menuData.menu))
      assert.strictEqual(menuData.menu[0].name, 'Home')
    })
  })

  it('should reject malformed frontmatter expressions', async () => {
    await runInSandbox('process-data-expression-error', async (sandboxPath) => {
      const routesRoot = path.join(sandboxPath, 'src')
      const outputDir = path.join(sandboxPath, 'output')
      const sourceFilePath = path.join(routesRoot, 'index.md')

      await writeFixtures(sandboxPath, {
        'src/index.md':
          '---\ntitle: Broken\nbadge: "{% if true %}"\n---\nBroken body',
      })

      const errorLog = mock.method(console, 'error', () => {})
      try {
        await assert.rejects(
          waitForStream(processData(sourceFilePath, outputDir, { routesRoot })),
          /\[ProcessData\] Failed to render expression/u
        )
        assert.strictEqual(errorLog.mock.callCount(), 1)
      } finally {
        errorLog.mock.restore()
      }
    })
  })

  it('should exclude drafts from the menu', async () => {
    await runInSandbox('process-data-draft', async (sandboxPath) => {
      const routesRoot = path.join(sandboxPath, 'src')
      const outputDir = path.join(sandboxPath, 'output')

      await writeFixtures(sandboxPath, {
        'src/index.md':
          '---\ntitle: Draft\nisDraft: true\nmenuMain:\n  order: 1\n---\nDraft content',
      })

      await waitForStream(
        processData(path.join(routesRoot, 'index.md'), outputDir, {
          routesRoot,
        })
      )

      const menu = JSON.parse(
        await fs.readFile(path.join(outputDir, 'menu.json'))
      )
      assert.deepStrictEqual(menu.menu, [])
    })
  })
})
