import { execSync } from 'node:child_process'
import fs from 'node:fs/promises'
import { deleteAsync } from 'del'
import pc from 'picocolors'

const WORKSPACE_COLOR_PATTERN = /"peacock.color": "#0a1d39"/g
const WORKSPACE_COLOR_REPLACEMENT = '"peacock.color": "#333333"'
const COMPONENTS_MARKER = '## Component List'
const FALLBACK_COMPONENTS_DOC =
  '# Component Architecture & Strategy\n\n## Component List\n\n'

function getDeletePatterns() {
  return [
    'src/lib/components/**/*',
    'src/routes/**/*',
    '!src/routes/layout-default.njk',
    '!src/routes/index.njk',
    '!src/routes/404.njk',
    'src/assets/images/**/*',
    '!src/assets/images/favicon.ico',
    'src/assets/fonts/**/*',
    '!src/assets/fonts/.gitkeep',
    'src/scss/u-devstack.scss',
    'public/**/*',
    '!public/robots.txt',
    '!public/humans.txt',
    '.github/workflows/deploy.yml',
    'CHANGELOG.md',
    'TODO.md',
  ]
}

/**
 * @param {boolean} isDryRun - True when the script must not mutate the repo.
 * @param {boolean} isGitRepo - True when the current workspace is a Git repository.
 * @returns {Promise<void>} Resolves after the backup branch attempt finishes.
 */
export async function createGitBackupBranch(isDryRun, isGitRepo) {
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

/**
 * @param {boolean} isDryRun - True when showcase files should only be reported.
 * @returns {Promise<void>} Resolves after showcase cleanup completes.
 */
export async function purgeShowcaseFiles(isDryRun) {
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

/**
 * @param {boolean} isDryRun - True when workspace edits should only be logged.
 * @param {string} workspacePath - VS Code workspace file that should be updated.
 * @param {(targetPath: string) => Promise<boolean>} pathExists - Filesystem existence check.
 * @returns {Promise<void>} Resolves after the workspace settings update attempt.
 */
export async function updateWorkspaceSettings(
  isDryRun,
  workspacePath,
  pathExists
) {
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

/**
 * @param {boolean} isDryRun - True when .env should not be created.
 * @param {string} siteUrl - Production site URL written into .env.
 * @param {(targetPath: string) => Promise<boolean>} pathExists - Filesystem existence check.
 * @returns {Promise<void>} Resolves after the .env creation attempt.
 */
export async function ensureEnvFile(isDryRun, siteUrl, pathExists) {
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

/**
 * @param {boolean} isDryRun - True when documentation should not be modified.
 * @param {string} componentsDocPath - Components documentation file.
 * @returns {Promise<void>} Resolves after the docs pruning attempt.
 */
export async function pruneComponentsDocumentation(
  isDryRun,
  componentsDocPath
) {
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

/**
 * @param {boolean} isDryRun - True when the commit should only be logged.
 * @param {boolean} isGitRepo - True when committing is possible in this workspace.
 * @returns {Promise<void>} Resolves after the commit attempt.
 */
export async function commitCleanState(isDryRun, isGitRepo) {
  if (!isGitRepo) {
    console.log(pc.dim('\nSkipping Git commit (not a git repository).'))
    return
  }

  if (isDryRun) {
    console.log(pc.dim('Dry run: would commit clean slate to Git'))
    return
  }

  console.log(pc.cyan('\nCommitting clean slate to Git...'))
  try {
    execSync('git add .', { stdio: 'ignore' })
    execSync('git commit -m "chore: scaffold clean boilerplate"', {
      stdio: 'ignore',
    })
    console.log(pc.green('✔ Successfully committed clean boilerplate state.'))
  } catch {
    console.log(
      pc.yellow('Git commit failed (maybe no changes or nothing to commit).')
    )
  }
}

/**
 * @param {boolean} isDryRun - True when the run was only simulated.
 * @param {string} rawProjectName - Final project name shown to the user.
 * @returns {void}
 */
export function logCompletion(isDryRun, rawProjectName) {
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

const initTemplateOpsApi = {
  commitCleanState,
  createGitBackupBranch,
  ensureEnvFile,
  logCompletion,
  purgeShowcaseFiles,
  pruneComponentsDocumentation,
  updateWorkspaceSettings,
}

export default initTemplateOpsApi
