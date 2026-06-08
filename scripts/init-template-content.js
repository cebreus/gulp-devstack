const LOCALHOST_SITE_URL = 'http://localhost:3000'

/**
 * Generates a clean HTML layout for the new project.
 * @returns {Promise<string>} The HTML layout template.
 */
export async function generateCleanLayout() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{ page.title | default('New Project') }}</title>
    <!-- inject:css --><!-- endinject -->
    {% for style in pageStyles or [] %}
        <link rel="stylesheet" href="{{ style }}" />
    {% endfor %}
</head>
<body data-bs-theme="light">
    <main class="container py-5">
        {% block content %}{% endblock %}
    </main>
    <!-- inject:js --><!-- endinject -->
    {% for script in pageScripts or [] %}
        <script src="{{ script }}" type="module"></script>
    {% endfor %}
</body>
</html>`
}

/**
 * Generates a clean index page for the new project.
 * @returns {Promise<string>} The Nunjucks index template.
 */
export async function generateCleanIndex() {
  return `---
title: Welcome to Blank Template
---
{% extends "layout-default.njk" %}
{% block content %}
    <div class="row">
        <div class="col-12 text-center">
            <h1 class="display-4 border-bottom pb-4 mb-4">It works!</h1>
            <p class="lead">Gulp Devstack has been successfully initialized into a pristine template.</p>
            <p>You can now start building your custom SCSS and Nunjucks templates without any bloat.</p>
        </div>
    </div>
{% endblock %}`
}

/**
 * Generates a clean 404 page for the new project.
 * @returns {Promise<string>} The Nunjucks 404 template.
 */
export async function generateClean404() {
  return `---
title: 404 - Page Not Found
seo:
  robots: noindex, follow
---
{% extends "layout-default.njk" %}
{% block content %}
    <div class="text-center py-5">
        <h1 class="display-1">404</h1>
        <p class="lead">The page you are looking for does not exist.</p>
        <a href="/" class="btn btn-primary mt-3">Back to Home</a>
    </div>
{% endblock %}`
}

/**
 * Generates a clean main SCSS file for the new project.
 * @returns {Promise<string>} The SCSS template.
 */
export async function generateCleanScss() {
  return `@import 'globals';
@import 'utils';
@import 'bootstrap.scss';

// Add your custom variables and SCSS logic here
`
}

/**
 * Generates a clean site configuration for the new project.
 * @param {object} options - Content overrides for the generated config.
 * @param {string} options.projectName - Human-readable project name.
 * @param {string} options.author - Author name embedded into the config.
 * @param {string} options.siteUrl - Production base URL.
 * @returns {Promise<string>} The site config template.
 */
export async function generateCleanSiteConfig({
  projectName,
  author,
  siteUrl,
}) {
  return `export const siteDefaults = {
  title: '${projectName}',
  description: 'Project created with Gulp DevStack',
  version: '1.0.0',
  author: '${author}',
  baseUrl: process.env.SITE_BASE_URL || '${LOCALHOST_SITE_URL}',
  meta: {
    lang: 'en',
    charset: 'utf-8',
  },
  seo: {
    title: '${projectName} SEO Title',
    description: '${projectName} SEO Description',
    robots: 'index,follow',
    include_to_sitemap: true,
  },
  openGraph: {
    use: true,
    type: 'website',
    siteName: '${projectName}',
  },
  twitterCards: {
    use: false,
  },
}
`.replace(LOCALHOST_SITE_URL, siteUrl)
}

/**
 * Generates a clean main JS file for the new project.
 * @returns {Promise<string>} The JS template.
 */
export async function generateCleanJs() {
  return `/**
 * Binds DOM event handlers for the main app runtime.
 * @returns {void}
 */
function bindEvents() {
  // Add event listeners here.
}

/**
 * Initializes the main frontend runtime.
 * @returns {void}
 */
function initializeApp() {
  bindEvents()
}

document.addEventListener('DOMContentLoaded', initializeApp)
`
}

const initTemplateContentApi = {
  generateClean404,
  generateCleanIndex,
  generateCleanJs,
  generateCleanLayout,
  generateCleanScss,
  generateCleanSiteConfig,
}

export default initTemplateContentApi
