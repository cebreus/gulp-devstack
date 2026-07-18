import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { after, before, describe, it } from 'node:test'
import { chromium } from '@playwright/test'

import {
  capturePageScreenshot,
  compareScreenshots,
  startStaticServer,
  writeScreenshotDiff,
} from './helpers.js'

const BASELINE_CASES = [
  ['light', '404-desktop-light.png'],
  ['dark', '404-desktop-dark.png'],
]
const VIEWPORT = { width: 1280, height: 800 }
const MAX_DIFF_PIXEL_RATIO = 0.001

let browser = null
let buildServer = null

async function writeBaseline(baselinePath, screenshot) {
  await fs.mkdir(path.dirname(baselinePath), { recursive: true })
  await fs.writeFile(baselinePath, screenshot)
  console.log(`Updated visual baseline: ${baselinePath}`)
}

describe('Visual Baselines', { timeout: 60000 }, () => {
  before(async () => {
    const rootDir = process.cwd()
    await fs.access(path.join(rootDir, 'build-prod', '404.html'))
    browser = await chromium.launch()
    buildServer = await startStaticServer(path.join(rootDir, 'build-prod'))
  })

  after(async () => {
    await Promise.all([browser?.close(), buildServer?.close()])
  })

  for (const [theme, baselineName] of BASELINE_CASES) {
    it(`should match the 404 desktop ${theme} baseline`, async () => {
      const baselinePath = path.join(
        process.cwd(),
        'tests',
        'visual',
        'baselines',
        baselineName
      )
      const screenshot = await capturePageScreenshot(browser, {
        baseUrl: buildServer.baseUrl,
        routePath: '/404.html',
        viewport: VIEWPORT,
        theme,
      })

      let baseline = null
      try {
        baseline = await fs.readFile(baselinePath)
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error
        }
      }

      if (!baseline || process.env.UPDATE_VISUAL_BASELINES === '1') {
        await writeBaseline(baselinePath, screenshot)
        return
      }

      const diff = await compareScreenshots(baseline, screenshot)
      const diffPath = baselinePath.replace(/\.png$/, '-diff.png')

      if (diff.diffRatio > MAX_DIFF_PIXEL_RATIO) {
        await writeScreenshotDiff(baseline, screenshot, diffPath)
      }

      assert.ok(
        diff.diffRatio <= MAX_DIFF_PIXEL_RATIO,
        [
          `Visual mismatch for 404 desktop ${theme}.`,
          `Different pixels: ${diff.diffPixels}/${diff.totalPixels}.`,
          `Diff ratio: ${diff.diffRatio}.`,
          `Diff image: ${diffPath}.`,
        ].join(' ')
      )
    })
  }
})
