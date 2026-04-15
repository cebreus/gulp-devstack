import { execSync } from 'node:child_process'
import fs from 'node:fs/promises'
import { deleteAsync } from 'del'
import pc from 'picocolors'
import prompts from 'prompts'

/**
 * Generates a clean HTML layout for the new project.
 * @returns {Promise<string>} The HTML layout template.
 */
async function generateCleanLayout() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{ page.title | default('New Project') }}</title>
    <!-- inject:css --><!-- endinject -->
</head>
<body data-bs-theme="light">
    <main class="container py-5">
        {% block content %}{% endblock %}
    </main>
    <!-- inject:js --><!-- endinject -->
</body>
</html>`
}

/**
 * Generates a clean index page for the new project.
 * @returns {Promise<string>} The Nunjucks index template.
 */
async function generateCleanIndex() {
  return `---
title: Welcome to Blank Template
---
{% extends "layout-default.njk" %}
{% block content %}
    <div class="row">
        <div class="col-12 text-center">
            <h1 class="display-4 border-bottom pb-4 mb-4">It works!</h1>
            <p class="lead">Gulp Devstack has been successfully initialized into a pristine template.</p>
            <p>You can now start building your custom SCSS and Nunjucks templates without any bloat.</p>
        </div>
    </div>
{% endblock %}`
}

/**
 * Generates a clean 404 page for the new project.
 * @returns {Promise<string>} The Nunjucks 404 template.
 */
async function generateClean404() {
  return `---
title: 404 - Page Not Found
seo:
  robots: noindex, follow
---
{% extends "layout-default.njk" %}
{% block content %}
    <div class="text-center py-5">
        <h1 class="display-1">404</h1>
        <p class="lead">The page you are looking for does not exist.</p>
        <a href="/" class="btn btn-primary mt-3">Back to Home</a>
    </div>
{% endblock %}`
}

/**
 * Generates a clean main SCSS file for the new project.
 * @returns {Promise<string>} The SCSS template.
 */
async function generateCleanScss() {
  return `@import 'globals';
@import 'utils';
@import 'bootstrap.scss';

// Add your custom variables and SCSS logic here
`
}

/**
 * Generates a clean site configuration for the new project.
 * @returns {Promise<string>} The site config template.
 */
async function generateCleanSiteConfig() {
  return `export const siteDefaults = {
  title: 'New Project',
  description: 'Project created with Gulp DevStack',
  version: '1.0.0',
  author: 'Author Name',
  baseUrl: process.env.SITE_BASE_URL || 'http://localhost:3000',
  meta: {
    lang: 'en',
    charset: 'utf-8',
  },
  seo: {
    title: 'New Project SEO Title',
    description: 'New Project SEO Description',
    robots: 'index,follow',
    include_to_sitemap: true,
  },
  open_graph: {
    use: true,
    type: 'website',
    site_name: 'New Project',
  },
  twitter_cards: {
    use: false,
  },
}
`
}

/**
 * Generates a clean main JS file for the new project.
 * @returns {Promise<string>} The JS template.
 */
async function generateCleanJs() {
  return `/**
 * Binds DOM event handlers for the main app runtime.
 * @returns {void}
 */
function bindEvents() {
  // Add event listeners here.
}

/**
 * Initializes the main frontend runtime.
 * @returns {void}
 */
function initializeApp() {
  bindEvents()
}

