---
type: page
title_h1:
excerpt:
hero:
  title: Build static sites,<span class="d-none d-md-block"></span> develop with live reload,<span class="d-none d-md-block"></span> export optimized sources
  excerpt: Front-end Gulp stack based on Bootsrap for building optimized static pages and exports for collaboration between coders and programmers.
  content: |-
    <div class="d-flex flex-column flex-sm-row">
      <a class="btn btn-lg btn-primary mb-3 me-sm-3" href="https://github.com/cebreus/gulp-devstack/#readme" target="_blank" rel="license noopener">Get started</a>
      <a class="btn btn-lg btn-outline-secondary mb-3" href="https://github.com/cebreus/gulp-devstack/releases/latest" target="_blank" rel="license noopener">Download</a>
    </div>

    Currently **v3.4.0** &#160;·&#160; <a class="link-secondary" href="https://github.com/cebreus/gulp-devstack/releases" target="_blank" rel="license noopener">All releases</a>

    [![Codacy Badge](https://app.codacy.com/project/badge/Grade/16e0c62b123d4dbfb27c216f5107f464)](https://www.codacy.com/gh/cebreus/gulp-devstack/dashboard?utm_source=github.com\&utm_medium=referral\&utm_content=cebreus/gulp-devstack\&utm_campaign=Badge_Grade)
    ![GitHub open issues](https://img.shields.io/github/issues/cebreus/gulp-devstack)
    ![License](https://img.shields.io/github/license/cebreus/gulp-devstack)

    [![Build and Deploy](https://github.com/cebreus/gulp-devstack/actions/workflows/blank.yml/badge.svg)](https://github.com/cebreus/gulp-devstack/actions/workflows/blank.yml)
    [![Netlify](https://img.shields.io/netlify/80dd73b9-7dff-450b-a038-4fba020d577a)](https://app.netlify.com/sites/gulp-devstack/deploys)
entity_status:
  date: 2020-02-01T11:00
  updated_at: 2021-11-21T12:00:00
  workflow_step: publish
seo:
  title: Front-end Gulp DevStack
  description: Gulp stack for building optimized static pages and exports for collaboration between coders and programmers.
  robots: index,follow
  canonical: 'https://gulp-devstack.cebre.us/'
open_graph:
  use: true
  type: website
  title: ''
  description: ''
twitter_cards:
  use: true
  title: ''
  description: ''
---

## Typical use cases

*   **Developing** landing pages or prototypes (`npm run dev`).
*   **Exporting** carefully compiled and formated files for collaboration (`npm run export`).
*   **Building** the final (production) bundle, ready for deployment (`npm run deploy`).

When you want to build whole web sites from the data sources as API or many markdown files, go with Static Page Generators (SGC). For example [Gridsome](https://gridsome.org/) (VueJS), [Gatsby](https://www.gatsbyjs.org/) (React) or [Hugo](https://gohugo.io/) (Go) will work for you much better.

## Features

*   **SEO-friendly** — Open Graph and Twiter Cards markup, self/canonical.
*   **User-friendly** — image optimizations, favicons, webmanifest and all sources minification to smallest bundle.
*   **Developer-friendly** — [ESLint](https://eslint.org/), [Prettier](https://prettier.io/), [Remark](https://remark.js.org/), [Stylelint](https://stylelint.io/) via tasks or with [Husky](https://github.com/typicode/husky) and [Lint staged](https://github.com/okonet/lint-staged).
*   Separate tasks for Development, Export and Build with automatic renaming and hashing all critical assets.
*   Ready for implementation Git based CMS as [Forestry.io](https://forestry.io/) or [Netlify CMS](https://www.netlifycms.org/) etc. — Front Matter (Markdown files metadata and content).
*   HTML temlates uses [Nunjucks](https://mozilla.github.io/nunjucks/). Fully customisable [Bootstrap 5.1.x](https://getbootstrap.com/) extended with [BEM](https://en.bem.info/). JavaScript processed with [Babel](https://babeljs.io/) or injected from CDN or as static files.

**Usefull scripts**

*   Deploy to FTP (`npm run deploy-ftp`) or Netlify etc.
*   Validating output HTML (`npm run build:validate:html` or `npm run export:validate:html`).
*   Listing all TODO’s (`npm run todo:show`).
