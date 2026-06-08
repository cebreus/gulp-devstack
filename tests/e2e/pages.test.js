import assert from 'node:assert/strict'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { after, afterEach, before, beforeEach, describe, it } from 'node:test'
import AxeBuilder from '@axe-core/playwright'
import { chromium } from '@playwright/test'
import bs from 'browser-sync'
import { LinkChecker } from 'linkinator'

import { resolveConfig } from '../../gulp/config.js'
import { isCriticalPageAsset } from './page-asset-filter.js'
import { formatBrokenLinksReport } from './page-link-report.js'

let BASE_URL = process.env.E2E_BASE_URL
  ? process.env.E2E_BASE_URL.replace(/\/$/, '')
  : null

let localServer = null

let browser = null

let context = null
let clientErrors = []

const isShowcase = fs.existsSync(path.resolve('src/routes/about/index.md'))
const MIN_TEXT_CONTRAST_RATIO = 4.5

function toRgbChannels(color) {
  const match = color.match(/rgba?\(([^)]+)\)/)
  if (!match) {
    throw new Error(`Unsupported color format: ${color}`)
  }

  return match[1].split(',').map((value) => {
    return Number(value.trim())
  })
}

function compositeForeground(foreground, background) {
  const [red, green, blue, alpha = 1] = toRgbChannels(foreground)
  if (alpha >= 1) {
    return foreground
  }

  const [backgroundRed, backgroundGreen, backgroundBlue] =
    toRgbChannels(background)

  return `rgb(${[
    red * alpha + backgroundRed * (1 - alpha),
    green * alpha + backgroundGreen * (1 - alpha),
    blue * alpha + backgroundBlue * (1 - alpha),
  ].join(',')})`
}

function toLinearChannel(value) {
  const channel = value / 255
  if (channel <= 0.03928) {
    return channel / 12.92
  }
  return ((channel + 0.055) / 1.055) ** 2.4
}

function getRelativeLuminance(color) {
  const [red, green, blue] = toRgbChannels(color).map(toLinearChannel)
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

function getContrastRatio(foreground, background) {
  const compositedForeground = compositeForeground(foreground, background)
  const foregroundLuminance = getRelativeLuminance(compositedForeground)
  const backgroundLuminance = getRelativeLuminance(background)
  const lighter = Math.max(foregroundLuminance, backgroundLuminance)
  const darker = Math.min(foregroundLuminance, backgroundLuminance)

  return (lighter + 0.05) / (darker + 0.05)
}

// E2E Hooks (apply to all tests in this file)
before(async () => {
  browser = await chromium.launch()
  context = await browser.newContext()

  if (!BASE_URL) {
    const mode = process.env.BUILD_MODE || 'build'
    const config = resolveConfig(mode)
    const buildDir = path.resolve(config.paths.build)

    if (!fs.existsSync(buildDir)) {
      console.log(
        `[E2E] ${mode} build not found in ${buildDir}. Running JIT build...`
      )
      const buildScript = mode === 'export' ? 'export' : 'build'
      execSync(`pnpm run ${buildScript}`, {
        stdio: 'inherit',
        env: { ...process.env, BUILD_MODE: mode },
      })
    }

    console.log(`[E2E] Starting test server for ${mode} artifacts...`)
    localServer = bs.create()
    await new Promise((resolve, reject) => {
      localServer.init(
        {
          server: {
            baseDir: buildDir,
            serveStaticOptions: { extensions: ['html'] },
          },
          port: 3000,
          open: false,
          notify: false,
          ui: false,
          logLevel: 'silent',
        },
        (err, bsInstance) => {
          if (err) {
            return reject(err)
          }
          BASE_URL = `http://localhost:${bsInstance.options.get('port')}`
          resolve()
        }
      )
    })
  }

  context.on('page', (page) => {
    page.on('pageerror', (error) => {
      clientErrors.push(`[PageError] ${error.message}`)
    })
    page.on('console', (msg) => {
      if (
        msg.type() === 'error' &&
        !msg.text().includes('Failed to load resource')
      ) {
        clientErrors.push(`[ConsoleError] ${msg.text()}`)
      }
    })
  })
})

beforeEach(() => {
  clientErrors = []
})

afterEach(() => {
  assert.strictEqual(
    clientErrors.length,
    0,
    `Unexpected client errors found: ${clientErrors.join(', ')}`
  )
})

after(async () => {
  if (browser) {
    await browser.close()
  }
  if (localServer) {
    localServer.exit()
  }
})

describe('E2E: Baseline Integrity (Universal)', { timeout: 120000 }, () => {
  it('should serve the homepage with HTTP 200', async () => {
    const page = await context.newPage()
    const res = await page.goto(`${BASE_URL}/`)
    assert.strictEqual(res.status(), 200)
    await page.close()
  })

  it('should pass WCAG accessibility audit', async () => {
    const page = await context.newPage()
    await page.goto(`${BASE_URL}/`)

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'best-practice'])
      .analyze()

    assert.strictEqual(
      results.violations.length,
      0,
      `Accessibility violations found: ${JSON.stringify(results.violations, null, 2)}`
    )
    await page.close()
  })

  it('should have a valid title', async () => {
    const page = await context.newPage()

    await page.goto(`${BASE_URL}/`)
    const title = await page.title()

    assert.ok(title.length > 0, 'Title is empty')
    await page.close()
  })

  it('should load CSS and JS without 404s', async () => {
    const page = await context.newPage()
    const failedRequests = []

    page.on('requestfailed', (req) => {
      if (isCriticalPageAsset(req.url())) {
        failedRequests.push(`${req.url()}: ${req.failure().errorText}`)
      }
    })

    page.on('response', (res) => {
      if (res.status() >= 400 && isCriticalPageAsset(res.url())) {
        failedRequests.push(`${res.url()}: HTTP ${res.status()}`)
      }
    })

    await page.goto(`${BASE_URL}/`)
    await page.waitForLoadState('networkidle')

    assert.strictEqual(
      failedRequests.length,
      0,
      `Resource loading failures: ${failedRequests.join(', ')}`
    )

    await page.close()
  })
})

