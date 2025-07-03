import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  getComponentTemplates,
  RESERVED_COMPONENT_NAMES,
  validateComponentName,
} from '../../gulp/tasks/manage-components.js'

describe('Component Management Utilities', () => {
  describe('validateComponentName', () => {
    it('should return true for valid kebab-case names', () => {
      assert.strictEqual(validateComponentName('my-component'), true)
      assert.strictEqual(validateComponentName('card-v2'), true)
      assert.strictEqual(validateComponentName('header'), true)
    })

    it('should return error for missing name', () => {
      assert.strictEqual(typeof validateComponentName(''), 'string')
      assert.strictEqual(typeof validateComponentName(null), 'string')
    })

    it('should return error for reserved names', () => {
      RESERVED_COMPONENT_NAMES.forEach((name) => {
        assert.strictEqual(typeof validateComponentName(name), 'string')
      })
    })

    it('should return error for invalid characters', () => {
      assert.strictEqual(typeof validateComponentName('MyComponent'), 'string')
      assert.strictEqual(typeof validateComponentName('my_component'), 'string')
      assert.strictEqual(typeof validateComponentName('my component'), 'string')
      assert.strictEqual(typeof validateComponentName('comp@nent'), 'string')
    })

    it('should return error for multiple consecutive dashes', () => {
      assert.strictEqual(
        typeof validateComponentName('my--component'),
        'string'
      )
    })

    it('should return error for leading or trailing dashes', () => {
      assert.strictEqual(
        typeof validateComponentName('-my-component'),
        'string'
      )
      assert.strictEqual(
        typeof validateComponentName('my-component-'),
        'string'
      )
    })
  })

  describe('getComponentTemplates', () => {
    it('should generate correctly named files with boilerplate', () => {
      const name = 'test-comp'
      const templates = getComponentTemplates(name)

      assert.strictEqual(templates.length, 3)

      const filenames = templates.map((t) => t.filename)
      assert.ok(filenames.includes('test-comp.njk'))
      assert.ok(filenames.includes('test-comp.scss'))
      assert.ok(filenames.includes('test-comp.md'))

      const njk = templates.find((t) => t.filename.endsWith('.njk'))
      assert.ok(njk.content.includes('class="c-test-comp"'))

      const scss = templates.find((t) => t.filename.endsWith('.scss'))
      assert.ok(scss.content.includes('.c-test-comp'))
    })
  })
})
