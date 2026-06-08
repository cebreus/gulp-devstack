import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { describe, it } from 'node:test'

import {
  cleanupSandbox,
  createTestSandbox,
  linkNodeModulesIntoSandbox,
} from '../test-helpers.js'

const ROOT_DIR = process.cwd()

async function setupInitTemplateFixture(sandboxPath) {
  await Promise.all([
    fs.cp(path.join(ROOT_DIR, 'scripts'), path.join(sandboxPath, 'scripts'), {
      recursive: true,
    }),
    fs.cp(path.join(ROOT_DIR, 'gulp'), path.join(sandboxPath, 'gulp'), {
      recursive: true,
    }),
    fs.cp(path.join(ROOT_DIR, 'src'), path.join(sandboxPath, 'src'), {
      recursive: true,
    }),
    fs.cp(path.join(ROOT_DIR, 'public'), path.join(sandboxPath, 'public'), {
      recursive: true,
    }),
    fs.cp(path.join(ROOT_DIR, 'docs'), path.join(sandboxPath, 'docs'), {
      recursive: true,
    }),
    fs.cp(
      path.join(ROOT_DIR, 'tests/e2e'),
      path.join(sandboxPath, 'tests/e2e'),
      {
        recursive: true,
      }
    ),
    fs.copyFile(
      path.join(ROOT_DIR, 'package.json'),
      path.join(sandboxPath, 'package.json')
    ),
    fs.copyFile(
      path.join(ROOT_DIR, '.env.example'),
      path.join(sandboxPath, '.env.example')
    ),
    fs.copyFile(
      path.join(ROOT_DIR, 'gulp-dev-stack.code-workspace'),
      path.join(sandboxPath, 'gulp-dev-stack.code-workspace')
    ),
    fs.copyFile(
      path.join(ROOT_DIR, 'GEMINI.md'),
      path.join(sandboxPath, 'GEMINI.md')
    ),
    fs.copyFile(
      path.join(ROOT_DIR, 'README.md'),
      path.join(sandboxPath, 'README.md')
    ),
    fs.copyFile(
      path.join(ROOT_DIR, 'gulpfile.js'),
      path.join(sandboxPath, 'gulpfile.js')
    ),
  ])

  await fs.copyFile(
    path.join(ROOT_DIR, 'tests/test-helpers.js'),
    path.join(sandboxPath, 'tests/test-helpers.js')
  )

  await fs.mkdir(path.join(sandboxPath, 'memories'), { recursive: true })
  await fs.writeFile(
    path.join(sandboxPath, 'memories/architectural-gotchas.md'),
    '# gotchas\n'
  )

  await fs.mkdir(path.join(sandboxPath, '.github/workflows'), {
    recursive: true,
  })
  await fs.writeFile(
    path.join(sandboxPath, '.github/workflows/deploy.yml'),
    'name: deploy\n'
  )

  await fs.symlink('README.md', path.join(sandboxPath, 'AGENTS.md'))
  await linkNodeModulesIntoSandbox(sandboxPath)
}

async function runNodeCommand(args, options) {
  return new Promise((resolve) => {
    const output = []
    const child = spawn(process.execPath, args, {
      ...options,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    child.stdout.on('data', (chunk) => {
      output.push(String(chunk))
    })
    child.stderr.on('data', (chunk) => {
      output.push(String(chunk))
    })
    child.on('close', (code) => {
      resolve({ code, output: output.join('') })
    })
  })
}

async function runInitTemplate(sandboxPath) {
  const initTemplateScript = path.join(sandboxPath, 'scripts/init-template.js')
  const harnessPath = path.join(sandboxPath, 'run-init-template.mjs')
  const harnessContents = `
import prompts from 'prompts'
import { pathToFileURL } from 'node:url'

const scriptPath = process.argv[2]
prompts.inject([true, 'Nicotrans', 'Jaroslav Vrana', 'MIT', 'https://nicotrans.test'])
process.argv = ['node', scriptPath]
await import(pathToFileURL(scriptPath).href)
`

  await fs.writeFile(harnessPath, harnessContents, 'utf8')

  return runNodeCommand([harnessPath, initTemplateScript], { cwd: sandboxPath })
}

async function runBuild(sandboxPath) {
  const gulpBin = path.join(sandboxPath, 'node_modules/gulp/bin/gulp.js')
  const gulpfilePath = path.join(sandboxPath, 'gulpfile.js')

  return runNodeCommand([gulpBin, '--gulpfile', gulpfilePath, 'build'], {
    cwd: sandboxPath,
    env: {
      ...process.env,
      BUILD_MODE: 'build',
      GULP_OUT_DIR: path.join(sandboxPath, 'build-prod'),
      GULP_TEMP_DIR: path.join(sandboxPath, '.temp'),
    },
  })
}

async function runExport(sandboxPath) {
  const gulpBin = path.join(sandboxPath, 'node_modules/gulp/bin/gulp.js')
  const gulpfilePath = path.join(sandboxPath, 'gulpfile.js')

  return runNodeCommand([gulpBin, '--gulpfile', gulpfilePath, 'export'], {
    cwd: sandboxPath,
    env: {
      ...process.env,
      BUILD_MODE: 'export',
      GULP_OUT_DIR: path.join(sandboxPath, 'build-export'),
      GULP_TEMP_DIR: path.join(sandboxPath, '.temp'),
    },
  })
}

async function runPagesE2E(sandboxPath) {
  return runNodeCommand(
    ['--test', '--test-concurrency=1', 'tests/e2e/pages.test.js'],
    {
      cwd: sandboxPath,
      env: {
        ...process.env,
        BUILD_MODE: 'build',
      },
    }
  )
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath)
    return true
  } catch {
    return false
  }
}