if (isShowcase) {
  describe('E2E: Showcase Mode Features', { timeout: 120000 }, () => {
    it('should render a functional navigation menu', async () => {
      const page = await context.newPage()
      await page.goto(`${BASE_URL}/`)

      const nav = page.locator('nav.o-header')
      await nav.waitFor()

      const aboutLink = nav.locator('a[href="/about/"]')
      assert.strictEqual(await aboutLink.count(), 1, 'About link not found')

      await page.close()
    })

    it('should render hero buttons and bento grid', async () => {
      const page = await context.newPage()
      await page.goto(`${BASE_URL}/`)

      assert.ok(
        await page.locator('.c-hero .btn-primary').isVisible(),
        'Hero button missing'
      )
      assert.ok(
        await page.locator('.u-bento-grid').isVisible(),
        'Bento grid missing'
      )

      await page.close()
    })

    it('should keep dark hero text readable', async () => {
      const page = await context.newPage()
      await page.goto(`${BASE_URL}/`)

      const results = await page.evaluate(() => {
        const hero = document.querySelector('.c-hero')
        const heroBackground = getComputedStyle(hero).backgroundColor
        const selectors = [
          '.c-hero__badge',
          '.c-hero__description',
          '.c-hero__btn',
        ]

        return selectors.map((selector) => {
          const element = document.querySelector(selector)
          return {
            selector,
            color: getComputedStyle(element).color,
            background: heroBackground,
          }
        })
      })

      for (const result of results) {
        const ratio = getContrastRatio(result.color, result.background)
        assert.ok(
          ratio >= MIN_TEXT_CONTRAST_RATIO,
          `${result.selector} contrast ${ratio.toFixed(2)} is below ${MIN_TEXT_CONTRAST_RATIO}`
        )
      }

      await page.close()
    })

    it('should render hero title with clipped gradient text', async () => {
      const page = await context.newPage()
      await page.goto(`${BASE_URL}/`)

      const titleStyle = await page.evaluate(() => {
        const title = document.querySelector('.c-hero__title')
        const style = getComputedStyle(title)

        return {
          backgroundClip: style.backgroundClip,
          backgroundImage: style.backgroundImage,
          textFillColor: style.webkitTextFillColor,
        }
      })

      assert.match(titleStyle.backgroundImage, /linear-gradient/)
      assert.strictEqual(titleStyle.backgroundClip, 'text')
      assert.strictEqual(titleStyle.textFillColor, 'rgba(0, 0, 0, 0)')

      await page.close()
    })

    it('should navigate to About page successfully', async () => {
      const page = await context.newPage()
      await page.goto(`${BASE_URL}/`)

      await page.click('nav.o-header a[href="/about/"]')
      await page.waitForURL('**/about/')

      const heroH1 = await page.locator('.c-hero__title').textContent()
      assert.ok(heroH1.includes('Three modes'), 'About page title mismatch')

      await page.close()
    })

    it('should not contain "What this page answers" section and should render all 10 hash hint badges', async () => {
      const page = await context.newPage()
      await page.goto(`${BASE_URL}/about/`)

      const content = await page.content()
      assert.ok(
        !content.includes('What this page answers'),
        'Page should not contain "What this page answers"'
      )

      const hashHints = page.locator('.c-about__hash-hint')
      const count = await hashHints.count()
      assert.strictEqual(
        count,
        10,
        `Expected 10 hash hint badges, found ${count}`
      )

      await page.close()
    })
  })
} else {
  describe('E2E: Blank Template Features', { timeout: 120000 }, () => {
    it('should render the "It works!" greeting', async () => {
      const page = await context.newPage()
      await page.goto(`${BASE_URL}/`)

      const h1 = await page.locator('h1').textContent()
      assert.ok(h1.includes('It works!'), 'Blank template greeting not found')

      await page.close()
    })

    it('should have a clean layout without showcase header', async () => {
      const page = await context.newPage()
      await page.goto(`${BASE_URL}/`)

      const navCount = await page.locator('nav.o-header').count()
      assert.strictEqual(
        navCount,
        0,
        'Showcase header should be gone in blank template'
      )

      await page.close()
    })
  })
}

describe('E2E: Deep Link Integrity', { timeout: 120000 }, () => {
  it('should have no broken internal links or anchors', async () => {
    const checker = new LinkChecker()

    const result = await checker.check({
      path: BASE_URL,
      recurse: true,
      linksToSkip: [
        'https://img.shields.io',
        'https://app.codacy.com',
        'https://github.com',
      ],
    })

    const brokenLinks = result.links.filter((x) => {
      return x.state === 'BROKEN'
    })

    assert.strictEqual(
      brokenLinks.length,
      0,
      formatBrokenLinksReport(brokenLinks)
    )
  })
})
