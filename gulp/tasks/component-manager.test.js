import * as componentUtils from './component-manager.js'
import fs from 'fs'
import assert from 'node:assert'
import { afterEach, describe, it } from 'node:test'
import path from 'path'
import prompts from 'prompts'

const TEMP_DIR = path.resolve('.temp/components')

/**
 * Creates a temporary directory structure for testing.
 * @param {object} structure - Directory structure to create.
 * @returns {void}
 */
function createTempStructure(structure = {}) {
  // Create a temporary directory for testing.
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true })
  }
  fs.mkdirSync(TEMP_DIR, { recursive: true })

  // Create the specified directory structure.
  for (const [key, value] of Object.entries(structure)) {
    const itemPath = path.join(TEMP_DIR, key)
    if (typeof value === 'object' && value !== null) {
      fs.mkdirSync(itemPath, { recursive: true })
      for (const [subKey, subValue] of Object.entries(value)) {
        const subPath = path.join(itemPath, subKey)
        fs.writeFileSync(subPath, subValue || '')
      }
    } else {
      fs.writeFileSync(itemPath, value || '')
    }
  }
}

// Clean up the temporary directory after each test.
afterEach(() => {
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true })
  }
})

describe('Component CLI utilities', () => {
  describe('createComponent', () => {
    it('creates a new component with all files', async () => {
      createTempStructure()
      prompts.inject(['test-component'])
      await componentUtils.createComponent({ componentsDir: TEMP_DIR })
      const compDir = path.join(TEMP_DIR, 'test-component')
      assert.strictEqual(fs.existsSync(compDir), true)
      assert.strictEqual(
        fs.existsSync(path.join(compDir, 'test-component.njk')),
        true
      )
      assert.strictEqual(
        fs.existsSync(path.join(compDir, 'test-component.scss')),
        true
      )
      assert.strictEqual(
        fs.existsSync(path.join(compDir, 'test-component.md')),
        true
      )
    })

    it('creates component files with correct content', async () => {
      createTempStructure()
      prompts.inject(['test-comp'])
      await componentUtils.createComponent({ componentsDir: TEMP_DIR })
      const compDir = path.join(TEMP_DIR, 'test-comp')

      const njkContent = fs.readFileSync(
        path.join(compDir, 'test-comp.njk'),
        'utf8'
      )
      assert.ok(njkContent.includes('c-test-comp'))
      assert.ok(njkContent.includes('Component: test-comp'))

      const scssContent = fs.readFileSync(
        path.join(compDir, 'test-comp.scss'),
        'utf8'
      )
      assert.ok(scssContent.includes('.c-test-comp'))
      assert.ok(scssContent.includes('Component: test-comp'))

      const mdContent = fs.readFileSync(
        path.join(compDir, 'test-comp.md'),
        'utf8'
      )
      assert.ok(mdContent.includes('# Component test-comp'))
      assert.ok(mdContent.includes('components/test-comp/test-comp.njk'))
    })
    it('does not create component when user cancels (empty name)', async () => {
      createTempStructure()
      prompts.inject([''])
      await componentUtils.createComponent({ componentsDir: TEMP_DIR })
      assert.strictEqual(fs.readdirSync(TEMP_DIR).length, 0)
    })

    it('creates component with kebab-case conversion', async () => {
      createTempStructure()
      prompts.inject(['My Cool Component!'])
      await componentUtils.createComponent({ componentsDir: TEMP_DIR })
      const compDir = path.join(TEMP_DIR, 'my-cool-component')
      assert.strictEqual(fs.existsSync(compDir), true)
      assert.strictEqual(
        fs.existsSync(path.join(compDir, 'my-cool-component.njk')),
        true
      )
    })

    it('validates reserved component names', async () => {
      createTempStructure()
      prompts.inject(['con'])
      await componentUtils.createComponent({ componentsDir: TEMP_DIR })
      assert.strictEqual(fs.readdirSync(TEMP_DIR).length, 0)
    })
    it('prevents overwriting existing component', async () => {
      createTempStructure({ existing: {} })
      prompts.inject(['existing'])
      await componentUtils.createComponent({ componentsDir: TEMP_DIR })
      assert.strictEqual(fs.existsSync(path.join(TEMP_DIR, 'existing')), true)
      assert.strictEqual(
        fs.readdirSync(path.join(TEMP_DIR, 'existing')).length,
        0
      )
    })
  })

  describe('removeComponent', () => {
    it('removes an existing component', async () => {
      createTempStructure({
        'to-remove': {
          'to-remove.njk': '',
          'to-remove.scss': '',
          'to-remove.md': '',
        },
      })
      prompts.inject(['to-remove', true])
      await componentUtils.removeComponent({ componentsDir: TEMP_DIR })
      assert.strictEqual(fs.existsSync(path.join(TEMP_DIR, 'to-remove')), false)
    })
    it('cancels removal if not confirmed', async () => {
      createTempStructure({ 'to-cancel': { 'to-cancel.njk': '' } })
      prompts.inject(['to-cancel', false])
      await componentUtils.removeComponent({ componentsDir: TEMP_DIR })
      assert.strictEqual(fs.existsSync(path.join(TEMP_DIR, 'to-cancel')), true)
    })
    it('handles no components to remove', async () => {
      createTempStructure()
      await componentUtils.removeComponent({ componentsDir: TEMP_DIR })
    })
  })

  describe('renameComponent', () => {
    it('renames a component and updates file content', async () => {
      createTempStructure({
        'old-name': {
          'old-name.njk': 'c-old-name',
          'old-name.scss': 'Component: old-name',
          'old-name.md': 'Component old-name',
        },
      })
      prompts.inject(['old-name', 'new-name'])
      await componentUtils.renameComponent({ componentsDir: TEMP_DIR })
      assert.strictEqual(fs.existsSync(path.join(TEMP_DIR, 'new-name')), true)
      assert.strictEqual(fs.existsSync(path.join(TEMP_DIR, 'old-name')), false)
      const scss = fs.readFileSync(
        path.join(TEMP_DIR, 'new-name', 'new-name.scss'),
        'utf8'
      )
      assert.ok(scss.includes('Component: new-name'))
    })
    it('cancels rename if not confirmed', async () => {
      createTempStructure({ foo: { 'foo.njk': '' } })
      prompts.inject(['foo', ''])
      await componentUtils.renameComponent({ componentsDir: TEMP_DIR })
      assert.strictEqual(fs.existsSync(path.join(TEMP_DIR, 'foo')), true)
    })
    it('does not rename to existing name', async () => {
      createTempStructure({ a: { 'a.njk': '' }, b: { 'b.njk': '' } })
      prompts.inject(['a', 'b'])
      await componentUtils.renameComponent({ componentsDir: TEMP_DIR })
      assert.strictEqual(fs.existsSync(path.join(TEMP_DIR, 'a')), true)
      assert.strictEqual(fs.existsSync(path.join(TEMP_DIR, 'b')), true)
    })
  })

  describe('listComponents', () => {
    it('lists all components and their files', async () => {
      createTempStructure({
        comp1: { 'comp1.njk': '', 'comp1.scss': '', 'comp1.md': '' },
        comp2: { 'comp2.njk': '', 'comp2.scss': '', 'comp2.md': '' },
      })
      await componentUtils.listComponents({ componentsDir: TEMP_DIR })
    })
    it('handles no components to list', async () => {
      createTempStructure()
      await componentUtils.listComponents({ componentsDir: TEMP_DIR })
    })
  })
})
