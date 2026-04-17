import { spawnSync } from 'node:child_process'
import { rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Release-it configuration and execution wrapper.
 * This script provides on-demand release capabilities without polluting
 * the project's devDependencies.
 */

const CONFIG_FILE = '.release-it.tmp.json'

/** @type {import('release-it').Config} */
const config = {
  git: {
    changelog: 'git log --pretty=format:"* %s (%h)" ${latestTag}...HEAD',
    requireCleanWorkingDir: true,
    requireUpstream: true,
    requireCommits: true,
    addUntrackedFiles: false,
    commit: true,
    commitMessage: 'release: v${version}',
    tag: true,
    tagName: 'v${version}',
    tagAnnotation: 'Release v${version}',
    push: true,
    pushArgs: '--follow-tags',
  },
  github: {
    release: false,
  },
  npm: {
    publish: false,
  },
  plugins: {
    '@release-it/conventional-changelog': {
      infile: 'CHANGELOG.md',
      header: '# Changelog',
      preset: {
        name: 'conventionalcommits',
        types: [
          { type: 'feat', section: 'Features' },
          { type: 'fix', section: 'Bug Fixes' },
          { type: 'chore', section: 'Miscellaneous' },
          { type: 'refactor', section: 'Refactoring' },
          { type: 'perf', section: 'Performance' },
        ],
      },
    },
  },
}

/**
 * Main execution function.
 */
function main() {
  const configPath = join(process.cwd(), CONFIG_FILE)

  try {
    console.log('🚀 Preparing release environment...')
    writeFileSync(configPath, JSON.stringify(config, null, 2))

    console.log('📦 Running release-it via pnpm dlx...')

    // We use pnpm dlx to run release-it with plugins in an isolated environment
    const args = [
      'dlx',
      '--silent',
      '-p',
      'release-it@^20.0.0',
      '-p',
      '@release-it/conventional-changelog@^10.0.6',
      '-p',
      '@j-ulrich/release-it-regex-bumper@^5.4.0',
      'release-it',
      '--config',
      CONFIG_FILE,
      ...process.argv.slice(2),
    ]

    const result = spawnSync('pnpm', args, {
      stdio: 'inherit',
      shell: true,
    })

    if (result.status !== 0) {
      process.exit(result.status ?? 1)
    }
  } catch (error) {
    console.error(
      '❌ Release failed:',
      error instanceof Error ? error.message : String(error)
    )
    process.exit(1)
  } finally {
    try {
      rmSync(configPath, { force: true })
    } catch (cleanupError) {
      console.warn('⚠️  Failed to clean up temporary config:', cleanupError)
    }
  }
}

main()
