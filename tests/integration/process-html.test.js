import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { afterEach, beforeEach, describe, it, mock } from 'node:test'

import processHtml from '../../gulp/tasks/process-html.js'
import { runInSandbox, silenceConsole, writeFixtures } from '../test-helpers.js'

describe('Process HTML Task (Integration)', () => {
  silenceConsole(beforeEach, afterEach, mock)

  it(
    'should compile Nunjucks templates and write HTML to build directory',
    { timeout: 10000 },
    async () => {
      await runInSandbox('process-html', async (sandbox) => {
        const config = {
          routesBase: path.join(sandbox, 'src', 'routes'),
          srcBase: path.join(sandbox, 'src'),
          imagesBase: path.join(sandbox, 'src', 'assets', 'images'),
          iconsBase: path.join(sandbox, 'src', 'assets', 'icons'),
          tempBase: path.join(sandbox, '.tmp'),
          paths: { build: path.join(sandbox, 'build') },
          globalInjectAssets: ['css/*.css'],
          formatCode: false,
        }

        await writeFixtures(sandbox, {
          'src/routes/index.njk': `
          <!DOCTYPE html>
          <html>
            <head><title>{{ page.title | default("World") }}</title></head>
            <body>
              <h1>Hello {{ page.title | default("World") }}</h1>
              <p>This is enough padding to exceed the 50 byte minimum integrity check in processHtml.</p>
            </body>
          </html>
        `,
          '.tmp/pages/index.json': JSON.stringify({ title: 'Sandbox' }),
          'build/css/dummy.css': 'body {}',
        })

        await processHtml(config)

        const outputHtmlPath = path.join(config.paths.build, 'index.html')
        const outputHtml = await fs.readFile(outputHtmlPath, 'utf8')

        assert.ok(
          outputHtml.includes('<h1>Hello Sandbox</h1>'),
          'Output HTML should contain rendered template data'
        )
      })
    }
  )

  it(
    'should render site and menu data loaded through route artifacts',
    { timeout: 10000 },
    async () => {
      await runInSandbox('process-html-global-context', async (sandbox) => {
        const config = {
          routesBase: path.join(sandbox, 'src', 'routes'),
          srcBase: path.join(sandbox, 'src'),
          imagesBase: path.join(sandbox, 'src', 'assets', 'images'),
          iconsBase: path.join(sandbox, 'src', 'assets', 'icons'),
          tempBase: path.join(sandbox, '.tmp'),
          paths: { build: path.join(sandbox, 'build') },
          globalInjectAssets: ['css/*.css'],
          formatCode: false,
        }

        await writeFixtures(sandbox, {
          'src/routes/index.njk': `
          <!DOCTYPE html>
          <html>
            <head><title>{{ site.title }}</title></head>
            <body>
              <h1>{{ site.title }}</h1>
              <nav>{{ site.menu[0].name }}</nav>
              <p>This is enough padding to exceed the 50 byte minimum integrity check in processHtml.</p>
            </body>
          </html>
        `,
          '.tmp/site.json': JSON.stringify({ title: 'Sandbox Site' }),
          '.tmp/pages/menu.json': JSON.stringify({
            menu: [{ name: 'About', order: 1, path: '/about/' }],
          }),
          'build/css/dummy.css': 'body {}',
        })

        await processHtml(config)

        const outputHtmlPath = path.join(config.paths.build, 'index.html')
        const outputHtml = await fs.readFile(outputHtmlPath, 'utf8')

        assert.ok(outputHtml.includes('<h1>Sandbox Site</h1>'))
        assert.ok(outputHtml.includes('<nav>About</nav>'))
      })
    }
  )
})
