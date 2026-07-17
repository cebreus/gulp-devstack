import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

export async function createTestSandbox(prefix = 'test-run') {
  const rootDir = path.join(process.cwd(), 'tests/.sandboxes')
  if (!fs.existsSync(rootDir)) {
    await fs.promises.mkdir(rootDir, { recursive: true })
  }

  const safePrefix = String(prefix).replace(/[^a-zA-Z0-9_-]/g, '-')
  const tempDir = await fs.promises.mkdtemp(
    path.join(rootDir, `${safePrefix}-`)
  )
  return tempDir
}

export async function cleanupSandbox(sandboxPath) {
  const rootDir = path.resolve(process.cwd(), 'tests/.sandboxes')
  const resolvedSandboxPath = path.resolve(sandboxPath)
  const relativePath = path.relative(rootDir, resolvedSandboxPath)

  if (
    !relativePath ||
    relativePath === '..' ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath)
  ) {
    throw new Error(`Refusing to clean invalid sandbox: ${sandboxPath}`)
  }

  let sandboxStats
  try {
    sandboxStats = await fs.promises.lstat(resolvedSandboxPath)
  } catch (error) {
    if (error.code === 'ENOENT') {
      return
    }
    throw error
  }

  if (!sandboxStats.isDirectory() || sandboxStats.isSymbolicLink()) {
    throw new Error(`Refusing to clean invalid sandbox: ${sandboxPath}`)
  }

  const nodeModulesPath = path.join(resolvedSandboxPath, 'node_modules')

  try {
    const stats = await fs.promises.lstat(nodeModulesPath)
    if (stats.isSymbolicLink()) {
      await fs.promises.unlink(nodeModulesPath)
    }
  } catch {}

  await fs.promises.rm(resolvedSandboxPath, {
    recursive: true,
    force: true,
    maxRetries: 3,
    retryDelay: 100,
  })
}

export async function runInSandbox(prefix, testFunction) {
  const sandboxPath = await createTestSandbox(prefix)
  let testError
  try {
    await testFunction(sandboxPath)
  } catch (error) {
    testError = error
    throw error
  } finally {
    try {
      await cleanupSandbox(sandboxPath)
    } catch (cleanupError) {
      if (testError) {
        throw new AggregateError(
          [testError, cleanupError],
          'Test and sandbox cleanup both failed'
        )
      }
      throw cleanupError
    }
  }
}

export function createMockEnvironment(overrides = {}) {
  return {
    BUILD_MODE: 'dev',
    SITE_BASE_URL: 'http://localhost:3000',
    ...overrides,
  }
}

export function toGlobPath(...segments) {
  return path.join(...segments).replace(/\\/g, '/')
}

export async function writeFixtures(sandboxPath, files) {
  for (const [filePath, content] of Object.entries(files)) {
    const resolvedSandboxPath = path.resolve(sandboxPath)
    const fullPath = path.resolve(resolvedSandboxPath, filePath)
    const relativePath = path.relative(resolvedSandboxPath, fullPath)
    if (
      relativePath === '..' ||
      relativePath.startsWith(`..${path.sep}`) ||
      path.isAbsolute(relativePath)
    ) {
      throw new Error(`Fixture path escapes sandbox: ${filePath}`)
    }

    let currentPath = resolvedSandboxPath
    for (const segment of relativePath.split(path.sep).slice(0, -1)) {
      currentPath = path.join(currentPath, segment)
      try {
        const stats = await fs.promises.lstat(currentPath)
        if (stats.isSymbolicLink() || !stats.isDirectory()) {
          throw new Error(`Unsafe fixture path component: ${filePath}`)
        }
      } catch (error) {
        if (error.code === 'ENOENT') {
          break
        }
        throw error
      }
    }

    await fs.promises.mkdir(path.dirname(fullPath), { recursive: true })
    try {
      const stats = await fs.promises.lstat(fullPath)
      if (stats.isSymbolicLink()) {
        throw new Error(`Unsafe fixture path target: ${filePath}`)
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error
      }
    }
    await fs.promises.writeFile(fullPath, content)
  }
}

export async function linkNodeModulesIntoSandbox(sandboxPath) {
  const linkType = process.platform === 'win32' ? 'junction' : 'dir'
  const targetPath = path.resolve('node_modules')
  const linkPath = path.join(sandboxPath, 'node_modules')

  try {
    await fs.promises.symlink(targetPath, linkPath, linkType)
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error
    }

    const [existingTarget, expectedTarget] = await Promise.all([
      fs.promises.realpath(linkPath),
      fs.promises.realpath(targetPath),
    ])
    if (existingTarget !== expectedTarget) {
      throw new Error(`Unexpected node_modules entry: ${linkPath}`)
    }
  }
}

export function silenceConsole(beforeEachFn, afterEachFn, mockObj) {
  const mockLog = Symbol('mockLog')
  beforeEachFn((context) => {
    context[mockLog] = mockObj.method(console, 'log', () => {})
  })
  afterEachFn((context) => {
    context[mockLog]?.mock.restore()
  })
}
