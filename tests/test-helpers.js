import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

export async function createTestSandbox(prefix = 'test-run') {
  const rootDir = path.join(process.cwd(), 'tests/.sandboxes')
  if (!fs.existsSync(rootDir)) {
    await fs.promises.mkdir(rootDir, { recursive: true })
  }

  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000)
  const tempDir = path.join(rootDir, `${prefix}-${timestamp}-${random}`)

  await fs.promises.mkdir(tempDir, { recursive: true })
  return tempDir
}

export async function cleanupSandbox(sandboxPath) {
  if (!sandboxPath || sandboxPath === '/') {
    return
  }

  const nodeModulesPath = path.join(sandboxPath, 'node_modules')

  try {
    const stats = await fs.promises.lstat(nodeModulesPath)
    if (stats.isSymbolicLink()) {
      await fs.promises.unlink(nodeModulesPath)
    }
  } catch {}

  try {
    await fs.promises.rm(sandboxPath, { recursive: true, force: true })
  } catch (error) {
    if (error.code !== 'ENOTEMPTY') {
      throw error
    }

    await fs.promises.rm(sandboxPath, { recursive: true, force: true })
  }
}

export async function runInSandbox(prefix, testFunction) {
  const sandboxPath = await createTestSandbox(prefix)
  try {
    await testFunction(sandboxPath)
  } finally {
    await cleanupSandbox(sandboxPath)
  }
}

export function createMockEnvironment(overrides = {}) {
  return {
    BUILD_MODE: 'dev',
    SITE_BASE_URL: 'http://localhost:3000',
    ...overrides,
  }
}

export async function writeFixtures(sandboxPath, files) {
  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = path.join(sandboxPath, filePath)
    await fs.promises.mkdir(path.dirname(fullPath), { recursive: true })
    await fs.promises.writeFile(fullPath, content)
  }
}

export async function linkNodeModulesIntoSandbox(sandboxPath) {
  const linkType = process.platform === 'win32' ? 'junction' : 'dir'

  try {
    await fs.promises.symlink(
      path.resolve('node_modules'),
      path.join(sandboxPath, 'node_modules'),
      linkType
    )
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error
    }
  }
}

export function silenceConsole(beforeEachFn, afterEachFn, mockObj) {
  let mockLog
  beforeEachFn(() => {
    mockLog = mockObj.method(console, 'log', () => {})
  })
  afterEachFn(() => {
    mockLog.mock.restore()
  })
}
