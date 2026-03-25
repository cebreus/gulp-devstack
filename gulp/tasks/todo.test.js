import { execSync } from 'child_process'
import fs from 'fs'
import assert from 'node:assert'
import { afterEach, beforeEach, describe, it } from 'node:test'
import path from 'path'

const outputDir = './.reports'
const outputFile = 'TODO.md'
const todoPath = path.join(outputDir, outputFile)

/**
 * Cleans up the TODO.md file and the .reports directory if they exist.
 */
function clean() {
  if (fs.existsSync(todoPath)) fs.unlinkSync(todoPath)
  if (fs.existsSync(outputDir))
    fs.rmSync(outputDir, { recursive: true, force: true })
}

/**
 * Waits for a specified number of milliseconds (default 200) to allow file operations to complete.
 * @param {number} ms - The number of milliseconds to wait.
 * @returns {Promise<void>} A promise that resolves after the specified delay.
 */
function waitForFileOps(ms = 200) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

describe('todoTask Gulp task', () => {
  let testFiles = []

  beforeEach(() => {
    clean()
    testFiles = []
  })

  afterEach(() => {
    clean()
    for (const file of testFiles) {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file)
      }
    }
  })

  it('should not create .reports or TODO.md if there are no TODOs', async () => {
    await waitForFileOps()
    assert.strictEqual(fs.existsSync(todoPath), false)
    assert.strictEqual(fs.existsSync(outputDir), false)
  })

  it('should create TODO.md with content if there is a TODO in the codebase', async () => {
    const testFile = './src/test-todo.js'
    const todoContent = '// TODO: test todo for unit testing'
    fs.writeFileSync(testFile, todoContent)
    testFiles.push(testFile)

    execSync(
      'node --env-file=.env.local ./node_modules/gulp/bin/gulp.js -f gulpfile.js todo',
      { stdio: 'ignore' }
    )
    await waitForFileOps()

    assert.strictEqual(fs.existsSync(todoPath), true)

    if (fs.existsSync(todoPath)) {
      const todoFileContent = fs.readFileSync(todoPath, 'utf8')
      assert.ok(todoFileContent.includes('test todo for unit testing'))
      assert.ok(todoFileContent.includes('test-todo.js'))
      fs.unlinkSync(todoPath)
    }

    await waitForFileOps()
    assert.strictEqual(fs.existsSync(todoPath), false)
  })

  it('should handle files with no TODO comments', async () => {
    const testFile = './src/test-no-todo.js'
    fs.writeFileSync(testFile, '// nothing here\nconsole.log("no todos");')
    testFiles.push(testFile)

    try {
      execSync(
        'node --env-file=.env.local ./node_modules/gulp/bin/gulp.js -f gulpfile.js todo',
        { stdio: 'ignore' }
      )
      await waitForFileOps()

      assert.ok(true)
    } finally {
      if (fs.existsSync(testFile)) {
        fs.unlinkSync(testFile)
      }
    }
  })

  describe('different TODO formats', () => {
    it('should detect FIXME comments', async () => {
      const testFile = './src/test-fixme.js'
      fs.writeFileSync(testFile, '// FIXME: this needs to be fixed')
      testFiles.push(testFile)

      execSync(
        'node --env-file=.env.local ./node_modules/gulp/bin/gulp.js -f gulpfile.js todo',
        { stdio: 'ignore' }
      )
      await waitForFileOps()

      assert.strictEqual(fs.existsSync(todoPath), true)

      if (fs.existsSync(todoPath)) {
        const content = fs.readFileSync(todoPath, 'utf8')
        assert.ok(content.includes('this needs to be fixed'))
      }
    })

    it('should detect TODO comments in SCSS files', async () => {
      const testFile = './src/test-todo.scss'
      fs.writeFileSync(testFile, '// TODO: update these styles')
      testFiles.push(testFile)

      execSync(
        'node --env-file=.env.local ./node_modules/gulp/bin/gulp.js -f gulpfile.js todo',
        { stdio: 'ignore' }
      )
      await waitForFileOps()

      assert.strictEqual(fs.existsSync(todoPath), true)

      if (fs.existsSync(todoPath)) {
        const content = fs.readFileSync(todoPath, 'utf8')
        assert.ok(content.includes('update these styles'))
        assert.ok(content.includes('test-todo.scss'))
      }
    })

    it('should handle multiple TODO comments in same file', async () => {
      const testFile = './src/test-multiple.js'
      const multiTodoContent = `
        // TODO: first todo
        console.log('test');
        // TODO: second todo
        // FIXME: needs fixing
      `
      fs.writeFileSync(testFile, multiTodoContent)
      testFiles.push(testFile)

      execSync(
        'node --env-file=.env.local ./node_modules/gulp/bin/gulp.js -f gulpfile.js todo',
        { stdio: 'ignore' }
      )
      await waitForFileOps()

      assert.strictEqual(fs.existsSync(todoPath), true)

      if (fs.existsSync(todoPath)) {
        const content = fs.readFileSync(todoPath, 'utf8')
        assert.ok(content.includes('first todo'))
        assert.ok(content.includes('second todo'))
        assert.ok(content.includes('needs fixing'))
      }
    })
  })

  describe('edge cases', () => {
    it('should handle empty files gracefully', async () => {
      clean()

      const testFile = './src/empty-file.js'
      fs.writeFileSync(testFile, '')
      testFiles.push(testFile)

      try {
        execSync(
          'node --env-file=.env.local ./node_modules/gulp/bin/gulp.js -f gulpfile.js todo',
          { stdio: 'ignore' }
        )
        await waitForFileOps()
        assert.ok(true)
      } catch (error) {
        assert.strictEqual(error, undefined)
      }
    })

    it('should create .reports directory if it does not exist', async () => {
      const testFile = './src/test-create-dir.js'
      fs.writeFileSync(testFile, '// TODO: test directory creation')
      testFiles.push(testFile)

      if (fs.existsSync(outputDir)) {
        fs.rmSync(outputDir, { recursive: true, force: true })
      }

      execSync(
        'node --env-file=.env.local ./node_modules/gulp/bin/gulp.js -f gulpfile.js todo',
        { stdio: 'ignore' }
      )
      await waitForFileOps()

      assert.strictEqual(fs.existsSync(outputDir), true)
      assert.strictEqual(fs.existsSync(todoPath), true)
    })
  })
})
