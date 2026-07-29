import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'))

function getRequiredUrl(name) {
  const value = process.env[name]

  if (!value) {
    throw new Error(
      `[SiteConfig] Missing required environment variable: ${name}`
    )
  }

  try {
    const url = new URL(value)

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new TypeError('Only HTTP(S) URLs are supported')
    }

    const suffix = `${url.search}${url.hash}`
    const pathEnd = url.href.length - suffix.length

    return `${url.href.slice(0, pathEnd).replace(/\/$/, '')}${suffix}`
  } catch (error) {
    throw new Error(`[SiteConfig] Invalid URL in ${name}: ${value}`, {
      cause: error,
    })
  }
}

export const siteDefaults = {
  title: 'Gulp DevStack',
  description: 'Modern frontend development workflow with Gulp',
  version: pkg.version,
  author: 'Cebreus',
  get baseUrl() {
    return getRequiredUrl('SITE_BASE_URL')
  },
  meta: {
    lang: 'en',
    charset: 'utf-8',
  },
  seo: {
    title: 'New Project SEO Title',
    description: 'New Project SEO Description',
    robots: 'index,follow',
  },
}
