/* eslint-disable max-lines -- Domain orchestration for project initialization requires more lines than the standard limit. */
import { execSync } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { deleteAsync } from 'del'
import pc from 'picocolors'

const WORKSPACE_COLOR_PATTERN = /"peacock.color": "#0a1d39"/g
const WORKSPACE_COLOR_REPLACEMENT = '"peacock.color": "#333333"'
const COMPONENTS_MARKER = '## Component List'
const FALLBACK_COMPONENTS_DOC =
  '# Component Architecture & Strategy\n\n## Component List\n\n'
const SYMLINK_SKIP_DIRS = new Set([
  '.git',
  '.temp',
  'build-dev',
  'build-export',
  'build-prod',
  'node_modules',
])

/**
 * Returns file patterns that should be removed from the generated project.
 * @returns {string[]} Delete patterns for showcase and devstack-owned files.
 */
export function getDeletePatterns() {
  return [
    'src/lib',
    'src/lib/**/*',
    'src/routes/**/*',
    '!src/routes/layout-default.njk',
    '!src/routes/index.njk',
    '!src/routes/404.njk',
    'src/assets/images/**/*',
    '!src/assets/images/favicon.ico',
    'src/assets/fonts/**/*',
    '!src/assets/fonts/.gitkeep',
    'src/assets/icons/**/*',
    '!src/assets/icons/.gitkeep',
    '!src/assets/icons/favicons-source.png',
    'public/**/*',
    '!public/robots.txt',
    '.github/workflows/deploy.yml',
    'CHANGELOG.md',
    'TODO.md',
    '.size-limit.json',
    'memories',
    'memories/**/*',
    'tests/**/*',
    '!tests',
    '!tests/e2e',
    '!tests/e2e/**/*',
    '!tests/test-helpers.js',
    'tests/unit',
    'tests/unit/**/*',
    'tests/integration',
    'tests/integration/**/*',
    'tests/visual',
    'tests/visual/**/*',
    'tests/fixtures',
    'tests/fixtures/**/*',
    'tests/smoke',
    'tests/smoke/**/*',
  ]
}

/**
 * Removes references to repository-local agent memories from GEMINI.md.
 * @param {string} content - Current GEMINI.md content.
 * @returns {string} Pruned GEMINI.md content.
 */
export function pruneGeminiMemoryReferences(content) {
  const workflowPattern = /^\d+\.\s+If the task touches .*`memories\/`.*\n?/gmu
  const gotchasPattern = /\n## Gotchas\n\n(?:- .*\n?)*/u
  return content.replace(workflowPattern, '').replace(gotchasPattern, '')
}

/**
 * Discovers project-owned symlinks while skipping dependency and build output trees.
 * @param {string} rootPath - Directory to scan.
 * @returns {Promise<string[]>} Relative symlink paths.
 */
export async function discoverProjectSymlinks(rootPath = '.') {
  const symlinks = []
  await collectProjectSymlinks(rootPath, '.', symlinks)
  return symlinks.sort()
}

