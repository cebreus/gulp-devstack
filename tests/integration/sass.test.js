import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { afterEach, beforeEach, describe, it, mock } from 'node:test'

import { resolveConfig } from '../../gulp/config.js'
import processSass, {
  compileRouteStyles,
  processAllSass,
} from '../../gulp/tasks/process-sass.js'
import { runInSandbox, silenceConsole, writeFixtures } from '../test-helpers.js'

silenceConsole(beforeEach, afterEach, mock)

function buildSandboxSassConfig(sandbox) {
  const devConfig = resolveConfig('dev')
  const srcBase = path.join(sandbox, 'src')

  return {
    ...devConfig,
    srcBase,
    routesBase: path.join(srcBase, 'routes'),
    sassBase: path.join(srcBase, 'scss'),
    sassBootstrap: path.join(srcBase, 'scss/bootstrap.scss'),
    sassCustom: path.join(srcBase, 'scss/custom.scss'),
    sassComponents: path.join(srcBase, 'scss/components.scss'),
    paths: {
      ...devConfig.paths,
      sass: path.join(sandbox, 'dist'),
    },
    skipIntegrity: true,
  }
}

describe('Sass Pipeline Integration', () => {
  let mockConsoleError

  beforeEach(() => {
    mockConsoleError = mock.method(console, 'error', () => {})
  })

  afterEach(() => {
    mockConsoleError.mock.restore()
  })

  async function testProcessSass(sandbox, options = {}) {
    const outputDir = path.join(sandbox, 'dist')
    const devConfig = resolveConfig('dev')
    await processSass(
      devConfig,
      path.join(sandbox, 'src/style.scss'),
      outputDir,
      { skipIntegrity: true, ...options }
    )
    return outputDir
  }

  it('should catch and handle sass compilation errors', async () => {
    await runInSandbox('sass-error', async (sandbox) => {
      const errorFixtures = {
        'src/style.scss': 'body { color: $non-existent-variable; }',
      }
      await writeFixtures(sandbox, errorFixtures)
      const outputDir = await testProcessSass(sandbox)

      const cssFileExists = await fs
        .access(path.join(outputDir, 'style.css'))
        .then(() => {
          return true
        })
        .catch(() => {
          return false
        })
      assert.strictEqual(
        cssFileExists,
        false,
        'CSS file should not exist on compilation error'
      )
    })
  })

  it('should return immediately when no route styles are found', async () => {
    await runInSandbox('sass-empty-routes', async (sandbox) => {
      await writeFixtures(sandbox, {
        'src/scss/custom.scss': '.custom-layer { color: red; }',
      })

      const devConfig = buildSandboxSassConfig(sandbox)
      let compiledCount
      await assert.doesNotReject(async () => {
        compiledCount = await compileRouteStyles(devConfig)
      })
      assert.strictEqual(
        compiledCount,
        undefined,
        'compileRouteStyles should return undefined when no route SCSS files are found'
      )
    })
  })

  it('should support custom postcss plugins', async () => {
    await runInSandbox('sass-postcss', async (sandbox) => {
      const markerPlugin = {
        postcssPlugin: 'test-marker',
        Rule(rule) {
          rule.append({ prop: '--postcss-marker', value: 'applied' })
        },
      }
      const postcssFixtures = {
        'src/style.scss':
          'body { display: flex; color: blue; background: green; }',
      }
      await writeFixtures(sandbox, postcssFixtures)
      const outputDir = await testProcessSass(sandbox, {
        minify: false,
        postcssPlugins: [markerPlugin],
      })

      const generatedCss = await fs.readFile(
        path.join(outputDir, 'style.css'),
        'utf8'
      )
      assert.ok(generatedCss.includes('--postcss-marker: applied'))
    })
  })

  it('should emit external Sass source maps in dev mode', async () => {
    await runInSandbox('sass-sourcemaps-dev', async (sandbox) => {
      await writeFixtures(sandbox, {
        'src/style.scss': 'body { color: blue; }',
      })
      const outputDir = await testProcessSass(sandbox)

      const generatedCss = await fs.readFile(
        path.join(outputDir, 'style.css'),
        'utf8'
      )
      const generatedMap = await fs.readFile(
        path.join(outputDir, 'style.css.map'),
        'utf8'
      )

      assert.ok(
        generatedCss.includes('sourceMappingURL=style.css.map'),
        'CSS should link to an external source map'
      )
      assert.ok(generatedMap.includes('"sources"'))
    })
  })

  it('should compile Bootstrap from the project Sass entrypoint', async () => {
    await runInSandbox('sass-project-bootstrap', async (sandbox) => {
      await writeFixtures(sandbox, {
        'src/scss/bootstrap.scss':
          '.from-project-bootstrap { color: rgb(1, 2, 3); }',
        'src/scss/custom.scss': '.custom-layer { color: red; }',
        'src/scss/components.scss': '.component-layer { color: blue; }',
        'src/routes/index.scss': '.route-layer { color: green; }',
      })

      const devConfig = buildSandboxSassConfig(sandbox)
      await processAllSass(devConfig, 'dev')

      const bootstrapCss = await fs.readFile(
        path.join(devConfig.paths.sass, 'bootstrap.css'),
        'utf8'
      )
      const componentsCss = await fs.readFile(
        path.join(devConfig.paths.sass, 'components.css'),
        'utf8'
      )

      assert.ok(bootstrapCss.includes('.from-project-bootstrap'))
      assert.ok(componentsCss.includes('.component-layer'))
    })
  })

  it('should read the dev Sass failure flag at task execution time', async () => {
    await runInSandbox('sass-lazy-failure-flag', async (sandbox) => {
      await writeFixtures(sandbox, {
        'src/scss/bootstrap.scss': 'body { color: $missing; }',
        'src/scss/custom.scss': '.custom-layer { color: red; }',
        'src/scss/components.scss': '.component-layer { color: blue; }',
        'src/routes/index.scss': '.route-layer { color: green; }',
      })
      const devConfig = buildSandboxSassConfig(sandbox)
      const originalFlag = process.env.GULP_FAIL_ON_SASS_ERROR
      process.env.GULP_FAIL_ON_SASS_ERROR = 'true'

      try {
        await assert.rejects(
          () => processAllSass(devConfig, 'dev'),
          /Sass compilation failed/
        )
      } finally {
        if (originalFlag === undefined) {
          delete process.env.GULP_FAIL_ON_SASS_ERROR
        } else {
          process.env.GULP_FAIL_ON_SASS_ERROR = originalFlag
        }
      }
    })
  })

  it('should recompile route styles when shared route abstracts change', async () => {
    await runInSandbox('sass-route-abstracts', async (sandbox) => {
      await writeFixtures(sandbox, {
        'src/scss/_route-abstracts.scss': '$route-color: red;',
        'src/routes/index.scss':
          "@import '../scss/route-abstracts'; .route { color: $route-color; }",
      })

      const devConfig = buildSandboxSassConfig(sandbox)
      await compileRouteStyles(devConfig, [], { skipNewer: true })

      const routeCssPath = path.join(devConfig.paths.sass, 'index.css')
      const initialCss = await fs.readFile(routeCssPath, 'utf8')
      assert.ok(initialCss.includes('color: red'))
      const routeCssStats = await fs.stat(routeCssPath)

      const dependencyPath = path.join(
        sandbox,
        'src/scss/_route-abstracts.scss'
      )
      await fs.writeFile(dependencyPath, '$route-color: blue;')
      const advancedMtime = new Date(routeCssStats.mtimeMs + 1000)
      await fs.utimes(dependencyPath, advancedMtime, advancedMtime)
      await compileRouteStyles(devConfig, [], { skipNewer: true })

      const updatedCss = await fs.readFile(routeCssPath, 'utf8')
      assert.ok(updatedCss.includes('color: blue'))
    })
  })

  it('should skip unchanged route styles while preserving import invalidation', async () => {
    await runInSandbox('sass-route-cache', async (sandbox) => {
      await writeFixtures(sandbox, {
        'src/scss/_route-abstracts.scss': '$route-color: red;',
        'src/routes/index.scss':
          "@import '../scss/route-abstracts'; .route { color: $route-color; }",
      })

      const devConfig = buildSandboxSassConfig(sandbox)
      const firstRun = await compileRouteStyles(devConfig, [], {
        skipNewer: true,
      })
      const routeCssPath = path.join(devConfig.paths.sass, 'index.css')
      const firstStats = await fs.stat(routeCssPath)

      const secondRun = await compileRouteStyles(devConfig, [], {
        skipNewer: true,
      })
      const secondStats = await fs.stat(routeCssPath)

      assert.deepStrictEqual(secondRun, [])
      assert.deepStrictEqual(firstRun, [routeCssPath])
      assert.strictEqual(secondStats.mtimeMs, firstStats.mtimeMs)

      const dependencyPath = path.join(
        sandbox,
        'src/scss/_route-abstracts.scss'
      )
      await fs.writeFile(dependencyPath, '$route-color: blue;')
      const advancedMtime = new Date(secondStats.mtimeMs + 1000)
      await fs.utimes(dependencyPath, advancedMtime, advancedMtime)
      const thirdRun = await compileRouteStyles(devConfig, [], {
        skipNewer: true,
      })

      assert.deepStrictEqual(thirdRun, [routeCssPath])
    })
  })

  it('should invalidate route cache when source-map mode changes', async () => {
    await runInSandbox('sass-route-cache-config', async (sandbox) => {
      await writeFixtures(sandbox, {
        'src/routes/index.scss': '.route { color: red; }',
      })
      const devConfig = buildSandboxSassConfig(sandbox)
      const routeCssPath = path.join(devConfig.paths.sass, 'index.css')

      await compileRouteStyles(devConfig, [], {
        skipNewer: true,
        sourceMaps: true,
      })
      assert.match(await fs.readFile(routeCssPath, 'utf8'), /sourceMappingURL/)

      const result = await compileRouteStyles(devConfig, [], {
        skipNewer: true,
        sourceMaps: false,
      })
      assert.deepStrictEqual(result, [routeCssPath])
      assert.doesNotMatch(
        await fs.readFile(routeCssPath, 'utf8'),
        /sourceMappingURL/
      )
    })
  })

  it('should invalidate Sass cache when the caller cache key changes', async () => {
    await runInSandbox('sass-cache-key', async (sandbox) => {
      const sourcePath = path.join(sandbox, 'src/style.scss')
      const outputDir = path.join(sandbox, 'dist')
      const devConfig = resolveConfig('dev')
      await writeFixtures(sandbox, {
        'src/style.scss': 'body { color: red; }',
      })

      function createColorPlugin(value) {
        return {
          postcssPlugin: 'test-color',
          Declaration(declaration) {
            if (declaration.prop === 'color') {
              declaration.value = value
            }
          },
        }
      }

      await processSass(devConfig, sourcePath, outputDir, {
        cacheKey: 'color:blue',
        postcssPlugins: [createColorPlugin('blue')],
        skipIntegrity: true,
        skipNewer: true,
      })
      const result = await processSass(devConfig, sourcePath, outputDir, {
        cacheKey: 'color:green',
        postcssPlugins: [createColorPlugin('green')],
        skipIntegrity: true,
        skipNewer: true,
      })

      assert.deepStrictEqual(result, [path.join(outputDir, 'style.css')])
      assert.match(
        await fs.readFile(path.join(outputDir, 'style.css'), 'utf8'),
        /color: green/
      )
    })
  })
})
