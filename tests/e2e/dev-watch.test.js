import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { afterEach, describe, it } from 'node:test'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from '@playwright/test'

import {
  cleanupSandbox,
  createTestSandbox,
  linkNodeModulesIntoSandbox,
} from '../test-helpers.js'

const START_TIMEOUT_MS = 60000
const RELOAD_TIMEOUT_MS = 30000
const SHOWCASE_HEADING = 'What this project offers.'
const SHOWCASE_UPDATED_HEADING = 'What this project offers right now.'
const BLANK_HEADING = 'It works!'
const BLANK_UPDATED_HEADING = 'It works right now!'

async function copyProjectFixture(sandboxPath) {
  await Promise.all([
    fs.cp(path.resolve('gulp'), path.join(sandboxPath, 'gulp'), {
      recursive: true,
    }),
    fs.cp(path.resolve('src'), path.join(sandboxPath, 'src'), {
      recursive: true,
    }),
    fs.cp(path.resolve('public'), path.join(sandboxPath, 'public'), {
      recursive: true,
      force: true,
      errorOnExist: false,
    }),
    fs.copyFile(
      path.resolve('gulpfile.js'),
      path.join(sandboxPath, 'gulpfile.js')
    ),
    fs.copyFile(
      path.resolve('package.json'),
      path.join(sandboxPath, 'package.json')
    ),
  ])
  await linkNodeModulesIntoSandbox(sandboxPath)
}

async function waitForServer(url, childProcess, output) {
  const deadline = Date.now() + START_TIMEOUT_MS

  while (Date.now() < deadline) {
    if (childProcess.exitCode !== null) {
      throw new Error(
        `Dev server exited before becoming ready.\n${output.join('')}`
      )
    }

    try {
      const response = await fetch(url)
      if (response.ok) {
        return
      }
    } catch {}

    await delay(250)
  }

  throw new Error(`Timed out waiting for ${url}.\n${output.join('')}`)
}

async function stopProcess(childProcess) {
  if (!childProcess || childProcess.exitCode !== null) {
    return
  }

  childProcess.kill('SIGTERM')

  const deadline = Date.now() + 5000
  while (childProcess.exitCode === null && Date.now() < deadline) {
    await delay(100)
  }

  if (childProcess.exitCode === null) {
    childProcess.kill('SIGKILL')
  }
}

async function resolveWatchTarget(sandboxPath) {
  const showcaseTemplatePath = path.join(
    sandboxPath,
    'src/routes/about/index.njk'
  )

  try {
    const showcaseTemplate = await fs.readFile(showcaseTemplatePath, 'utf8')
    if (showcaseTemplate.includes(SHOWCASE_HEADING)) {
      return {
        urlPath: '/about/',
        templatePath: showcaseTemplatePath,
        originalHeading: SHOWCASE_HEADING,
        updatedHeading: SHOWCASE_UPDATED_HEADING,
      }
    }
  } catch {}

  const homepageTemplatePath = path.join(sandboxPath, 'src/routes/index.njk')
  const homepageTemplate = await fs.readFile(homepageTemplatePath, 'utf8')

  if (homepageTemplate.includes(BLANK_HEADING)) {
    return {
      urlPath: '/',
      templatePath: homepageTemplatePath,
      originalHeading: BLANK_HEADING,
      updatedHeading: BLANK_UPDATED_HEADING,
      templateContent: homepageTemplate,
    }
  }

  const homepageDataPath = path.join(sandboxPath, 'src/routes/index.md')
  const homepageData = await fs.readFile(homepageDataPath, 'utf8')

  return {
    urlPath: '/',
    templatePath: homepageDataPath,
    originalHeading: BLANK_HEADING,
    updatedHeading: BLANK_UPDATED_HEADING,
    templateContent: homepageData,
  }
}

describe('E2E: Dev Watch Reload', { timeout: 120000 }, () => {
  const sandboxesToCleanup = []

  afterEach(async () => {
    while (sandboxesToCleanup.length > 0) {
      await cleanupSandbox(sandboxesToCleanup.pop())
    }
  })

  it('should rebuild Nunjucks pages and refresh the browser after saving', async () => {
    const sandboxPath = await createTestSandbox('dev-watch')
    sandboxesToCleanup.push(sandboxPath)
    await copyProjectFixture(sandboxPath)

    const watchTarget = await resolveWatchTarget(sandboxPath)
    const gulpBinPath = path.resolve('node_modules/gulp/bin/gulp.js')
    const port = 3300 + Math.floor(Math.random() * 300)
    const baseUrl = `http://127.0.0.1:${port}`
    const childOutput = []

    const devProcess = spawn(process.execPath, [gulpBinPath, 'dev'], {
      cwd: sandboxPath,
      env: {
        ...process.env,
        BUILD_MODE: 'dev',
        BROWSERSYNC_PORT: String(port),
        BROWSERSYNC_OPEN: 'false',
        GULP_OUT_DIR: path.join(sandboxPath, 'build-dev'),
        GULP_TEMP_DIR: path.join(sandboxPath, '.temp'),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    devProcess.stdout.on('data', (chunk) => {
      childOutput.push(String(chunk))
    })
    devProcess.stderr.on('data', (chunk) => {
      childOutput.push(String(chunk))
    })

    const browser = await chromium.launch()

    try {
      await waitForServer(
        `${baseUrl}${watchTarget.urlPath}`,
        devProcess,
        childOutput
      )

      const page = await browser.newPage()
      await page.goto(`${baseUrl}${watchTarget.urlPath}`, {
        waitUntil: 'networkidle',
      })
      await page.waitForFunction(
        (text) => document.body.innerText.includes(text),
        watchTarget.originalHeading
      )

      const template =
        watchTarget.templateContent ||
        (await fs.readFile(watchTarget.templatePath, 'utf8'))
      assert.ok(
        template.includes(watchTarget.originalHeading),
        `Fixture heading "${watchTarget.originalHeading}" was not found in sandbox template.`
      )

      await fs.writeFile(
        watchTarget.templatePath,
        template.replace(
          watchTarget.originalHeading,
          watchTarget.updatedHeading
        )
      )

      await page.waitForFunction(
        (text) => document.body.innerText.includes(text),
        watchTarget.updatedHeading,
        { timeout: RELOAD_TIMEOUT_MS }
      )

      const renderedText = await page.locator('body').innerText()
      assert.match(renderedText, new RegExp(watchTarget.updatedHeading))

      await page.close()
    } finally {
      await browser.close()
      await stopProcess(devProcess)
    }
  })
})
