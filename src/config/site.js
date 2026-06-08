import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'))

export const siteDefaults = {
  title: 'Gulp DevStack',
  description: 'Modern frontend development workflow with Gulp',
  version: pkg.version,
  author: 'Cebreus',
  baseUrl: process.env.SITE_BASE_URL || 'http://localhost:3000',
  meta: {
    lang: 'en',
    charset: 'utf-8',
  },
  seo: {
    title: 'New Project SEO Title',
    description: 'New Project SEO Description',
    robots: 'index,follow',
    include_to_sitemap: true,
  },
}
