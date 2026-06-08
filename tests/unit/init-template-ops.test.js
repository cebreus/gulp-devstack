import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { describe, it } from 'node:test'

import {
  discoverProjectSymlinks,
  getDeletePatterns,
  pruneGeminiMemoryReferences,
} from '../../scripts/init-template-ops.js'

describe('init-template file purge policy', () => {
  it('should preserve baseline e2e tests in the generated project', () => {
    const deletePatterns = getDeletePatterns()

    assert.ok(deletePatterns.includes('!tests/e2e'))
    assert.ok(deletePatterns.includes('!tests/e2e/**/*'))
    assert.ok(deletePatterns.includes('!tests/test-helpers.js'))
  })

  it('should purge non-e2e framework test suites from the generated project', () => {
    const deletePatterns = getDeletePatterns()

    assert.ok(deletePatterns.includes('tests/unit/**/*'))
    assert.ok(deletePatterns.includes('tests/integration/**/*'))
    assert.ok(deletePatterns.includes('tests/visual/**/*'))
    assert.ok(deletePatterns.includes('tests/fixtures/**/*'))
    assert.ok(deletePatterns.includes('tests/smoke/**/*'))
  })

  it('should purge agent memory files from the generated project', () => {
    const deletePatterns = getDeletePatterns()

    assert.ok(deletePatterns.includes('memories'))
    assert.ok(deletePatterns.includes('memories/**/*'))
  })

  it('should remove memories workflow and gotcha references from GEMINI.md', () => {
    const input = `# GEMINI

## Workflow

1. Read files.
2. If the task touches architecture, build pipeline, dependencies, or tricky logic, read the relevant file in \`memories/\`.
3. Run tests.

## Gotchas

- For Architectural-related constraints, read memories/architectural-gotchas.md
- For Build Pipeline-related constraints, read memories/build-pipeline-gotchas.md
`

    const output = pruneGeminiMemoryReferences(input)

    assert.equal(output.includes('memories/'), false)
    assert.equal(output.includes('## Gotchas'), false)
    assert.ok(output.includes('1. Read files.'))
    assert.ok(output.includes('3. Run tests.'))
  })

  it('should discover project symlinks without traversing dependency directories', async () => {
    const sandboxPath = await fs.mkdtemp(
      path.join(os.tmpdir(), 'init-template-symlinks-')
    )

    try {
      await fs.writeFile(path.join(sandboxPath, 'target.md'), 'target')
      await fs.symlink('target.md', path.join(sandboxPath, 'AGENTS.md'))
      await fs.mkdir(path.join(sandboxPath, 'node_modules/.bin'), {
        recursive: true,
      })
      await fs.symlink(
        '../target.md',
        path.join(sandboxPath, 'node_modules/.bin/tool')
      )

      const symlinks = await discoverProjectSymlinks(sandboxPath)

      assert.deepStrictEqual(symlinks, ['AGENTS.md'])
    } finally {
      await fs.rm(sandboxPath, { recursive: true, force: true })
    }
  })
})