document.addEventListener('DOMContentLoaded', initializeApp)
`
}

/**
 * Main execution function for the initialization script.
 * @returns {Promise<void>}
 */
async function run() {
  const isDryRun = process.argv.includes('--dry-run')
  if (isDryRun) {
    console.log(
      pc.yellow('! Running in DRY RUN mode. No files will be changed.\n')
    )
  }

  // 0. Early Validation: Check package.json before doing anything
  let pkg
  try {
    const pkgRaw = await fs.readFile('package.json', 'utf-8')
    pkg = JSON.parse(pkgRaw)
  } catch (e) {
    console.error(
      pc.red('✖ Error: package.json is missing or malformed. Cannot proceed.')
    )
    process.exit(1)
  }

  const response = await prompts([
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
      type: (prev, values) => (values.confirm ? 'text' : null),
      name: 'projectName',
      message: 'Enter the new project name:',
      initial: 'my-new-project',
      format: (val) => val.trim(),
      validate: (val) =>
        val.trim().length > 0 || 'Project name cannot be empty',
    },
    {
      type: (prev, values) => (values.confirm ? 'text' : null),
      name: 'author',
      message: 'Enter Author name:',
      initial: pkg.author || '',
    },
    {
      type: (prev, values) => (values.confirm ? 'text' : null),
      name: 'license',
      message: 'Enter License (leave empty for none):',
      initial: pkg.license || 'MIT',
    },
    {
      type: (prev, values) => (values.confirm ? 'text' : null),
      name: 'siteUrl',
      message: 'Enter Production Site URL:',
      initial: 'https://example.com',
    },
  ])

  if (!response.confirm) {
    console.log(pc.yellow('Canceled.'))
    process.exit(0)
  }

  const rawProjectName = response.projectName || 'my-new-project'
  const author = response.author || ''
  const license = response.license // Allow empty
  const siteUrl = response.siteUrl || 'https://example.com'

  // Sanitize for NPM package name (remove special chars, lowercase, replace spaces with hyphens)
  const safePkgName =
    rawProjectName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'my-new-project'

  // 0.5. Git Backup Branch
  const isGitRepo = await fs
    .access('.git')
    .then(() => true)
    .catch(() => false)
  if (isGitRepo && !isDryRun) {
    try {
      const backupBranch = `backup/showcase-${Date.now()}`
      console.log(pc.cyan(`Creating backup branch: ${backupBranch}...`))
      execSync(`git checkout -b ${backupBranch}`, { stdio: 'ignore' })
      execSync('git checkout -', { stdio: 'ignore' }) // Switch back
      console.log(pc.green(`✔ Backup branch created.`))
    } catch (e) {
      console.log(pc.yellow('! Git backup branch failed, continuing anyway.'))
    }
  }

  console.log(pc.cyan('\nStarting Deep Scaffold Purge...'))

  // 1. Delete showcase UI assets and components
  const deletePatterns = [
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
    '.github/workflows/deploy.yml', // Remove specific showcase deployment
    'CHANGELOG.md',
    'TODO.md',
  ]

  if (isDryRun) {
    console.log(pc.dim('Dry run: would delete files matching:'), deletePatterns)
  } else {
    const deletedFiles = await deleteAsync(deletePatterns)
    console.log(
      pc.dim(`Deleted ${deletedFiles.length} showcase files and directories.`)
    )
  }

  // 2. Clear out core files to prevent Nunjucks errors and provide clean start
  const filesToReset = [
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
      content: (await generateCleanSiteConfig())
        .replace(/New Project/g, () => rawProjectName)
        .replace(/Author Name/g, () => author)
        .replace(/http:\/\/localhost:3000/g, () => siteUrl),
    },
  ]

  for (const file of filesToReset) {
    if (isDryRun) {
      console.log(pc.dim(`Dry run: would reset ${file.path}`))
    } else {
      await fs.writeFile(file.path, file.content, 'utf-8')
    }
  }

  console.log(
    pc.green(
      '✔ Core boilerplate files (layout, index, scss, js, site.js) reset.'
    )
  )

  // 3. Update package.json
  try {
    // Reset metadata
    pkg.name = safePkgName
    pkg.version = '1.0.0'
    pkg.description = `A new project: ${rawProjectName}`
    pkg.author = author

    if (license) {
      pkg.license = license
    } else {
      delete pkg.license // Fully remove license field if empty
    }
    delete pkg.homepage
    delete pkg.repository
    delete pkg.bugs

    if (pkg.scripts && pkg.scripts['init:template']) {
      delete pkg.scripts['init:template']
    }

    if (isDryRun) {
      console.log(
        pc.dim('Dry run: would update package.json with new metadata')
      )
    } else {
      await fs.writeFile(
        'package.json',
        JSON.stringify(pkg, null, '\t') + '\n',
        'utf-8'
      )
      console.log(
        pc.green('✔ Updated package.json metadata and removed init script.')
      )
    }
  } catch (e) {
    console.log(pc.red('Failed to update package.json'), e)
  }

  // 4. Update VSCode Workspace
  try {
    const workspacePath = 'gulp-dev-stack.code-workspace'
    if (
      await fs
        .access(workspacePath)
        .then(() => true)
        .catch(() => false)
    ) {
      if (isDryRun) {
        console.log(
          pc.dim(`Dry run: would update VSCode workspace: ${workspacePath}`)
        )
      } else {
        let wsRaw = await fs.readFile(workspacePath, 'utf-8')
        wsRaw = wsRaw.replace(
          /"peacock.color": "#0a1d39"/g,
          '"peacock.color": "#333333"'
        )
        await fs.writeFile(workspacePath, wsRaw, 'utf-8')
        console.log(pc.green('✔ Updated VSCode workspace settings.'))
      }
    }
  } catch (e) {
    console.log(pc.dim('VSCode workspace update skipped or failed.'))
  }

  // 5. Handle .env file
  try {
    if (
      await fs
        .access('.env.example')
        .then(() => true)
        .catch(() => false)
    ) {
      if (isDryRun) {
        console.log(pc.dim('Dry run: would create .env from .env.example'))
      } else {
        let envContent = await fs.readFile('.env.example', 'utf-8')
        envContent = envContent.replace(
          /SITE_BASE_URL=.*/,
          `SITE_BASE_URL=${siteUrl}`
        )
        await fs.writeFile('.env', envContent, 'utf-8')
        console.log(
          pc.green('✔ Created .env file and populated with site URL.')
        )
      }
    }
  } catch (e) {
    console.log(pc.dim('.env creation failed or skipped.'))
  }

  // 6. Reset COMPONENTS.md documentation
  try {
    const docsPath = 'docs/COMPONENTS.md'
    const currentDocs = await fs.readFile(docsPath, 'utf-8')
    const marker = '## Component List'
    const markerIndex = currentDocs.indexOf(marker)

    let prunedDoc = ''
    if (markerIndex !== -1) {
      // Keep everything up to the marker
      prunedDoc = currentDocs.substring(0, markerIndex + marker.length) + '\n\n'
    } else {
      // Fallback if marker is missing
      prunedDoc = `# Component Architecture & Strategy\n\n## Component List\n\n`
    }

    if (isDryRun) {
      console.log(pc.dim(`Dry run: would prune ${docsPath}`))
    } else {
      await fs.writeFile(docsPath, prunedDoc, 'utf-8')
      console.log(
        pc.green(
          '✔ Documentation (COMPONENTS.md) pruned, instructions preserved.'
        )
      )
    }
  } catch (e) {
    console.log(pc.yellow('! Failed to prune COMPONENTS.md, skipping.'))
  }

  // 7. Delete the script itself
  if (isDryRun) {
    console.log(pc.dim('Dry run: would delete scripts/init-template.js'))
  } else {
    await deleteAsync(['scripts/init-template.js'])
    console.log(
      pc.green('✔ Script execution completed and script self-destructed.')
    )
  }

  // 8. Commit the clean state
  if (isGitRepo) {
    if (isDryRun) {
      console.log(pc.dim('Dry run: would commit clean slate to Git'))
    } else {
      console.log(pc.cyan('\nCommitting clean slate to Git...'))
      try {
        execSync('git add .', { stdio: 'ignore' })
        execSync('git commit -m "chore: scaffold clean boilerplate"', {
          stdio: 'ignore',
        })
        console.log(
          pc.green('✔ Successfully committed clean boilerplate state.')
        )
      } catch (e) {
        console.log(
          pc.yellow(
            'Git commit failed (maybe no changes or nothing to commit).'
          )
        )
      }
    }
  } else {
    console.log(pc.dim('\nSkipping Git commit (not a git repository).'))
  }

  if (isDryRun) {
    console.log(pc.yellow('\nDry run complete. No changes were made.'))
  } else {
    console.log(
      pc.bgGreen(
        pc.black(
          `\n Initialization Complete! Project "${rawProjectName}" is ready! \n`
        )
      )
    )
  }
}

run().catch(console.error)