describe('init:template acceptance', () => {
  it(
    'should generate a buildable blank template without framework residue',
    { timeout: 120000 },
    async () => {
      const sandboxPath = await createTestSandbox('init-template-acceptance')

      try {
        await setupInitTemplateFixture(sandboxPath)

        const initResult = await runInitTemplate(sandboxPath)
        assert.equal(initResult.code, 0, initResult.output)

        assert.equal(
          await pathExists(path.join(sandboxPath, 'tests/e2e')),
          true
        )
        assert.equal(
          await pathExists(path.join(sandboxPath, 'tests/test-helpers.js')),
          true
        )
        assert.equal(
          await pathExists(path.join(sandboxPath, 'tests/unit')),
          false
        )
        assert.equal(
          await pathExists(path.join(sandboxPath, 'tests/integration')),
          false
        )
        assert.equal(
          await pathExists(path.join(sandboxPath, 'tests/visual')),
          false
        )
        assert.equal(
          await pathExists(path.join(sandboxPath, 'tests/fixtures')),
          false
        )
        assert.equal(
          await pathExists(path.join(sandboxPath, 'tests/smoke')),
          false
        )
        assert.equal(
          await pathExists(path.join(sandboxPath, 'memories')),
          false
        )
        assert.equal(
          await pathExists(path.join(sandboxPath, 'AGENTS.md')),
          false
        )
        assert.equal(
          await pathExists(path.join(sandboxPath, 'src/routes/about')),
          false
        )
        assert.equal(
          await pathExists(path.join(sandboxPath, 'src/scss/u-devstack.scss')),
          true
        )
        assert.equal(
          await pathExists(path.join(sandboxPath, 'src/routes/showcase')),
          false
        )
        assert.equal(await pathExists(path.join(sandboxPath, 'src/lib')), false)
        assert.equal(
          await pathExists(path.join(sandboxPath, 'src/assets/icons/gulp.svg')),
          false
        )
        assert.equal(
          await pathExists(
            path.join(sandboxPath, 'src/assets/icons/favicons-source.png')
          ),
          true
        )
        assert.equal(
          await pathExists(path.join(sandboxPath, '.size-limit.json')),
          false
        )
        assert.equal(
          await pathExists(path.join(sandboxPath, 'src/assets/icons/.gitkeep')),
          true
        )
        assert.equal(
          await pathExists(path.join(sandboxPath, 'src/lib/components')),
          false
        )
        assert.equal(
          await pathExists(path.join(sandboxPath, 'public/CNAME')),
          false
        )
        assert.equal(
          await pathExists(
            path.join(sandboxPath, '.github/workflows/deploy.yml')
          ),
          false
        )

        const gemini = await fs.readFile(
          path.join(sandboxPath, 'GEMINI.md'),
          'utf8'
        )
        assert.equal(gemini.includes('memories/'), false)
        assert.equal(gemini.includes('## Gotchas'), false)

        const envFile = await fs.readFile(
          path.join(sandboxPath, '.env'),
          'utf8'
        )
        assert.match(envFile, /SITE_BASE_URL=https:\/\/nicotrans\.test/u)

        const pkg = JSON.parse(
          await fs.readFile(path.join(sandboxPath, 'package.json'), 'utf8')
        )
        assert.equal(pkg.scripts?.['init:template'], undefined)
        assert.equal(
          pkg.scripts?.test,
          'cross-env NODE_ENV=test node --test --test-concurrency=1 tests/e2e/**/*.test.js'
        )
        assert.equal(pkg.scripts?.['test:e2e'], pkg.scripts?.test)
        assert.equal(
          pkg.scripts?.['test:prod'],
          'cross-env BUILD_MODE=build pnpm run test:e2e'
        )
        assert.equal(
          pkg.scripts?.['test:export'],
          'cross-env BUILD_MODE=export pnpm run test:e2e'
        )
        assert.equal(pkg.scripts?.['verify:pipeline'], undefined)
        assert.equal(pkg.scripts?.['sanity:budget'], undefined)
        assert.ok(pkg.devDependencies?.['@playwright/test'])
        assert.ok(pkg.devDependencies?.['@axe-core/playwright'])
        assert.ok(pkg.devDependencies?.linkinator)
        assert.equal(pkg.devDependencies?.['size-limit'], undefined)
        assert.equal(
          pkg.devDependencies?.['@size-limit/preset-big-lib'],
          undefined
        )

        const workspace = await fs.readFile(
          path.join(sandboxPath, 'gulp-dev-stack.code-workspace'),
          'utf8'
        )
        assert.equal(workspace.includes('"peacock.color": "#0a1d39"'), false)
        assert.ok(workspace.includes('"peacock.color": "#333333"'))

        const componentsDoc = await fs.readFile(
          path.join(sandboxPath, 'docs/COMPONENTS.md'),
          'utf8'
        )
        assert.equal(componentsDoc.includes('### meta-rich-snippets'), false)
        assert.match(componentsDoc, /## Component List\n\n$/u)

        const testingDoc = await fs.readFile(
          path.join(sandboxPath, 'docs/TESTING.md'),
          'utf8'
        )
        assert.ok(testingDoc.includes('baseline end-to-end test suite'))
        assert.equal(testingDoc.includes('tests/unit/'), false)
        assert.equal(testingDoc.includes('tests/integration/'), false)

        const readme = await fs.readFile(
          path.join(sandboxPath, 'README.md'),
          'utf8'
        )
        assert.ok(readme.startsWith('# Nicotrans'))
        assert.equal(readme.includes('Gulp DevStack'), false)

        const robots = await fs.readFile(
          path.join(sandboxPath, 'public/robots.txt'),
          'utf8'
        )
        assert.equal(robots.includes('gulp-devstack.cebre.us'), false)
        assert.equal(robots.includes('Sitemap:'), false)

        assert.equal(
          await pathExists(path.join(sandboxPath, 'public/humans.txt')),
          false
        )

        const layout = await fs.readFile(
          path.join(sandboxPath, 'src/routes/layout-default.njk'),
          'utf8'
        )
        assert.ok(layout.includes('{% block content %}{% endblock %}'))
        assert.ok(layout.includes('<!-- inject:css --><!-- endinject -->'))

        const indexTemplate = await fs.readFile(
          path.join(sandboxPath, 'src/routes/index.njk'),
          'utf8'
        )
        assert.ok(indexTemplate.includes('It works!'))
        assert.equal(indexTemplate.includes('What this project offers.'), false)
        assert.equal(indexTemplate.startsWith('---'), false)

        const indexRouteData = await fs.readFile(
          path.join(sandboxPath, 'src/routes/index.md'),
          'utf8'
        )
        assert.match(indexRouteData, /title: Welcome to Blank Template/u)

        const notFoundTemplate = await fs.readFile(
          path.join(sandboxPath, 'src/routes/404.njk'),
          'utf8'
        )
        assert.ok(
          notFoundTemplate.includes(
            'The page you are looking for does not exist.'
          )
        )
        assert.equal(notFoundTemplate.startsWith('---'), false)

        const notFoundRouteData = await fs.readFile(
          path.join(sandboxPath, 'src/routes/404.md'),
          'utf8'
        )
        assert.match(notFoundRouteData, /title: 404 - Page Not Found/u)

        const customScss = await fs.readFile(
          path.join(sandboxPath, 'src/scss/custom.scss'),
          'utf8'
        )
        assert.match(
          customScss,
          /@import 'globals';\n@import 'utils';\n@import 'bootstrap\.scss';/u
        )

        const componentsScss = await fs.readFile(
          path.join(sandboxPath, 'src/scss/components.scss'),
          'utf8'
        )
        assert.equal(
          componentsScss,
          `@import 'globals';

// Add your custom component styles here
`
        )

        const siteConfig = await fs.readFile(
          path.join(sandboxPath, 'src/config/site.js'),
          'utf8'
        )
        assert.ok(siteConfig.includes("title: 'Nicotrans'"))
        assert.ok(siteConfig.includes("author: 'Jaroslav Vrana'"))
        assert.ok(
          siteConfig.includes(
            "baseUrl: process.env.SITE_BASE_URL || 'https://nicotrans.test'"
          )
        )

        const buildResult = await runBuild(sandboxPath)
        assert.equal(buildResult.code, 0, buildResult.output)
        assert.equal(buildResult.output.includes('[ERROR] [Sass]'), false)

        const exportResult = await runExport(sandboxPath)
        assert.equal(exportResult.code, 0, exportResult.output)
        assert.equal(exportResult.output.includes('[ERROR] [Sass]'), false)

        const builtIndex = await fs.readFile(
          path.join(sandboxPath, 'build-prod/index.html'),
          'utf8'
        )
        assert.ok(builtIndex.includes('It works!'))
        assert.equal(builtIndex.includes('Gulp DevStack'), false)
        assert.equal(
          builtIndex.includes(
            'The predictable alternative to framework complexity.'
          ),
          false
        )
        assert.match(builtIndex, /<title>Welcome to Blank Template<\/title>/u)

        const pagesE2EResult = await runPagesE2E(sandboxPath)
        assert.equal(pagesE2EResult.code, 0, pagesE2EResult.output)
      } finally {
        await cleanupSandbox(sandboxPath)
      }
    }
  )
})
