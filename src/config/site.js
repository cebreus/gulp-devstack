// Site configuration - contains content and metadata settings for the website.
import { getBaseUrl } from '../../gulp/config.js'
import { readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'))

export const siteDefaults = {
  title: 'Gulp DevStack',
  description: 'Modern frontend development workflow with Gulp',
  version: pkg.version,
  author: 'Developer',
  copyright:
    'Code licensed <a href="https://github.com/twbs/bootstrap/blob/main/LICENSE" target="_blank" rel="license noopener">MIT</a>',
  baseUrl: getBaseUrl(),
  meta: {
    lang: 'en',
    charset: 'utf-8',
    author: 'humans.txt',
  },
  seo: {
    title: '𝕊𝕚𝕥𝕖 SEO Title',
    description: '𝕊𝕚𝕥𝕖 SEO Description',
    robots: 'index,follow',
    iclude_to_sitemap: false,
  },
  open_graph: {
    use: true,
    type: 'website',
    app_id: '',
    site_name: 'Gulp DevStack',
    image: ['/assets/images/gulp-devstack-open-graph.png'],
    image_text: '𝕊𝕚𝕥𝕖 Open Graph Image Text',
  },
  twitter_cards: {
    use: false,
    type: 'summary_large_image',
    image: [],
    site: '@cebreus69',
    creator: '@cebreus69',
  },
}
