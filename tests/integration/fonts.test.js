import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, it, mock } from 'node:test'

import processFonts from '../../gulp/tasks/process-fonts.js'
import { runInSandbox, silenceConsole } from '../test-helpers.js'

silenceConsole(beforeEach, afterEach, mock)

describe('Fonts Task (Integration)', () => {
  let mockConsoleWarn

  beforeEach(() => {
    mockConsoleWarn = mock.method(console, 'warn', () => {})
  })

  afterEach(() => {
    mockConsoleWarn.mock.restore()
  })
  it('should skip processing if input or outputDir are missing', async () => {
    await assert.doesNotReject(async () => {
      await processFonts(null, null)
    })
    // Guard-clause path: warn must have been emitted and no output directory created
    assert.ok(
      mockConsoleWarn.mock.calls.length > 0,
      'processFonts should emit a warn when called with null parameters'
    )
  })

  it('should skip processing if font definition file is empty', async () => {
    await runInSandbox('fonts-empty', async (sandbox) => {
      const input = path.join(sandbox, 'empty.list')
      const output = path.join(sandbox, 'dist-empty')
      fs.writeFileSync(input, '')

      await processFonts(input, output)

      assert.strictEqual(fs.existsSync(output), false)
    })
  })

  it('should identify when fonts are up to date and skip', async () => {
    await runInSandbox('fonts-cached', async (sandbox) => {
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
    })
  })
})
