import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'))

export const siteDefaults = {
  title: 'Gulp DevStack',
  description: 'Modern frontend development workflow with Gulp',
  version: pkg.version,
  author: 'Cebreus',
  copyright:
    'Code licensed under <a href="https://github.com/twbs/bootstrap/blob/main/LICENSE" class="text-muted" target="_blank" rel="license noopener">MIT</a>',
  baseUrl: process.env.SITE_BASE_URL,
  meta: {
    lang: 'en',
    charset: 'utf-8',
    author: 'humans.txt',
  },
  seo: {
    title: '𝕊𝕚𝕥𝕖 SEO Title',
    description: '𝕊𝕚𝕥𝕖 SEO Description',
    robots: 'index,follow',
    include_to_sitemap: false,
  },
  openGraph: {
    use: true,
    type: 'website',
    appId: '',
    siteName: 'Gulp DevStack',
    image: ['/assets/images/gulp-devstack-open-graph.png'],
    imageText: '𝕊𝕚𝕥𝕖 Open Graph Image Text',
  },
  twitterCards: {
    use: false,
    type: 'summary_large_image',
    image: [],
    site: '@cebreus69',
    creator: '@cebreus69',
  },
}
