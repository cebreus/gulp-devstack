import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

/**
 * Creates a unique temporary directory for testing.
 * @param {string} prefix - Prefix for the temp directory name
 * @returns {Promise<string>} The absolute path to the created directory
 */
export async function createTestSandbox(prefix = 'gulp-devstack-test-') {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), prefix))
  return tempDir
}

/**
 * Removes a temporary directory and all its contents.
 * @param {string} sandboxPath - Path to the sandbox directory
 * @returns {Promise<void>}
 */
export async function cleanupSandbox(sandboxPath) {
  if (!sandboxPath || sandboxPath === '/') return
  await fs.promises.rm(sandboxPath, { recursive: true, force: true })
}

/**
 * Creates a mock environment object for testing config/env logic.
 * @param {object} overrides - Key-value pairs to override in the mock env
 * @returns {object} The mock environment object
 */
export function mockEnv(overrides = {}) {
  return {
    BUILD_MODE: 'dev',
    SITE_BASE_URL: 'http://localhost:3000',
    ...overrides,
  }
}

/**
 * Helper to write fixture files to a sandbox.
 * @param {string} sandboxPath - Base sandbox path
 * @param {object} files - Map of relative paths to file contents
 * @returns {Promise<void>}
 */
export async function writeFixtures(sandboxPath, files) {
  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = path.join(sandboxPath, filePath)
    await fs.promises.mkdir(path.dirname(fullPath), { recursive: true })
    await fs.promises.writeFile(fullPath, content)
  }
}
