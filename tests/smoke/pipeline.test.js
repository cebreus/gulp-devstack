import assert from 'node:assert/strict'
import { execSync } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { afterEach, beforeEach, describe, it } from 'node:test'

import {
  cleanupSandbox,
  createTestSandbox,
  writeFixtures,
} from '../test-helpers.js'

describe('Pipeline Smoke Test', () => {
  let sandbox
  const root = process.cwd()

  beforeEach(async () => {
    sandbox = await createTestSandbox()
    // Link core build dependencies
    const toLink = [
      'node_modules',
      'gulp',
      'public',
      'package.json',
      'gulpfile.js',
    ]
    for (const item of toLink) {
      await fs.symlink(
        path.join(root, item),
        path.join(sandbox, item),
        item.includes('.') ? 'file' : 'dir'
      )
    }

    // Create partial src structure
    await fs.mkdir(path.join(sandbox, 'src'), { recursive: true })
    const srcDirs = ['scss', 'js', 'lib', 'assets'] // Remove config from auto-symlink
    for (const dir of srcDirs) {
      await fs.symlink(
        path.join(root, 'src', dir),
        path.join(sandbox, 'src', dir),
        'dir'
      )
    }

    // Isolate config: Create real dir and only link non-mutable files
    const sandboxConfig = path.join(sandbox, 'src/config')
    await fs.mkdir(sandboxConfig, { recursive: true })
    const realConfig = path.join(root, 'src/config')
    const configFiles = await fs.readdir(realConfig)
    for (const file of configFiles) {
      if (file !== 'fonts.list') {
        await fs.symlink(
          path.join(realConfig, file),
          path.join(sandboxConfig, file),
          'file'
        )
      }
    }

    // Ensure fonts.list is a REAL file in sandbox before it is modified
    const fontsListPath = path.join(sandboxConfig, 'fonts.list')
    await fs.writeFile(fontsListPath, '') // Create empty one in sandbox

    // Setup isolated src/routes
    const sandboxRoutes = path.join(sandbox, 'src/routes')
    await fs.mkdir(sandboxRoutes, { recursive: true })

    // Link only templates from real routes to avoid processing real content
    const realRoutes = path.join(root, 'src/routes')
    const routeFiles = await fs.readdir(realRoutes)
    for (const file of routeFiles) {
      if (file.endsWith('.njk')) {
        await fs.symlink(
          path.join(realRoutes, file),
          path.join(sandboxRoutes, file),
          'file'
        )
      }
    }
  })

  afterEach(async () => {
    await cleanupSandbox(sandbox)
  })

  it('should run build pipeline correctly for homepage only', async () => {
    // Arrange - Create ONLY the homepage
    const fixtures = {
      'src/routes/index.md':
        '---\ntitle: SmokeTestHome\nlayout: layout-default.njk\n---\n# Home Content',
    }
    await writeFixtures(sandbox, fixtures)

    // Act
    try {
      execSync('BUILD_MODE=build npx gulp build', {
        cwd: sandbox,
        env: { ...process.env, BUILD_MODE: 'build' },
        stdio: 'pipe',
      })
    } catch (error) {
      console.error('Gulp build failed in smoke test:')
      console.error(error.stdout?.toString())
      console.error(error.stderr?.toString())
      throw error
    }

    // Assert
    const buildDir = path.join(sandbox, 'build-prod')
    const indexHtml = await fs.readFile(
      path.join(buildDir, 'index.html'),
      'utf8'
    )

    // Title check proves data was correctly loaded and rendered via Nunjucks
    assert.ok(indexHtml.includes('<title>SmokeTestHome</title>'))

    // Check manifest for CSS proves asset pipeline worked
    const manifestPath = path.join(sandbox, '.temp/rev-manifest.json')
    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'))
    assert.ok(manifest['assets/css/index.css'])
  })
})
