import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { describe, it } from 'node:test'

import purgeCss from '../../gulp/tasks/purge-css.js'
import { runInSandbox, writeFixtures } from '../test-helpers.js'

describe('PurgeCSS Integration', () => {
  it('should retain protocol selectors used by external-link indicators', async () => {
    await runInSandbox('purge-css', async (sandbox) => {
      const cssPath = path.join(sandbox, 'input/styles.css')
      const htmlPath = path.join(sandbox, 'input/index.html')
      const outputDir = path.join(sandbox, 'output')

      await writeFixtures(sandbox, {
        'input/index.html': '<a href="https://example.com">Example</a>',
        'input/styles.css': [
          "a[href^='http://']::after,",
          "a[href^='https://']::after { content: ''; }",
          '.unused { color: red; }',
        ].join('\n'),
      })

      await purgeCss(cssPath, htmlPath, outputDir)

      const result = await fs.readFile(
        path.join(outputDir, 'styles.css'),
        'utf8'
      )
      assert.match(result, /a\[href\^=['"]http:\/\//)
      assert.match(result, /a\[href\^=['"]https:\/\//)
      assert.doesNotMatch(result, /\.unused/)
    })
  })
})
