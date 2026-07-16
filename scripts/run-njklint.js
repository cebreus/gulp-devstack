import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)

/**
 * Removes noisy informational njklint banner lines while preserving real lint output.
 * @param {string} output - Raw stdout/stderr captured from the njklint CLI.
 * @returns {string} Filtered output with banner lines removed.
 */
export function filterNjkLintOutput(output) {
  return output
    .split('\n')
    .filter((line) => {
      return (
        !line.startsWith('Linting directory: ') &&
        !line.startsWith('Linting file: ')
      )
    })
    .join('\n')
}

function resolveNjkLintCliPath() {
  const packageJsonPath = require.resolve('nunjucklinter/package.json')
  const packageDir = path.dirname(packageJsonPath)
  return path.join(packageDir, 'dist/index.js')
}

function writeFilteredOutput(stream, text) {
  if (!text) {
    return
  }

  const filtered = filterNjkLintOutput(text)
  if (!filtered) {
    return
  }

  stream.write(filtered)
  if (!filtered.endsWith('\n')) {
    stream.write('\n')
  }
}

function main() {
  const cliPath = resolveNjkLintCliPath()
  const result = spawnSync(
    process.execPath,
    [cliPath, ...process.argv.slice(2)],
    {
      encoding: 'utf8',
      stdio: ['inherit', 'pipe', 'pipe'],
    }
  )

  writeFilteredOutput(process.stdout, result.stdout)
  writeFilteredOutput(process.stderr, result.stderr)

  if (result.error) {
    throw result.error
  }

  process.exitCode = result.status ?? 1
}

/**
 * Checks whether this module is the direct CLI entrypoint.
 * @param {string} moduleUrl - Current module URL.
 * @param {string|undefined} argvPath - Script path from process arguments.
 * @returns {boolean} True when the module path and argv path match.
 */
export function isDirectRun(moduleUrl, argvPath) {
  if (!argvPath) {
    return false
  }

  const modulePath = fileURLToPath(moduleUrl)
  const scriptPath = path.resolve(argvPath)

  if (process.platform === 'win32') {
    return modulePath.toLowerCase() === scriptPath.toLowerCase()
  }

  return modulePath === scriptPath
}

if (isDirectRun(import.meta.url, process.argv[1])) {
  main()
}
