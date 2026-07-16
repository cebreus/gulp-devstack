import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import nunjucks from 'nunjucks'

function render(template, context = {}) {
  const env = new nunjucks.Environment(
    new nunjucks.FileSystemLoader(['src/lib'], { noCache: true }),
    { autoescape: false, trimBlocks: true, lstripBlocks: true }
  )
  return env.renderString(template, context).trim()
}

describe('responsive-image component', () => {
  it('renders an explicit local descriptor with LQS and intrinsic dimensions', () => {
    const html = render(
      `{% from "components/media/responsive-image.njk" import responsiveImage %}{{ responsiveImage(image, alt="Hero", className="hero", fetchpriority="high") }}`,
      {
        image: {
          src: '/assets/images/hero.jpg',
          sources: [{ type: 'image/webp', srcset: '/assets/images/hero.webp' }],
          width: 1200,
          height: 800,
          placeholderClass: 'lqs-a1b2c3d4e5',
        },
      }
    )

    assert.match(html, /<picture class="">/)
    assert.match(
      html,
      /<source type="image\/webp" srcset="\/assets\/images\/hero.webp" sizes="100vw"/
    )
    assert.match(
      html,
      /<img[\s\S]*class="hero lqs-a1b2c3d4e5"[\s\S]*fetchpriority="high"[\s\S]*src="\/assets\/images\/hero.jpg"[\s\S]*srcset="\/assets\/images\/hero.jpg"[\s\S]*sizes="100vw"[\s\S]*width="1200"[\s\S]*height="800"[\s\S]*alt="Hero"/
    )
  })

  it('omits incomplete intrinsic dimensions', () => {
    const html = render(
      `{% from "components/media/responsive-image.njk" import responsiveImage %}{{ responsiveImage(image, alt="Remote") }}`,
      { image: { src: 'https://example.com/remote.jpg' } }
    )

    assert.doesNotMatch(html, /width=""|height=""/)
    assert.doesNotMatch(html, /\swidth=|\sheight=/)
  })
})
