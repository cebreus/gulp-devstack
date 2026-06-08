import fs from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import pc from 'picocolors'
import prompts from 'prompts'

import buildFilesToReset from './init-template-files.js'
import initTemplateOps from './init-template-ops.js'
import { mutatePackageObject } from './init-template-package.js'

const DEFAULT_PROJECT_NAME = 'my-new-project'
const DEFAULT_SITE_URL = 'https://example.com'
const WORKSPACE_PATH = 'gulp-dev-stack.code-workspace'
const COMPONENTS_DOC_PATH = 'docs/COMPONENTS.md'
const GEMINI_PATH = 'GEMINI.md'

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath)
    return true
  } catch {
    return false
  }
}

async function loadPackageMetadata() {
  try {
    const pkgRaw = await fs.readFile('package.json', 'utf-8')
    return JSON.parse(pkgRaw)
  } catch {
    console.error(
      pc.red('✖ Error: package.json is missing or malformed. Cannot proceed.')
    )
    process.exit(1)
  }
}

async function promptForInitialization(pkg) {
  return prompts([
    {
      type: 'confirm',
      name: 'confirm',
      message: pc.bgRed(
        pc.white(
          ' Are you SURE you want to purge the showcase and init a blank template? '
        )
      ),
      initial: false,
    },
    {
      type: (_, values) => (values.confirm ? 'text' : null),
      name: 'projectName',
      message: 'Enter the new project name:',
      initial: DEFAULT_PROJECT_NAME,
      format: (val) => val.trim(),
      validate: (val) =>
        val.trim().length > 0 || 'Project name cannot be empty',
    },
    {
      type: (_, values) => (values.confirm ? 'text' : null),
      name: 'author',
      message: 'Enter Author name:',
      initial: pkg.author || '',
    },
    {
      type: (_, values) => (values.confirm ? 'text' : null),
      name: 'license',
      message: 'Enter License (leave empty for none):',
      initial: pkg.license || 'MIT',
    },
    {
      type: (_, values) => (values.confirm ? 'text' : null),
      name: 'siteUrl',
      message: 'Enter Production Site URL:',
      initial: DEFAULT_SITE_URL,
    },
  ])
}

function toSafePackageName(projectName) {
  return (
    projectName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || DEFAULT_PROJECT_NAME
  )
}

async function resetCoreFiles(isDryRun, filesToReset) {
  for (const file of filesToReset) {
    if (isDryRun) {
      console.log(pc.dim(`Dry run: would reset ${file.path}`))
      continue
    }

    await fs.writeFile(file.path, file.content, 'utf-8')
  }

  console.log(
    pc.green(
      '✔ Core boilerplate files (layout, index, scss, js, site.js) reset.'
    )
  )
}

function shouldCreateBackupBranch(args) {
  return args.includes('--backup-branch')
}

async function updatePackageMetadata(isDryRun, pkg, options) {
  try {
    mutatePackageObject(pkg, options)

    if (isDryRun) {
      console.log(
        pc.dim('Dry run: would update package.json with new metadata')
      )
      return
    }

    await fs.writeFile(
      'package.json',
      JSON.stringify(pkg, null, '\t') + '\n',
      'utf-8'
    )
    console.log(
      pc.green('✔ Updated package.json metadata and removed init script.')
    )
  } catch (error) {
    console.log(pc.red('Failed to update package.json'), error)
  }
}

function resolveInitializationOptions(response) {
  const rawProjectName = response.projectName || DEFAULT_PROJECT_NAME

  return {
    rawProjectName,
    author: response.author || '',
    license: response.license,
    siteUrl: response.siteUrl || DEFAULT_SITE_URL,
    safePkgName: toSafePackageName(rawProjectName),
  }
}

async function applyInitializationChanges(options) {
  const {
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
  } = initTemplateOps
  const {
    isDryRun,
    isGitRepo,
    pkg,
    filesToReset,
    safePkgName,
    rawProjectName,
    author,
    license,
    siteUrl,
    shouldBackupBranch,
  } = options

  if (shouldBackupBranch) {
    await createGitBackupBranch(isDryRun, isGitRepo)
  }
  console.log(pc.cyan('\nStarting Deep Scaffold Purge...'))
  await purgeShowcaseFiles(isDryRun)
  await purgeProjectSymlinks(isDryRun)
  await resetCoreFiles(isDryRun, filesToReset)
  await updatePackageMetadata(isDryRun, pkg, {
    safePkgName,
    rawProjectName,
    author,
    license,
  })
  await updateWorkspaceSettings(isDryRun, WORKSPACE_PATH, pathExists)
  await ensureEnvFile(isDryRun, siteUrl, pathExists)
  await pruneGeminiInstructions(isDryRun, GEMINI_PATH, pathExists)
  await pruneComponentsDocumentation(isDryRun, COMPONENTS_DOC_PATH)
  await commitCleanState(isDryRun, isGitRepo)
  await runPostInitScripts(isDryRun)
  logCompletion(isDryRun, rawProjectName)
}

async function run() {
  const isDryRun = process.argv.includes('--dry-run')
  const shouldBackupBranch = shouldCreateBackupBranch(process.argv.slice(2))
  if (isDryRun) {
    console.log(
      pc.yellow('! Running in DRY RUN mode. No files will be changed.\n')
    )
  }

  const pkg = await loadPackageMetadata()
  const response = await promptForInitialization(pkg)

  if (!response.confirm) {
    console.log(pc.yellow('Canceled.'))
    process.exit(0)
  }

  const { rawProjectName, author, license, siteUrl, safePkgName } =
    resolveInitializationOptions(response)
  const isGitRepo = await pathExists('.git')
  const filesToReset = buildFilesToReset({
    rawProjectName,
    author,
    siteUrl,
  })

  await applyInitializationChanges({
    isDryRun,
    isGitRepo,
    pkg,
    filesToReset,
    safePkgName,
    rawProjectName,
    author,
    license,
    siteUrl,
    shouldBackupBranch,
  })
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  run().catch((error) => {
    console.error(error)
  })
}
