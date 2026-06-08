import fs from 'node:fs/promises'
import pc from 'picocolors'
import prompts from 'prompts'

import {
  generateClean404,
  generateCleanIndex,
  generateCleanJs,
  generateCleanLayout,
  generateCleanScss,
  generateCleanSiteConfig,
} from './init-template-content.js'
import {
  commitCleanState,
  createGitBackupBranch,
  ensureEnvFile,
  logCompletion,
  pruneComponentsDocumentation,
  purgeShowcaseFiles,
  updateWorkspaceSettings,
} from './init-template-ops.js'

const DEFAULT_PROJECT_NAME = 'my-new-project'
const DEFAULT_SITE_URL = 'https://example.com'
const DEFAULT_VERSION = '1.0.0'
const WORKSPACE_PATH = 'gulp-dev-stack.code-workspace'
const COMPONENTS_DOC_PATH = 'docs/COMPONENTS.md'

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

async function buildFilesToReset({ rawProjectName, author, siteUrl }) {
  return [
    {
      path: 'src/routes/layout-default.njk',
      content: await generateCleanLayout(),
    },
    { path: 'src/routes/index.njk', content: await generateCleanIndex() },
    { path: 'src/routes/404.njk', content: await generateClean404() },
    { path: 'src/scss/custom.scss', content: await generateCleanScss() },
    { path: 'src/js/main.js', content: await generateCleanJs() },
    { path: 'src/js/custom.js', content: '' },
    {
      path: 'src/config/site.js',
      content: await generateCleanSiteConfig({
        projectName: rawProjectName,
        author,
        siteUrl,
      }),
    },
  ]
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

function mutatePackageObject(pkg, options) {
  const { safePkgName, rawProjectName, author, license } = options

  pkg.name = safePkgName
  pkg.version = DEFAULT_VERSION
  pkg.description = `A new project: ${rawProjectName}`
  pkg.author = author

  if (license) {
    pkg.license = license
  } else {
    delete pkg.license
  }

  delete pkg.homepage
  delete pkg.repository
  delete pkg.bugs

  if (pkg.scripts && pkg.scripts['init:template']) {
    delete pkg.scripts['init:template']
  }
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
    isDryRun,
    isGitRepo,
    pkg,
    filesToReset,
    safePkgName,
    rawProjectName,
    author,
    license,
    siteUrl,
  } = options

  await createGitBackupBranch(isDryRun, isGitRepo)
  console.log(pc.cyan('\nStarting Deep Scaffold Purge...'))
  await purgeShowcaseFiles(isDryRun)
  await resetCoreFiles(isDryRun, filesToReset)
  await updatePackageMetadata(isDryRun, pkg, {
    safePkgName,
    rawProjectName,
    author,
    license,
  })
  await updateWorkspaceSettings(isDryRun, WORKSPACE_PATH, pathExists)
  await ensureEnvFile(isDryRun, siteUrl, pathExists)
  await pruneComponentsDocumentation(isDryRun, COMPONENTS_DOC_PATH)
  await commitCleanState(isDryRun, isGitRepo)
  logCompletion(isDryRun, rawProjectName)
}

async function run() {
  const isDryRun = process.argv.includes('--dry-run')
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
  const filesToReset = await buildFilesToReset({
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
  })
}

run().catch((error) => {
  console.error(error)
})
