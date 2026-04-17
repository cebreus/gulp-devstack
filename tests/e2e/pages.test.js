import assert from 'node:assert/strict'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { after, before, describe, it } from 'node:test'
import AxeBuilder from '@axe-core/playwright'
import { chromium } from '@playwright/test'
import bs from 'browser-sync'
import { LinkChecker } from 'linkinator'

import { resolveConfig } from '../../gulp/config.js'

let BASE_URL = process.env.E2E_BASE_URL
  ? process.env.E2E_BASE_URL.replace(/\/$/, '')
  : null

let localServer = null

let browser = null

let context = null

const isShowcase = fs.existsSync(path.resolve('src/routes/about/index.md'))

describe('E2E: Playwright Universal Suite', function e2eSuite() {
  before(async function setupE2ETesting() {
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
      await new Promise(function initializeServer(resolve, reject) {
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
          function onServerReady(err, bsInstance) {
            if (err) return reject(err)
            BASE_URL = `http://localhost:${bsInstance.options.get('port')}`
            resolve()
          }
        )
      })
    }
  })

  after(async function teardownE2ETesting() {
    if (browser) await browser.close()
    if (localServer) localServer.exit()
  })

  describe('Baseline Integrity (Universal)', function baselineIntegritySuite() {
    it('should serve the homepage with HTTP 200', async function verifyHomepageResponds() {
      const page = await context.newPage()
      const res = await page.goto(`${BASE_URL}/`)
      assert.strictEqual(res.status(), 200)
      await page.close()
    })

    it('should pass WCAG accessibility audit', async function verifyAccessibility() {
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

    it('should have a valid title and no console errors', async function verifyTitleAndConsole() {
      const page = await context.newPage()
      const consoleErrors = []
      page.on('console', function captureConsoleErrors(msg) {
        if (msg.type() === 'error') consoleErrors.push(msg.text())
      })

      await page.goto(`${BASE_URL}/`)
      const title = await page.title()

      assert.ok(title.length > 0, 'Title is empty')
      assert.strictEqual(
        consoleErrors.length,
        0,
        `Console errors found: ${consoleErrors.join(', ')}`
      )
      await page.close()
    })

    it('should load CSS and JS without 404s', async function verifyResourceLoading() {
      const page = await context.newPage()
      const failedRequests = []

      page.on('requestfailed', function captureFailedRequests(req) {
        failedRequests.push(`${req.url()}: ${req.failure().errorText}`)
      })

      page.on('response', function captureFailedResponses(res) {
        if (res.status() >= 400) {
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
    describe('Showcase Mode Features', function showcaseFeaturesSuite() {
      it('should render a functional navigation menu', async function verifyNavigationMenu() {
        const page = await context.newPage()
        await page.goto(`${BASE_URL}/`)

        const nav = page.locator('nav.o-header')
        await nav.waitFor()

        const aboutLink = nav.locator('a[href="/about/"]')
        assert.strictEqual(await aboutLink.count(), 1, 'About link not found')

        await page.close()
      })

      it('should render hero buttons and bento grid', async function verifyHeroAndBento() {
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

      it('should navigate to About page successfully', async function verifyAboutNavigation() {
        const page = await context.newPage()
        await page.goto(`${BASE_URL}/`)

        await page.click('nav.o-header a[href="/about/"]')
        await page.waitForURL('**/about/')

        const heroH1 = await page.locator('.c-hero__title').textContent()
        assert.ok(heroH1.includes('projektu'), 'About page title mismatch')

        await page.close()
      })
    })
  } else {
    describe('Blank Template Features', function blankTemplateFeaturesSuite() {
      it('should render the "It works!" greeting', async function verifyGreeting() {
        const page = await context.newPage()
        await page.goto(`${BASE_URL}/`)

        const h1 = await page.locator('h1').textContent()
        assert.ok(h1.includes('It works!'), 'Blank template greeting not found')

        await page.close()
      })

      it('should have a clean layout without showcase header', async function verifyMinimalLayout() {
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

  describe('Deep Link Integrity', function deepLinkIntegritySuite() {
    it('should have no broken internal links or anchors', async function verifyInternalLinks() {
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

      const brokenLinks = result.links.filter(function isBroken(x) {
        return x.state === 'BROKEN'
      })
      const redirectedLinks = result.links.filter(function isRedirected(x) {
        return x.status >= 300 && x.status < 400
      })

      if (redirectedLinks.length > 0) {
        console.warn(
          '\n[Linkinator] Redirects detected (consider fixing for performance):'
        )
        redirectedLinks.forEach(function logRedirect(link) {
          console.warn(
            `- ${link.url} (HTTP ${link.status}) found on ${link.parent}`
          )
        })
      }

      if (brokenLinks.length > 0) {
        console.error('\n[Linkinator] Broken links detected:')
        brokenLinks.forEach(function logBroken(link) {
          console.error(
            `- ${link.url} (Status: ${link.status}) found on ${link.parent}`
          )
        })
      }

      assert.strictEqual(
        brokenLinks.length,
        0,
        `Found ${brokenLinks.length} broken links/anchors. Check console for details.`
      )
    })
  })
})
