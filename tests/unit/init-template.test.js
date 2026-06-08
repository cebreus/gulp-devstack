import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { mutatePackageObject } from '../../scripts/init-template-package.js'

describe('init-template package policy', () => {
  it('should preserve e2e scripts and remove non-e2e devstack test scripts', () => {
    const pkg = {
      scripts: {
        'init:template': 'node scripts/init-template.js',
        test: 'node --test tests/unit/**/*.test.js',
        'test:unit': 'node --test tests/unit/**/*.test.js',
        'test:integration': 'node --test tests/integration/**/*.test.js',
        'test:e2e': 'node --test tests/e2e/**/*.test.js',
        'test:smoke': 'node --test tests/smoke/**/*.test.js',
        'test:visual': 'node --test tests/visual/**/*.test.js',
        'test:coverage':
          'node --test --experimental-test-coverage tests/**/*.test.js',
        'test:ci': 'pnpm run test && pnpm run test:e2e',
        'test:prod': 'BUILD_MODE=build pnpm run test:e2e',
        'test:export': 'BUILD_MODE=export pnpm run test:e2e',
        'verify:pipeline': 'pnpm run lint && pnpm run test',
        'sanity:budget': 'size-limit',
        build: 'gulp',
      },
      devDependencies: {
        '@axe-core/playwright': '^4.11.3',
        '@playwright/test': '^1.60.0',
        '@size-limit/preset-big-lib': '^12.1.0',
        eslint: '^10.4.1',
        linkinator: '^7.6.1',
        'size-limit': '^12.1.0',
      },
    }

    mutatePackageObject(pkg, {
      safePkgName: 'nicotrans',
      rawProjectName: 'Nicotrans',
      author: 'Jaroslav Vrana',
      license: 'MIT',
    })

    assert.deepStrictEqual(pkg.scripts, {
      test: 'cross-env NODE_ENV=test node --test --test-concurrency=1 tests/e2e/**/*.test.js',
      'test:e2e':
        'cross-env NODE_ENV=test node --test --test-concurrency=1 tests/e2e/**/*.test.js',
      'test:prod': 'cross-env BUILD_MODE=build pnpm run test:e2e',
      'test:export': 'cross-env BUILD_MODE=export pnpm run test:e2e',
      build: 'gulp',
    })
    assert.deepStrictEqual(pkg.devDependencies, {
      '@axe-core/playwright': '^4.11.3',
      '@playwright/test': '^1.60.0',
      eslint: '^10.4.1',
      linkinator: '^7.6.1',
    })
  })
})
