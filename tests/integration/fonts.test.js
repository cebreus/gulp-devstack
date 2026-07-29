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
  it('should fail if input or outputDir are missing', async () => {
    await runInSandbox('fonts-arguments', async (sandbox) => {
      const input = path.join(sandbox, 'fonts.list')
      const output = path.join(sandbox, 'dist')
      fs.writeFileSync(input, 'Inter:400')

      await assert.rejects(
        () => processFonts(input, null),
        /input and outputDir/
      )
      await assert.rejects(
        () => processFonts(null, output),
        /input and outputDir/
      )
    })
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
      const cachedMtimeMs = fs.statSync(cssOutputPath).mtimeMs

      await processFonts(inputPath, outputDir)

      const cachedContent = fs.readFileSync(cssOutputPath, 'utf8')
      assert.strictEqual(cachedContent, '/* cached css */')
      assert.strictEqual(fs.statSync(cssOutputPath).mtimeMs, cachedMtimeMs)
    })
  })

  it('should resolve root-relative font URLs from the build root', async () => {
    await runInSandbox('fonts-root-url', async (sandbox) => {
      const inputPath = path.join(sandbox, 'fonts.list')
      const outputDir = path.join(sandbox, 'dist')
      const fontsOutputDir = path.join(outputDir, 'assets/fonts')
      const cssOutputPath = path.join(outputDir, 'assets/css/fonts.css')

      fs.mkdirSync(fontsOutputDir, { recursive: true })
      fs.mkdirSync(path.dirname(cssOutputPath), { recursive: true })
      fs.writeFileSync(
        cssOutputPath,
        '@font-face { src: url("/assets/fonts/inter.woff2"); }'
      )
      const fontOutputPath = path.join(fontsOutputDir, 'inter.woff2')
      fs.writeFileSync(fontOutputPath, 'binary')
      const outputMtime = new Date(Date.now() - 1000)
      fs.utimesSync(cssOutputPath, outputMtime, outputMtime)
      fs.utimesSync(fontOutputPath, outputMtime, outputMtime)
      fs.writeFileSync(inputPath, 'Inter:400')

      await assert.doesNotReject(() => processFonts(inputPath, outputDir))
    })
  })

  it('should reject relative font URLs outside the build root', async () => {
    await runInSandbox('fonts-relative-escape', async (sandbox) => {
      const inputPath = path.join(sandbox, 'fonts.list')
      const outputDir = path.join(sandbox, 'dist')
      const fontsOutputDir = path.join(outputDir, 'assets/fonts')
      const cssOutputPath = path.join(outputDir, 'assets/css/fonts.css')

      fs.mkdirSync(fontsOutputDir, { recursive: true })
      fs.mkdirSync(path.dirname(cssOutputPath), { recursive: true })
      fs.writeFileSync(path.join(fontsOutputDir, 'inter.woff2'), 'binary')
      fs.writeFileSync(path.join(sandbox, 'source.woff2'), 'source binary')
      fs.writeFileSync(
        cssOutputPath,
        '@font-face { src: url("../../../source.woff2"); }'
      )
      fs.writeFileSync(inputPath, 'Inter:400')

      await assert.rejects(() => processFonts(inputPath, outputDir))
    })
  })

  it('should reject root-relative font URLs outside the build root', async () => {
    await runInSandbox('fonts-root-escape', async (sandbox) => {
      const inputPath = path.join(sandbox, 'fonts.list')
      const outputDir = path.join(sandbox, 'dist')
      const fontsOutputDir = path.join(outputDir, 'assets/fonts')
      const cssOutputPath = path.join(outputDir, 'assets/css/fonts.css')

      fs.mkdirSync(fontsOutputDir, { recursive: true })
      fs.mkdirSync(path.dirname(cssOutputPath), { recursive: true })
      fs.writeFileSync(path.join(fontsOutputDir, 'inter.woff2'), 'binary')
      fs.writeFileSync(path.join(sandbox, 'source.woff2'), 'source binary')
      fs.writeFileSync(
        cssOutputPath,
        '@font-face { src: url("/../source.woff2"); }'
      )
      fs.writeFileSync(inputPath, 'Inter:400')

      await assert.rejects(() => processFonts(inputPath, outputDir))
    })
  })

  it('should reject font URLs that resolve to directories', async () => {
    await runInSandbox('fonts-directory-url', async (sandbox) => {
      const inputPath = path.join(sandbox, 'fonts.list')
      const outputDir = path.join(sandbox, 'dist')
      const fontsOutputDir = path.join(outputDir, 'assets/fonts')
      const cssOutputPath = path.join(outputDir, 'assets/css/fonts.css')

      fs.mkdirSync(fontsOutputDir, { recursive: true })
      fs.mkdirSync(path.dirname(cssOutputPath), { recursive: true })
      fs.writeFileSync(path.join(fontsOutputDir, 'inter.woff2'), 'binary')
      fs.writeFileSync(cssOutputPath, '@font-face { src: url("../fonts"); }')
      fs.writeFileSync(inputPath, 'Inter:400')

      await assert.rejects(() => processFonts(inputPath, outputDir))
    })
  })
})
