import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { after, before, describe, it } from 'node:test'
import { chromium } from '@playwright/test'

import { compareScreenshots, startStaticServer } from './helpers.js'

const ROUTES = ['/', '/about/', '/404.html']
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

/**
 * @param {string} routePath
 * @returns {string}
 */
function toSnapshotName(routePath) {
  if (routePath === '/') {
    return 'home'
  }

  return routePath
    .replace('.html', '')
    .replaceAll('/', '-')
    .replace(/^-|-$/g, '')
}

/**
 * @returns {Promise<void>}
 */
async function assertArtifactsExist() {
  const rootDir = process.cwd()
  await Promise.all([
    fs.access(path.join(rootDir, 'build-prod', 'index.html')),
    fs.access(path.join(rootDir, 'build-export', 'index.html')),
  ])
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {'light'|'dark'} theme
 * @returns {Promise<void>}
 */
async function applyTheme(page, theme) {
  await page.emulateMedia({ colorScheme: theme })
  await page.evaluate(function setTheme(nextTheme) {
    document.documentElement.dataset.bsTheme = nextTheme
    if (document.body) {
      document.body.dataset.bsTheme = nextTheme
    }
  }, theme)
  await page.waitForTimeout(DEFAULT_WAIT_AFTER_THEME_MS)
}

/**
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<void>}
 */
async function stabilizePage(page) {
  await page.waitForLoadState('networkidle')
  await page.evaluate(async function waitForFonts() {
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

/**
 * @param {string} baseUrl
 * @param {string} routePath
 * @param {{ width: number, height: number }} viewport
 * @param {'light'|'dark'} theme
 * @returns {Promise<Buffer>}
 */
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

describe('Visual Pipeline Parity', function visualParitySuite() {
  before(async function prepareVisualParitySuite() {
    await assertArtifactsExist()
    browser = await chromium.launch()

    const rootDir = process.cwd()
    ;[buildServer, exportServer] = await Promise.all([
      startStaticServer(path.join(rootDir, 'build-prod')),
      startStaticServer(path.join(rootDir, 'build-export')),
    ])
  })

  after(async function cleanupVisualParitySuite() {
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

  for (const routePath of ROUTES) {
    for (const theme of THEMES) {
      for (const viewport of VIEWPORTS) {
        const routeName = toSnapshotName(routePath)
        const testName = [
          routeName,
          theme,
          `${viewport.name}-${viewport.width}x${viewport.height}`,
        ].join(' | ')

        it(`should keep build and export visually identical for ${testName}`, async function verifyVisualParity() {
          const [buildScreenshot, exportScreenshot] = await Promise.all([
            capturePageScreenshot(
              buildServer.baseUrl,
              routePath,
              viewport,
              theme
            ),
            capturePageScreenshot(
              exportServer.baseUrl,
              routePath,
              viewport,
              theme
            ),
          ])

          const diff = await compareScreenshots(
            buildScreenshot,
            exportScreenshot
          )

          assert.ok(
            diff.diffRatio <= MAX_DIFF_PIXEL_RATIO,
            [
              `Visual mismatch between build-prod and build-export for ${testName}.`,
              `Different pixels: ${diff.diffPixels}/${diff.totalPixels}.`,
              `Diff ratio: ${diff.diffRatio}.`,
            ].join(' ')
          )
        })
      }
    }
  }
})
