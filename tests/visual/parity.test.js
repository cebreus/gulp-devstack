import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { after, before, describe, it } from 'node:test'
import { chromium } from '@playwright/test'

import { compareScreenshots, startStaticServer } from './helpers.js'

const ROUTES = ['/', '/404.html']
const THEMES = ['light', 'dark']
const VIEWPORTS = [
  { name: 'xs', width: 390, height: 844 },
  { name: 'sm', width: 576, height: 900 },
  { name: 'md', width: 768, height: 1024 },
  { name: 'lg', width: 992, height: 1000 },
  { name: 'xl', width: 1200, height: 1000 },
  { name: 'xxl', width: 1400, height: 1000 },
]
const MAX_DIFF_PIXEL_RATIO = 0
const DEFAULT_WAIT_AFTER_THEME_MS = 150

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
    fs.access(path.join(rootDir, 'build-export', 'index.html')),
  ])
}

async function applyTheme(page, theme) {
  await page.emulateMedia({ colorScheme: theme })
  await page.evaluate((nextTheme) => {
    document.documentElement.dataset.bsTheme = nextTheme
    if (document.body) {
      document.body.dataset.bsTheme = nextTheme
    }
  }, theme)
  await page.waitForTimeout(DEFAULT_WAIT_AFTER_THEME_MS)
}

async function stabilizePage(page) {
  await page.waitForLoadState('networkidle')
  await page.evaluate(async () => {
    await document.fonts.ready
  })
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
        caret-color: transparent !important;
      }
      html {
        scrollbar-width: none !important;
        -webkit-font-smoothing: antialiased !important;
        -moz-osx-font-smoothing: grayscale !important;
      }
      ::-webkit-scrollbar {
        display: none !important;
      }
    `,
  })
}

async function capturePageScreenshot(baseUrl, routePath, viewport, theme) {
  const context = await browser.newContext({
    viewport: {
      width: viewport.width,
      height: viewport.height,
    },
    deviceScaleFactor: 1,
  })

  try {
    const page = await context.newPage()
    await page.goto(`${baseUrl}${routePath}`)
    await stabilizePage(page)
    await applyTheme(page, theme)
    return await page.screenshot({ fullPage: true })
  } finally {
    await context.close()
  }
}

describe('Visual Pipeline Parity', { timeout: 60000 }, () => {
  before(async () => {
    await assertArtifactsExist()
    browser = await chromium.launch()

    const rootDir = process.cwd()
    ;[buildServer, exportServer] = await Promise.all([
      startStaticServer(path.join(rootDir, 'build-prod')),
      startStaticServer(path.join(rootDir, 'build-export')),
    ])
  })

  after(async () => {
    if (browser) {
      await browser.close()
    }

    if (buildServer) {
      await buildServer.close()
    }

    if (exportServer) {
      await exportServer.close()
    }
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
      capturePageScreenshot(buildServer.baseUrl, routePath, viewport, theme),
      capturePageScreenshot(exportServer.baseUrl, routePath, viewport, theme),
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

  it('should keep build and export visually identical for Home (Mobile Light)', async () => {
    await assertVisualParity('/', 'light', 'xs')
  })

  it('should keep build and export visually identical for Home (Desktop Dark)', async () => {
    await assertVisualParity('/', 'dark', 'xl')
  })

  it('should keep build and export visually identical for 404 (Desktop Light)', async () => {
    await assertVisualParity('/404.html', 'light', 'xl')
  })
})
