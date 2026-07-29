import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import * as routeDataModule from '../../gulp/utils/route-data.js'

describe('Route data public API', () => {
  it('keeps artifact construction helpers private', () => {
    assert.ok(!('getMenuDataArtifactPath' in routeDataModule))
    assert.ok(!('getPageRegistryArtifactPath' in routeDataModule))
    assert.ok(!('buildMenuData' in routeDataModule))
  })
})
