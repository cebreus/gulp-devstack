import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { describe, it } from 'node:test'
import sharp from 'sharp'

import {
  applyLocalImageMetadata,
  buildLocalImageCatalog,
  loadLocalImageCatalog,
  writeLocalImageCatalog,
} from '../../gulp/utils/image-catalog.js'
import { runInSandbox } from '../test-helpers.js'

describe('Local image catalog', () => {
  it('describes actual oriented outputs and excludes alpha images from LQS', async () => {
    await runInSandbox('image-catalog', async (sandbox) => {
      const imagesDest = path.join(sandbox, 'assets/images')
      await fs.mkdir(imagesDest, { recursive: true })

      const orientedJpeg = await sharp({
        create: {
          width: 40,
          height: 20,
          channels: 3,
          background: '#480049',
        },
      })
        .jpeg()
        .withMetadata({ orientation: 6 })
        .toBuffer()
      await fs.writeFile(path.join(imagesDest, 'photo.jpg'), orientedJpeg)
      await fs.writeFile(
        path.join(imagesDest, 'photo.webp'),
        await sharp(orientedJpeg).rotate().webp().toBuffer()
      )
      await fs.writeFile(
        path.join(imagesDest, 'logo.png'),
        await sharp({
          create: {
            width: 10,
            height: 10,
            channels: 4,
            background: { r: 72, g: 0, b: 73, alpha: 0.5 },
          },
        })
          .png()
          .toBuffer()
      )

      const assets = await buildLocalImageCatalog({ imagesDest })

      assert.deepStrictEqual(assets.catalog.photo, {
        src: '/assets/images/photo.jpg',
        sources: [{ type: 'image/webp', srcset: '/assets/images/photo.webp' }],
        width: 20,
        height: 40,
        placeholderClass: assets.catalog.photo.placeholderClass,
      })
      assert.match(assets.catalog.photo.placeholderClass, /^lqs-[a-f0-9]{10}$/)
      assert.match(
        assets.css,
        /background-image:url\("data:image\/webp;base64,/
      )
      assert.ok(
        !assets.catalog.photo.sources.some(({ type }) => type === 'image/avif')
      )
      assert.strictEqual(assets.catalog.logo.placeholderClass, undefined)
      assert.ok(!assets.css.includes('logo.png'))
    })
  })

  it('writes reusable metadata and external placeholder CSS', async () => {
    await runInSandbox('image-catalog-files', async (sandbox) => {
      const imagesDest = path.join(sandbox, 'build/assets/images')
      const catalogPath = path.join(sandbox, '.temp/images/catalog.json')
      const cssPath = path.join(sandbox, 'build/assets/css/lqs.css')
      await fs.mkdir(imagesDest, { recursive: true })
      await fs.writeFile(
        path.join(imagesDest, 'photo.jpg'),
        await sharp({
          create: {
            width: 40,
            height: 20,
            channels: 3,
            background: '#480049',
          },
        })
          .jpeg()
          .toBuffer()
      )

      await writeLocalImageCatalog({ imagesDest, catalogPath, cssPath })

      const catalog = await loadLocalImageCatalog(catalogPath)
      const persistedCatalog = await fs.readFile(catalogPath, 'utf8')
      const css = await fs.readFile(cssPath, 'utf8')
      assert.strictEqual(catalog.photo.width, 40)
      assert.ok(!persistedCatalog.includes('data:image'))
      assert.match(css, /data:image\/webp;base64,/)
      await assert.rejects(
        loadLocalImageCatalog(path.join(sandbox, 'missing.json')),
        /ENOENT/
      )
    })
  })

  it('enhances only explicitly filtered local legacy image markup', () => {
    const html = [
      '<img class="photo" src="/assets/images/photo.jpg" alt="Photo">',
      '<img src="https://example.com/photo.jpg" alt="External">',
    ].join('')
    const catalog = {
      photo: {
        src: '/assets/images/photo.jpg',
        sources: [],
        width: 40,
        height: 20,
        placeholderClass: 'lqs-photo',
      },
    }

    const output = applyLocalImageMetadata(html, catalog)

    assert.match(
      output,
      /<img class="photo lqs-photo" src="\/assets\/images\/photo.jpg" alt="Photo" width="40" height="20">/
    )
    assert.match(
      output,
      /<img src="https:\/\/example.com\/photo.jpg" alt="External">/
    )
  })
})
