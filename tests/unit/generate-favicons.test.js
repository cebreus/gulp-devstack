import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { afterEach, beforeEach, describe, it, mock } from 'node:test'

import generateFavicons from '../../gulp/tasks/generate-favicons.js'
import { runInSandbox } from '../test-helpers.js'

const MINIMAL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
)

describe('Generate Favicons Task', () => {
  describe('generateFavicons', () => {
    it('should throw error when sourcePath is invalid', async () => {
      await runInSandbox('favicon-missing', async (sandbox) => {
        const mockError = mock.method(console, 'error', () => {})
        const sourcePath = path.join(sandbox, 'nonexistent.png')
        const outputDir = path.join(sandbox, 'output')
        const faviconConfig = {
          appName: 'Test App',
          appShortName: 'Test',
          appDescription: 'Test Description',
          developerName: 'Test Dev',
          background: '#000000',
          path: '/',
          display: 'standalone',
          icons: {
            android: true,
            appleIcon: true,
            windows: true,
            favicons: true,
          },
        }

        try {
          await assert.rejects(
            () => generateFavicons(sourcePath, outputDir, faviconConfig),
            /Favicon source image not found/
          )
        } finally {
          mockError.mock.restore()
        }
      })
    })

    it('should throw error when outputDir is invalid', async () => {
      await runInSandbox('favicon', async (sandbox) => {
        const sourcePath = path.join(sandbox, 'source.png')
        const outputDir = null // Invalid
        const faviconConfig = {
          appName: 'Test App',
          appShortName: 'Test',
          appDescription: 'Test Description',
          developerName: 'Test Dev',
          background: '#000000',
          path: '/',
          display: 'standalone',
          icons: {
            android: true,
            appleIcon: true,
            windows: true,
            favicons: true,
          },
        }

        await fs.writeFile(sourcePath, MINIMAL_PNG)

        await assert.rejects(
          async () => {
            await generateFavicons(sourcePath, outputDir, faviconConfig)
          },
          (err) => {
            return err.message.includes(
              'Favicon task skipped: invalid source or destination'
            )
          }
        )
      })
    })

    it('should write root assets and keep the HTML snippet temporary', async () => {
      await runInSandbox('favicon-root', async (sandbox) => {
        const sourcePath = path.join(sandbox, 'source.png')
        const outputDir = path.join(sandbox, 'build', 'assets', 'favicons')
        const rootIconPath = path.join(sandbox, 'build', 'favicon.ico')
        const manifestPath = path.join(sandbox, 'build', 'manifest.webmanifest')
        const faviconHtmlPath = path.join(
          sandbox,
          '.tmp',
          'favicons',
          'favicons.html'
        )
        const faviconConfig = {
          appName: 'Test App',
          appShortName: 'Test',
          appDescription: 'Test Description',
          developerName: 'Test Dev',
          background: '#ffffff',
          theme_color: '#000000',
          path: '/assets/favicons/',
          display: 'standalone',
          icons: {
            android: ['android-chrome-192x192.png'],
            appleIcon: false,
            appleStartup: false,
            favicons: ['favicon.ico'],
            windows: false,
            yandex: false,
          },
        }

        await fs.writeFile(sourcePath, MINIMAL_PNG)

        await generateFavicons(sourcePath, outputDir, faviconConfig, {
          rootIconPath,
          manifestPath,
          faviconHtmlPath,
          manifestHref: '/manifest.webmanifest',
        })

        const snippet = await fs.readFile(faviconHtmlPath, 'utf8')

        await fs.access(rootIconPath)
        await fs.access(manifestPath)
        await assert.rejects(() =>
          fs.access(path.join(outputDir, 'favicon.ico'))
        )
        await assert.rejects(() =>
          fs.access(path.join(outputDir, 'manifest.webmanifest'))
        )
        await assert.rejects(() =>
          fs.access(path.join(outputDir, 'favicons.html'))
        )
        assert.ok(snippet.includes('/manifest.webmanifest'))
        assert.ok(!snippet.includes('favicon.ico'))
      })
    })
  })
})
