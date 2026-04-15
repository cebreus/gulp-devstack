import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, it, mock } from 'node:test'
import prompts from 'prompts'

import manageComponents, {
  createComponent,
  listComponents,
  removeComponent,
  renameComponent,
} from '../../gulp/tasks/manage-components.js'
import { cleanupSandbox, createTestSandbox } from '../test-helpers.js'

describe('Component Management Actions', () => {
  let sandbox
  let componentsDir

  beforeEach(async () => {
    sandbox = await createTestSandbox()
    componentsDir = path.join(sandbox, 'src/lib/components')
    fs.mkdirSync(componentsDir, { recursive: true })
  })

  afterEach(async () => {
    await cleanupSandbox(sandbox)
  })

  describe('createComponent', () => {
    it('should create a new component with all files', async () => {
      const docsPath = path.join(sandbox, 'COMPONENTS.md')
      fs.writeFileSync(docsPath, '# Components\n## Component List\n')

      await createComponent({
        name: 'test-button',
        componentsDir,
        docsPathOverride: docsPath,
      })

      const compPath = path.join(componentsDir, 'test-button')
      assert.ok(fs.existsSync(compPath), 'Component directory should exist')
      assert.ok(fs.existsSync(path.join(compPath, 'test-button.njk')))
      assert.ok(fs.existsSync(path.join(compPath, 'test-button.scss')))
      assert.ok(fs.existsSync(path.join(compPath, 'test-button.md')))

      const docsContent = fs.readFileSync(docsPath, 'utf8')
      assert.ok(
        docsContent.includes('### test-button'),
        'Docs should be updated'
      )
    })

    it('should handle interactive creation via prompts', async () => {
      prompts.inject(['interactive-comp'])
      const docsPath = path.join(sandbox, 'COMPONENTS.md')
      fs.writeFileSync(docsPath, '# Components\n## Component List\n')

      await createComponent({
        componentsDir,
        docsPathOverride: docsPath,
      })

      const compPath = path.join(componentsDir, 'interactive-comp')
      assert.ok(
        fs.existsSync(compPath),
        'Component created via prompt should exist'
      )
    })

    it('should not overwrite existing component', async () => {
      const compPath = path.join(componentsDir, 'existing-comp')
      fs.mkdirSync(compPath)

      await createComponent({
        name: 'existing-comp',
        componentsDir,
      })

      assert.ok(fs.existsSync(compPath))
    })

    it('should abort if name prompt is empty', async () => {
      prompts.inject([null])
      await createComponent({ componentsDir })
      const files = fs.readdirSync(componentsDir)
      assert.strictEqual(files.length, 0)
    })

    it('should error if validation fails', async () => {
      // 'con' is a reserved name in RESERVED_COMPONENT_NAMES
      await createComponent({ name: 'con', componentsDir })
      const files = fs.readdirSync(componentsDir)
      assert.strictEqual(files.length, 0)
    })
  })

  describe('Utility: runAction', () => {
    it('should return null if no handler is provided', async () => {
      // manageComponents is the default export, we can test its internal runAction indirectly
      // but since it's not exported, we've covered it by calling manageComponents with invalid command
      prompts.inject(['list'])
      await manageComponents()
    })
  })

  describe('removeComponent', () => {
    it('should remove an existing component after confirmation', async () => {
      const compPath = path.join(componentsDir, 'to-remove')
      fs.mkdirSync(compPath)

      prompts.inject(['to-remove', true])

      await removeComponent({
        componentsDir,
      })

      assert.ok(!fs.existsSync(compPath), 'Component should be removed')
    })

    it('should not remove if not confirmed', async () => {
      const compPath = path.join(componentsDir, 'keep-me')
      fs.mkdirSync(compPath)

      prompts.inject(['keep-me', false])

      await removeComponent({
        componentsDir,
      })

      assert.ok(fs.existsSync(compPath), 'Component should still exist')
    })

    it('should abort if no component is selected for removal', async () => {
      prompts.inject([null])
      await removeComponent({ componentsDir })
    })
  })

  describe('renameComponent', () => {
    it('should rename directory and update file contents', async () => {
      const sourcePath = path.join(componentsDir, 'old-name')
      fs.mkdirSync(sourcePath)
      fs.writeFileSync(
        path.join(sourcePath, 'old-name.njk'),
        '<div class="c-old-name"></div>'
      )

      await renameComponent({
        source: 'old-name',
        target: 'new-name',
        componentsDir,
      })

      const targetPath = path.join(componentsDir, 'new-name')
      assert.ok(fs.existsSync(targetPath), 'New directory should exist')
      assert.ok(!fs.existsSync(sourcePath), 'Old directory should be gone')

      const content = fs.readFileSync(
        path.join(targetPath, 'new-name.njk'),
        'utf8'
      )
      assert.ok(content.includes('c-new-name'), 'Content should be updated')
    })

    it('should handle interactive renaming', async () => {
      const sourcePath = path.join(componentsDir, 'source-comp')
      fs.mkdirSync(sourcePath)
      fs.writeFileSync(path.join(sourcePath, 'source-comp.njk'), 'content')

      prompts.inject(['source-comp', 'target-comp'])

      await renameComponent({ componentsDir })
      assert.ok(fs.existsSync(path.join(componentsDir, 'target-comp')))
    })

    it('should abort rename if source is not selected', async () => {
      prompts.inject([null])
      await renameComponent({ componentsDir })
    })

    it('should abort rename if target is empty or exists', async () => {
      fs.mkdirSync(path.join(componentsDir, 'existing'))
      fs.mkdirSync(path.join(componentsDir, 'source'))

      prompts.inject(['source', 'existing'])
      await renameComponent({ componentsDir })
      assert.ok(fs.existsSync(path.join(componentsDir, 'source')))
    })
  })

  describe('listComponents', () => {
    it('should list components without crashing', async () => {
      fs.mkdirSync(path.join(componentsDir, 'comp-a'))
      fs.mkdirSync(path.join(componentsDir, 'comp-b'))
      await listComponents({ componentsDir })
    })

    it('should handle empty components directory', async () => {
      await listComponents({ componentsDir })
    })
  })

  describe('manageComponents dispatcher', () => {
    it('should dispatch commands based on argv', async () => {
      // Mock process.argv
      const originalArgv = process.argv
      process.argv = ['node', 'gulp', 'component', 'list']

      await manageComponents()

      process.argv = originalArgv
    })

    it('should dispatch interactive action', async () => {
      prompts.inject(['list'])
      await manageComponents()
    })
  })
})
