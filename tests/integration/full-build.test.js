import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { describe, it } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'

import { runInSandbox, writeFixtures } from '../test-helpers.js'

describe('Full Build Pipeline (E2E Integration)', function testFullBuildPipeline() {
  it(
    'should complete a full production build without errors',
    { timeout: 30000 },
    async function testProductionBuild() {
      await runInSandbox(
        'full-build-e2e',
        async function executeBuildTest(sandboxPath) {
          process.env.BUILD_MODE = 'build'
          process.env.GULP_OUT_DIR = path.join(sandboxPath, 'build-prod')
          process.env.GULP_SKIP_INTEGRITY = 'true'

          const projectFixtures = {
            'src/routes/index.md': '---\ntitle: Home\n---\n# Welcome',
            'src/routes/index.njk':
              '{% extends "layout-default.njk" %}{% block content %}{{ page.content | md }}{% endblock %}',
            'src/routes/layout-default.njk':
              '<html><body>{% block content %}{% endblock %}</body></html>',
            'src/scss/main.scss': 'body { color: red; margin: 0; padding: 0; }',
            'src/scss/custom.scss': 'a { text-decoration: none; color: blue; }',
            'src/scss/variables.scss':
              '$primary: #007bff; .u-var-test { color: $primary; }',
            'src/scss/variables-dark.scss':
              '$primary-dark: #004085; .u-dark-test { color: $primary-dark; }',
            'src/scss/utils.scss':
              '.u-test { display: block !important; visibility: visible; }',
            'src/scss/globals.scss':
              'html { box-sizing: border-box; height: 100%; }',
            'src/scss/bootstrap.scss':
              '/* mock bootstrap */ .btn { padding: 10px; }',
            'src/scss/components.scss': '.c-mock { border: 1px solid black; }',
            'src/scss/u-devstack.scss':
              '#devstack { position: fixed; bottom: 0; }',
            'src/js/main.js':
              'console.log("hello world content here for size and validity");',
            'src/config/site.js':
              'export const siteDefaults = { title: "Test Site", baseUrl: "http://localhost" }',
            'src/assets/icons/favicons-source.png': Buffer.alloc(100),
            'src/assets/fonts/fonts.list': '',
          }
          await writeFixtures(sandboxPath, projectFixtures)

          try {
            const gulpfile = await import(
              `../../gulpfile.js?cache-bust=${Date.now()}`
            )
            const buildPipeline = gulpfile.build

            if (!buildPipeline) {
              assert.fail('Build pipeline could not be loaded.')
            }

            await new Promise(function runGulp(resolve, reject) {
              buildPipeline(function onComplete(err) {
                if (err) reject(err)
                else resolve()
              })
            })

            const buildOutputDir = process.env.GULP_OUT_DIR
            const generatedFiles = await fs.readdir(buildOutputDir)

            assert.ok(
              generatedFiles.includes('index.html'),
              'index.html should be generated'
            )
            assert.ok(
              generatedFiles.some(function hasAssets(file) {
                return file.startsWith('assets')
              }),
              'assets directory should exist'
            )
          } finally {
            delete process.env.BUILD_MODE
            delete process.env.GULP_OUT_DIR
            delete process.env.GULP_SKIP_INTEGRITY
            await sleep(500)
          }
        }
      )
    }
  )
})