async function collectProjectSymlinks(rootPath, relativeDir, symlinks) {
  const absoluteDir = path.join(rootPath, relativeDir)
  const entries = await fs.readdir(absoluteDir, { withFileTypes: true })
  for (const entry of entries) {
    if (SYMLINK_SKIP_DIRS.has(entry.name)) {
      continue
    }
    const relativePath = path.join(relativeDir, entry.name)
    const displayPath = relativePath
      .split(path.sep)
      .join('/')
      .replace(/^\.\//u, '')
    const absolutePath = path.join(rootPath, relativePath)
    const stats = await fs.lstat(absolutePath)
    if (stats.isSymbolicLink()) {
      symlinks.push(displayPath)
    } else if (stats.isDirectory()) {
      await collectProjectSymlinks(rootPath, relativePath, symlinks)
    }
  }
}

async function createGitBackupBranch(isDryRun, isGitRepo) {
  if (!isGitRepo || isDryRun) {
    return
  }

  try {
    const backupBranch = `backup/showcase-${Date.now()}`
    console.log(pc.cyan(`Creating backup branch: ${backupBranch}...`))
    execSync(`git checkout -b ${backupBranch}`, { stdio: 'ignore' })
    execSync('git checkout -', { stdio: 'ignore' })
    console.log(pc.green('✔ Backup branch created.'))
  } catch {
    console.log(pc.yellow('! Git backup branch failed, continuing anyway.'))
  }
}

async function purgeShowcaseFiles(isDryRun) {
  const deletePatterns = getDeletePatterns()

  if (isDryRun) {
    console.log(pc.dim('Dry run: would delete files matching:'), deletePatterns)
    return
  }

  const deletedFiles = await deleteAsync(deletePatterns)
  console.log(
    pc.dim(`Deleted ${deletedFiles.length} showcase files and directories.`)
  )
}

async function purgeProjectSymlinks(isDryRun) {
  const symlinks = await discoverProjectSymlinks('.')

  if (symlinks.length === 0) {
    return
  }

  if (isDryRun) {
    console.log(pc.dim('Dry run: would delete symlinks:'), symlinks)
    return
  }

  await Promise.all(
    symlinks.map((symlinkPath) => {
      return fs.unlink(symlinkPath)
    })
  )
  console.log(pc.dim(`Deleted ${symlinks.length} project symlinks.`))
}

async function pruneGeminiInstructions(isDryRun, geminiPath, pathExists) {
  if (!(await pathExists(geminiPath))) {
    return
  }

  if (isDryRun) {
    console.log(pc.dim(`Dry run: would prune ${geminiPath}`))
    return
  }

  const content = await fs.readFile(geminiPath, 'utf-8')
  const prunedContent = pruneGeminiMemoryReferences(content)

  await fs.writeFile(geminiPath, prunedContent, 'utf-8')
  console.log(pc.green('✔ Pruned GEMINI.md memory references.'))
}

async function updateWorkspaceSettings(isDryRun, workspacePath, pathExists) {
  try {
    if (!(await pathExists(workspacePath))) {
      return
    }

    if (isDryRun) {
      console.log(
        pc.dim(`Dry run: would update VSCode workspace: ${workspacePath}`)
      )
      return
    }

    let workspaceRaw = await fs.readFile(workspacePath, 'utf-8')
    workspaceRaw = workspaceRaw.replace(
      WORKSPACE_COLOR_PATTERN,
      WORKSPACE_COLOR_REPLACEMENT
    )
    await fs.writeFile(workspacePath, workspaceRaw, 'utf-8')
    console.log(pc.green('✔ Updated VSCode workspace settings.'))
  } catch {
    console.log(pc.dim('VSCode workspace update skipped or failed.'))
  }
}

async function ensureEnvFile(isDryRun, siteUrl, pathExists) {
  try {
    if (!(await pathExists('.env.example'))) {
      return
    }

    if (isDryRun) {
      console.log(pc.dim('Dry run: would create .env from .env.example'))
      return
    }

    let envContent = await fs.readFile('.env.example', 'utf-8')
    envContent = envContent.replace(
      /SITE_BASE_URL=.*/,
      `SITE_BASE_URL=${siteUrl}`
    )
    await fs.writeFile('.env', envContent, 'utf-8')
    console.log(pc.green('✔ Created .env file and populated with site URL.'))
  } catch {
    console.log(pc.dim('.env creation failed or skipped.'))
  }
}

async function pruneComponentsDocumentation(isDryRun, componentsDocPath) {
  try {
    const currentDocs = await fs.readFile(componentsDocPath, 'utf-8')
    const markerIndex = currentDocs.indexOf(COMPONENTS_MARKER)
    const prunedDoc =
      markerIndex !== -1
        ? currentDocs.substring(0, markerIndex + COMPONENTS_MARKER.length) +
          '\n\n'
        : FALLBACK_COMPONENTS_DOC

    if (isDryRun) {
      console.log(pc.dim(`Dry run: would prune ${componentsDocPath}`))
      return
    }

    await fs.writeFile(componentsDocPath, prunedDoc, 'utf-8')
    console.log(
      pc.green(
        '✔ Documentation (COMPONENTS.md) pruned, instructions preserved.'
      )
    )
  } catch {
    console.log(pc.yellow('! Failed to prune COMPONENTS.md, skipping.'))
  }
}

async function commitCleanState(_isDryRun, _isGitRepo) {
  console.log(
    pc.dim(
      '\nSkipping Git commit by default. You can manually commit the clean state.'
    )
  )
}

async function runPostInitScripts(isDryRun) {
  if (isDryRun) {
    console.log(pc.dim('Dry run: would run pnpm format and pnpm add .'))
    return
  }

  console.log(pc.cyan('\nRunning post-initialization scripts...'))
  try {
    console.log(pc.dim('Running pnpm format...'))
    execSync('pnpm format', { stdio: 'inherit' })
    console.log(pc.dim('Running pnpm add ....'))
    execSync('pnpm add .', { stdio: 'inherit' })
    console.log(pc.green('✔ Post-initialization scripts completed.'))
  } catch (error) {
    console.log(
      pc.yellow('! Post-initialization scripts failed:'),
      error.message
    )
  }
}

function logCompletion(isDryRun, rawProjectName) {
  if (isDryRun) {
    console.log(pc.yellow('\nDry run complete. No changes were made.'))
    return
  }

  console.log(
    pc.bgGreen(
      pc.black(
        `\n Initialization Complete! Project "${rawProjectName}" is ready! \n`
      )
    )
  )
}

export default {
  commitCleanState,
  createGitBackupBranch,
  ensureEnvFile,
  logCompletion,
  pruneComponentsDocumentation,
  pruneGeminiInstructions,
  purgeProjectSymlinks,
  purgeShowcaseFiles,
  runPostInitScripts,
  updateWorkspaceSettings,
}
/* eslint-enable max-lines -- Re-enable limit after orchestration logic. */
