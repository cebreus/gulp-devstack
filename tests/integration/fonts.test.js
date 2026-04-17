import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { describe, it } from 'node:test'

import { processFonts } from '../../gulp/tasks/process-fonts.js'
import { runInSandbox } from '../test-helpers.js'

describe('Fonts Task (Unit/Integration)', function testFontsTask() {
  it('should skip processing if input or outputDir are missing', async function testMissingPaths() {
    await assert.doesNotReject(async function executeProcessFonts() {
      await processFonts(null, null)
    })
  })

  it('should skip processing if font definition file is empty', async function testEmptyFontList() {
    await runInSandbox(
      'fonts-empty',
      async function executeEmptyFontsTest(sandbox) {
        const input = path.join(sandbox, 'empty.list')
        const output = path.join(sandbox, 'dist-empty')
        fs.writeFileSync(input, '')

        await processFonts(input, output)

        assert.strictEqual(fs.existsSync(output), false)
      }
    )
  })

  it('should identify when fonts are up to date and skip', async function testFontsCaching() {
    await runInSandbox(
      'fonts-cached',
      async function executeFontsCachingTest(sandbox) {
        const inputPath = path.join(sandbox, 'fonts-up-to-date.list')
        const outputDir = path.join(sandbox, 'dist-cached')
        const fontsOutputDir = path.join(outputDir, 'assets/fonts')
        const cssOutputPath = path.join(outputDir, 'assets/css/fonts.css')

        fs.mkdirSync(fontsOutputDir, { recursive: true })
        fs.mkdirSync(path.dirname(cssOutputPath), { recursive: true })

        fs.writeFileSync(inputPath, 'Inter:400')
        fs.writeFileSync(cssOutputPath, '/* cached css */')
        fs.writeFileSync(path.join(fontsOutputDir, 'inter.woff2'), 'binary')

        const now = new Date()
        const past = new Date(now.getTime() - 10000)
        fs.utimesSync(inputPath, past, past)
        fs.utimesSync(cssOutputPath, now, now)

        await processFonts(inputPath, outputDir)

        const cachedContent = fs.readFileSync(cssOutputPath, 'utf8')
        assert.strictEqual(cachedContent, '/* cached css */')
      }
    )
  })
})
