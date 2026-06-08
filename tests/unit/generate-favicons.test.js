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
      const mockError = mock.method(console, 'error', () => {})
      const sourcePath = './nonexistent.png'
      const outputDir = './output'
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
          async () => {
            await generateFavicons(sourcePath, outputDir, faviconConfig)
          },
          (err) => {
            return err.message.includes('Favicon source image not found')
          }
        )
      } finally {
        mockError.mock.restore()
      }
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
  })
})
