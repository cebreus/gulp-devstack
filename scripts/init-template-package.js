const DEFAULT_VERSION = '1.0.0'
const DEVSTACK_TEST_DEV_DEPENDENCIES = [
  '@size-limit/preset-big-lib',
  'size-limit',
]

/**
 * Mutates package metadata for the generated boilerplate project.
 * @param {object} pkg - Parsed package metadata.
 * @param {object} options - Package metadata overrides.
 * @param {string} options.safePkgName - npm-safe package name.
 * @param {string} options.rawProjectName - Human-readable project name.
 * @param {string} options.author - Package author.
 * @param {string} options.license - Package license.
 * @returns {void}
 */
export function mutatePackageObject(pkg, options) {
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

  removeDevstackScripts(pkg.scripts)
  removeDevstackDevDependencies(pkg.devDependencies)
}

function removeDevstackScripts(scripts) {
  if (!scripts) {
    return
  }

  delete scripts['init:template']
  delete scripts['test:unit']
  delete scripts['test:integration']
  delete scripts['test:smoke']
  delete scripts['test:visual']
  delete scripts['test:coverage']
  delete scripts['test:ci']
  delete scripts['verify:pipeline']
  delete scripts['sanity:budget']

  scripts.test =
    'cross-env NODE_ENV=test node --test --test-concurrency=1 tests/e2e/**/*.test.js'
  scripts['test:e2e'] = scripts.test
  scripts['test:prod'] = 'cross-env BUILD_MODE=build pnpm run test:e2e'
  scripts['test:export'] = 'cross-env BUILD_MODE=export pnpm run test:e2e'
}

function removeDevstackDevDependencies(devDependencies) {
  if (!devDependencies) {
    return
  }

  for (const dependencyName of DEVSTACK_TEST_DEV_DEPENDENCIES) {
    delete devDependencies[dependencyName]
  }
}
