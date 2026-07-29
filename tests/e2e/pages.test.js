import assert from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { after, afterEach, before, beforeEach, describe, it } from 'node:test'
import AxeBuilder from '@axe-core/playwright'
import { chromium } from '@playwright/test'
import bs from 'browser-sync'
import { LinkChecker } from 'linkinator'

import { resolveConfig } from '../../gulp/config.js'
import { isCriticalPageAsset } from './page-asset-filter.js'

let BASE_URL = process.env.E2E_BASE_URL
  ? process.env.E2E_BASE_URL.replace(/\/$/, '')
  : null

let localServer = null
let browser = null
let context = null
let clientErrors = []

async function shouldSkipLink(link) {
  return new URL(link, BASE_URL).origin !== new URL(BASE_URL).origin
}

// E2E Hooks
before(async () => {
  browser = await chromium.launch()
  context = await browser.newContext()

  if (!BASE_URL) {
    const mode = process.env.BUILD_MODE || 'build'
    const config = resolveConfig(mode)
    const buildDir = path.resolve(config.paths.build)

    if (process.env.E2E_SKIP_BUILD !== 'true') {
      console.log(`[E2E] Building current ${mode} artefacts...`)
      const buildScript = mode === 'export' ? 'export' : 'build'
      execSync(`pnpm run ${buildScript}`, {
        stdio: 'inherit',
        env: { ...process.env, BUILD_MODE: mode },
      })
    } else if (!existsSync(path.join(buildDir, 'index.html'))) {
      throw new Error(
        `[E2E] Missing ${mode} artifact. Run pnpm ${mode === 'export' ? 'export' : 'build'} first.`
      )
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
          snippet: false,
          ui: false,
          logLevel: 'silent',
        },
        (err, bsInstance) => {
          if (err) {
            return reject(err)
          }
          const actualPort = bsInstance.options.get('port')
          if (actualPort !== 3000) {
            localServer.exit()
            return reject(
              new Error(
                `[E2E] Port 3000 is required but busy (used port ${actualPort} instead). Please stop any other processes using port 3000 (like 'gulp dev') before running E2E tests.`
              )
            )
          }
          BASE_URL = `http://localhost:${actualPort}`
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
    page.on('response', (response) => {
      const request = response.request()
      if (
        request.resourceType() !== 'document' &&
        new URL(response.url()).origin === new URL(BASE_URL).origin &&
        response.status() >= 400
      ) {
        clientErrors.push(
          `[ResourceError] ${response.status()} ${response.url()}`
        )
      }
    })
    page.on('requestfailed', (request) => {
      if (
        request.resourceType() !== 'document' &&
        new URL(request.url()).origin === new URL(BASE_URL).origin
      ) {
        clientErrors.push(`[RequestFailed] ${request.url()}`)
      }
    })
  })
})

beforeEach(() => {
  clientErrors = []
})

afterEach(async () => {
  try {
    assert.strictEqual(
      clientErrors.length,
      0,
      `Unexpected client errors found: ${clientErrors.join(', ')}`
    )
  } finally {
    await Promise.allSettled(
      context.pages().map((page) => {
        return page.close()
      })
    )
  }
})

after(async () => {
  if (localServer) {
    localServer.exit()
  }
  if (browser) {
    await browser.close()
  }
})

describe('E2E: Baseline Integrity (Universal)', { timeout: 120000 }, () => {
  it('should serve the homepage with HTTP 200', async () => {
    const page = await context.newPage()
    const response = await page.goto(`${BASE_URL}/`)
    assert.strictEqual(response.status(), 200)
    await page.close()
  })

  it('should pass WCAG accessibility audit', async () => {
    const page = await context.newPage()
    await page.goto(`${BASE_URL}/`)
    const results = await new AxeBuilder({ page }).analyze()
    assert.strictEqual(
      results.violations.length,
      0,
      JSON.stringify(results.violations, null, 2)
    )
    await page.close()
  })

  it('should have a valid title', async () => {
    const page = await context.newPage()
    await page.goto(`${BASE_URL}/`)
    const title = await page.title()
    assert.ok(title.length > 5, 'Page title is too short or missing')
    await page.close()
  })

  it('should load CSS and JS without 404s', async () => {
    const page = await context.newPage()
    const requests = []
    page.on('request', (request) => requests.push(request))

    await page.goto(`${BASE_URL}/`)

    const assets = requests.filter((req) => isCriticalPageAsset(req.url()))
    for (const asset of assets) {
      const response = await asset.response()
      assert.strictEqual(
        response.status(),
        200,
        `Critical asset failed to load: ${asset.url()}`
      )
    }
    await page.close()
  })
})

describe('E2E: Project Variant', { timeout: 120000 }, () => {
  it('should render the blank template or showcase homepage', async () => {
    const page = await context.newPage()
    await page.goto(`${BASE_URL}/`)

    const headings = page.locator('h1')
    assert.ok((await headings.count()) > 0, 'Homepage H1 is missing')
    const h1 = (await headings.first().textContent()) || ''
    const bentoCount = await page.locator('.u-bento-grid').count()
    const headerCount = await page.locator('.o-header').count()

    if (bentoCount > 0) {
      assert.ok(
        h1.includes('The predictable alternative to framework complexity.'),
        'Showcase heading not found'
      )
      assert.strictEqual(bentoCount, 1, 'Showcase Bento grid should be present')
      assert.strictEqual(headerCount, 1, 'Showcase header should be present')
    } else {
      assert.ok(h1.includes('It works!'), 'Blank template greeting not found')
      assert.strictEqual(
        headerCount,
        0,
        'Blank template should not use showcase header'
      )
    }

    await page.close()
  })
})

describe('E2E: Deep Link Integrity', { timeout: 120000 }, () => {
  it('should have no broken internal links or anchors', async () => {
    const checker = new LinkChecker()

    const result = await checker.check({
      path: BASE_URL,
      recurse: true,
      linksToSkip: shouldSkipLink,
    })

    const brokenLinks = result.links.filter((x) => x.state === 'BROKEN')
    assert.strictEqual(
      brokenLinks.length,
      0,
      `Found broken links: ${brokenLinks.map((l) => l.url).join(', ')}`
    )
  })
})
