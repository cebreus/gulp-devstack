import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { after, before, describe, it } from 'node:test'
import { chromium } from '@playwright/test'

import {
  capturePageScreenshot,
  compareScreenshots,
  startStaticServer,
} from './helpers.js'

const ROUTES = { home: '/', notFound: '/404.html' }
const THEMES = { light: 'light', dark: 'dark' }
const VIEWPORTS = [
  { name: 'xs', width: 390, height: 844 },
  { name: 'xl', width: 1200, height: 1000 },
]
const PARITY_CASES = [
  ['Home (Mobile Light)', ROUTES.home, THEMES.light, 'xs'],
  ['Home (Desktop Dark)', ROUTES.home, THEMES.dark, 'xl'],
  ['404 (Desktop Light)', ROUTES.notFound, THEMES.light, 'xl'],
]
const MAX_DIFF_PIXEL_RATIO = 0.001

let browser = null
let buildServer = null
let exportServer = null

function toSnapshotName(routePath) {
  if (routePath === '/') {
    return 'home'
  }

  return routePath
    .replace('.html', '')
    .replaceAll('/', '-')
    .replace(/^-|-$/g, '')
}

async function assertArtifactsExist() {
  const rootDir = process.cwd()
  await Promise.all([
    fs.access(path.join(rootDir, 'build-prod', 'index.html')),
    fs.access(path.join(rootDir, 'build-prod', '404.html')),
    fs.access(path.join(rootDir, 'build-export', 'index.html')),
    fs.access(path.join(rootDir, 'build-export', '404.html')),
  ])
}

describe('Visual Pipeline Parity', { timeout: 60000 }, () => {
  before(async () => {
    await assertArtifactsExist()
    browser = await chromium.launch()

    const rootDir = process.cwd()
    buildServer = await startStaticServer(path.join(rootDir, 'build-prod'))
    exportServer = await startStaticServer(path.join(rootDir, 'build-export'))
  })

  after(async () => {
    await Promise.all([
      browser?.close(),
      buildServer?.close(),
      exportServer?.close(),
    ])
  })

  async function assertVisualParity(routePath, theme, viewportName) {
    const viewport = VIEWPORTS.find((v) => {
      return v.name === viewportName
    })
    assert.ok(
      viewport,
      `Unknown viewport "${viewportName}". Available viewports: ${VIEWPORTS.map((v) => v.name).join(', ')}.`
    )

    const testName = `${toSnapshotName(routePath)} | ${theme} | ${viewport.name}`

    const [buildScreenshot, exportScreenshot] = await Promise.all([
      capturePageScreenshot(browser, {
        baseUrl: buildServer.baseUrl,
        routePath,
        viewport,
        theme,
      }),
      capturePageScreenshot(browser, {
        baseUrl: exportServer.baseUrl,
        routePath,
        viewport,
        theme,
      }),
    ])

    const diff = await compareScreenshots(buildScreenshot, exportScreenshot)

    assert.ok(
      diff.diffRatio <= MAX_DIFF_PIXEL_RATIO,
      [
        `Visual mismatch between build-prod and build-export for ${testName}.`,
        `Different pixels: ${diff.diffPixels}/${diff.totalPixels}.`,
        `Diff ratio: ${diff.diffRatio}.`,
      ].join(' ')
    )
  }

  for (const [name, routePath, theme, viewport] of PARITY_CASES) {
    it(`should keep build and export visually identical for ${name}`, async () => {
      await assertVisualParity(routePath, theme, viewport)
    })
  }
})
