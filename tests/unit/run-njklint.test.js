import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { filterNjkLintOutput, isDirectRun } from '../../scripts/run-njklint.js'

describe('run-njklint', () => {
  it('should remove noisy directory and file banner lines', () => {
    const output = [
      'Linting directory: /repo/src',
      'Linting file: /repo/src/index.njk',
      'No errors found! 🎉',
      'Found 1 issue(s):',
    ].join('\n')

    assert.strictEqual(
      filterNjkLintOutput(output),
      ['No errors found! 🎉', 'Found 1 issue(s):'].join('\n')
    )
  })

  it('should preserve unrelated output exactly', () => {
    const output = 'Fixed issues in src/index.njk\nNo errors found! 🎉'

    assert.strictEqual(filterNjkLintOutput(output), output)
  })

  it('should compare direct-run paths after URL and argv normalization', () => {
    const repoPath = process.platform === 'win32' ? 'C:\\repo' : '/repo'
    const scriptPath =
      repoPath +
      (process.platform === 'win32'
        ? '\\scripts\\run-njklint.js'
        : '/scripts/run-njklint.js')
    const moduleUrl =
      'file://' +
      (process.platform === 'win32'
        ? '/' + scriptPath.replace(/\\/g, '/')
        : scriptPath)

    assert.equal(isDirectRun(moduleUrl, scriptPath), true)
    assert.equal(
      isDirectRun(
        moduleUrl,
        repoPath + (process.platform === 'win32' ? '\\other.js' : '/other.js')
      ),
      false
    )
  })
})
