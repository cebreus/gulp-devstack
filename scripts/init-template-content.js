const LOCALHOST_SITE_URL = 'http://localhost:3000'

function generateCleanLayout() {
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

function generateCleanIndex() {
  return `{% extends "layout-default.njk" %}
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

function generateClean404() {
  return `{% extends "layout-default.njk" %}
{% block content %}
    <div class="text-center py-5">
        <h1 class="display-1">404</h1>
        <p class="lead">The page you are looking for does not exist.</p>
        <a href="/" class="btn btn-primary mt-3">Back to Home</a>
    </div>
{% endblock %}`
}

function generateCleanIndexData() {
  return `---
title: Welcome to Blank Template
---
`
}

function generateClean404Data() {
  return `---
title: 404 - Page Not Found
seo:
  robots: noindex, follow
---
`
}

function generateCleanReadme({ projectName }) {
  return `# ${projectName}

This project was initialized from a Gulp-based static site boilerplate for Nunjucks, Markdown, SCSS, and JavaScript.

## Commands

- \`pnpm install\`
- \`pnpm dev\`
- \`pnpm build\`
- \`pnpm export\`
- \`pnpm test\`

## Notes

- Project-specific content lives under \`src/routes/\`.
- Shared styles live under \`src/scss/\`.
- Shared scripts live under \`src/js/\`.
- Additional technical guidance is available in \`docs/\`.
`
}

function generateCleanTestingDoc() {
  return `# Testing

This project ships with a baseline end-to-end test suite that validates the generated site in a real browser.

## What is included

- Browser-based page checks
- Accessibility checks
- Broken link checks
- Development watch/reload verification

## Commands

- \`pnpm test\`
- \`pnpm test:e2e\`
- \`pnpm test:prod\`
- \`pnpm test:export\`

## Expectations

- Keep the E2E suite aligned with the pages and routes that exist in the project.
- When project structure changes, update the tests so they describe the current site rather than an old showcase.
- Add narrower unit or integration tests only when the project gains custom logic that needs them.
`
}

function generateCleanRobotsTxt() {
  return `User-agent: *
Allow: /*.*?
`
}

function generateCleanScss() {
  return `@import 'globals';
@import 'utils';
@import 'bootstrap.scss';

// Add your custom variables and SCSS logic here
`
}

function generateCleanComponentsScss() {
  return `@import 'globals';

// Add your custom component styles here
`
}

function generateCleanSiteConfig({ projectName, author, siteUrl }) {
  return `export const siteDefaults = {
  title: '${projectName}',
  description: 'Project initialized from a static site boilerplate.',
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

function generateCleanJs() {
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
  generateClean404Data,
  generateCleanIndex,
  generateCleanIndexData,
  generateCleanJs,
  generateCleanLayout,
  generateCleanReadme,
  generateCleanRobotsTxt,
  generateCleanScss,
  generateCleanComponentsScss,
  generateCleanSiteConfig,
  generateCleanTestingDoc,
}

export default initTemplateContentApi
