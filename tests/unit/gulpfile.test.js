import assert from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { afterEach, describe, it } from 'node:test'

const originalBuildMode = process.env.BUILD_MODE

afterEach(() => {
  if (originalBuildMode === undefined) {
    delete process.env.BUILD_MODE
  } else {
    process.env.BUILD_MODE = originalBuildMode
  }
})

describe('Gulpfile (Boundary/Smoke)', () => {
  it('should successfully parse and export public pipeline tasks', async () => {
    // We dynamically import to catch syntax/parsing errors within the test execution phase
    // rather than crashing the test runner at module load time.
    process.env.BUILD_MODE = 'dev'
    const gulpfile = await import('../../gulpfile.js')

    const expectedTasks = [
      'clean',
      'copy',
      'css',
      'js',
      'dataset',
      'html',
      'images',
      'favicons',
      'fonts',
      'purge',
      'revision',
      'sri',
      'validate',
      'debug',
      'reload',
      'refreshCss',
      'resolveCssReloadPaths',
      'createRecoverableDevTask',
      'dev',
      'build',
      'export',
      'default',
    ]

    for (const task of expectedTasks) {
      assert.ok(
        typeof gulpfile[task] === 'function',
        `Missing or invalid export: ${task}`
      )
    }
  })

  it('should throw an error when BUILD_MODE is not set', () => {
    const env = { ...process.env }
    delete env.BUILD_MODE

    assert.throws(() => {
      execSync('node -e "import(\'./gulpfile.js\')"', {
        cwd: process.cwd(),
        env,
        stdio: 'pipe',
      })
    }, /Unsupported BUILD_MODE: <unset>\./)
  })

  it('should throw an error when BUILD_MODE is invalid', () => {
    assert.throws(() => {
      execSync('node -e "import(\'./gulpfile.js\')"', {
        cwd: process.cwd(),
        env: { ...process.env, BUILD_MODE: 'bulid' },
        stdio: 'pipe',
      })
    }, /Unsupported BUILD_MODE: bulid\./)
  })

  it('should export correct default pipeline based on BUILD_MODE', async () => {
    // Bust ESM cache with query strings to test different initialization branches
    process.env.BUILD_MODE = 'export'
    const gulpfileExport = await import('../../gulpfile.js?mode=export')
    assert.strictEqual(
      gulpfileExport.default,
      gulpfileExport.export,
      'export pipeline should be default when BUILD_MODE=export'
    )

    process.env.BUILD_MODE = 'build'
    const gulpfileBuild = await import('../../gulpfile.js?mode=build')
    assert.strictEqual(
      gulpfileBuild.default,
      gulpfileBuild.build,
      'build pipeline should be default when BUILD_MODE=build'
    )

    process.env.BUILD_MODE = 'dev'
    const gulpfileDev = await import('../../gulpfile.js?mode=dev')
    assert.strictEqual(
      gulpfileDev.default,
      gulpfileDev.dev,
      'dev pipeline should be default when BUILD_MODE=dev'
    )
  })

  it('should register template rebuilds for change, add, and unlink events', async () => {
    process.env.BUILD_MODE = 'dev'
    const gulpfile = await import('../../gulpfile.js?watchers=templates')
    const handlers = new Map()
    const watchedPaths = []
    const seriesCalls = []
    const gulpApi = {
      series(...taskList) {
        seriesCalls.push(taskList)
        return async (done) => {
          for (const task of taskList) {
            await task()
          }
          if (typeof done === 'function') done()
        }
      },
      watch(paths) {
        watchedPaths.push(paths)
        return {
          on(eventName, task) {
            handlers.set(eventName, task)
          },
        }
      },
    }
    const taskCalls = []
    const tasks = {
      lintTemplates() {
        taskCalls.push('lintTemplates')
      },
      dataset() {
        taskCalls.push('dataset')
      },
      html() {
        taskCalls.push('html')
      },
      reload(done) {
        taskCalls.push('reload')
        done()
      },
    }
    const config = {
      templateWatchPaths: ['src/**/*.njk', 'src/**/*.md'],
    }

    gulpfile.registerTemplateWatcher({ config, tasks, gulpApi })

    assert.deepStrictEqual(watchedPaths, [config.templateWatchPaths])
    assert.deepStrictEqual(seriesCalls, [
      [tasks.lintTemplates, tasks.dataset, tasks.html],
    ])
    assert.deepStrictEqual([...handlers.keys()], ['change', 'add', 'unlink'])
    for (const eventName of ['change', 'add', 'unlink']) {
      assert.equal(
        typeof handlers.get(eventName),
        'function',
        `${eventName} should run a template rebuild task`
      )
    }
    await handlers.get('change')()
    assert.deepStrictEqual(taskCalls, [
      'lintTemplates',
      'dataset',
      'html',
      'reload',
    ])
  })

  it('should resolve BrowserSync CSS reload paths from written files', async () => {
    process.env.BUILD_MODE = 'dev'
    const gulpfile = await import('../../gulpfile.js?css-reload-paths')
    const buildRoot = '/project/build-dev'

    assert.deepStrictEqual(
      gulpfile.resolveCssReloadPaths(buildRoot, [
        '/project/build-dev/assets/css/custom.css',
        '/project/build-dev/assets/css/custom.css.map',
        '/project/build-dev/assets/css/custom.css.deps.json',
        '/project/build-dev/assets/css/about/index.css',
      ]),
      ['assets/css/custom.css', 'assets/css/about/index.css']
    )
  })

  it('should convert a dev task failure into server error state', async () => {
    process.env.BUILD_MODE = 'dev'
    const gulpfile = await import('../../gulpfile.js?recoverable-dev-task')
    const calls = []
    const server = {
      fail(error) {
        calls.push(error.message)
      },
      ready() {
        calls.push('ready')
      },
    }
    const task = gulpfile.createRecoverableDevTask(
      (done) => {
        done(new Error('broken build'))
      },
      (done) => {
        calls.push('success')
        done()
      },
      server
    )

    await task()

    assert.deepStrictEqual(calls, ['broken build'])

    const recoveredTask = gulpfile.createRecoverableDevTask(
      (done) => done(),
      (done) => {
        calls.push('success')
        done()
      },
      server
    )
    await recoveredTask()

    assert.deepStrictEqual(calls, ['broken build', 'ready', 'success'])
  })
})
