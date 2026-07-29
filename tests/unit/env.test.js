import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { getEnv } from '../../gulp/utils/index.js'

describe('Environment Utilities', () => {
  it('should return fallback for undefined values', () => {
    const environment = {}
    assert.strictEqual(
      getEnv('MISSING_KEY', 'fallback', environment),
      'fallback'
    )
  })

  it('should coerce boolean strings', () => {
    const environment = { BOOL_TRUE: 'true', BOOL_FALSE: 'false' }

    assert.strictEqual(getEnv('BOOL_TRUE', null, environment), true)
    assert.strictEqual(getEnv('BOOL_FALSE', null, environment), false)
  })

  it('should coerce numeric strings', () => {
    const environment = { INT_VAL: '42', FLOAT_VAL: '3.14' }

    assert.strictEqual(getEnv('INT_VAL', null, environment), 42)
    assert.strictEqual(getEnv('FLOAT_VAL', null, environment), 3.14)
  })

  it('should preserve non-numeric/non-boolean strings', () => {
    const environment = { MODE: 'development', MIXED: '42px' }

    assert.strictEqual(getEnv('MODE', null, environment), 'development')
    assert.strictEqual(getEnv('MIXED', null, environment), '42px')
  })
})
