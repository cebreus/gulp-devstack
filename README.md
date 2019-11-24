# Frontend Gulp DevStack

![Maintenance](https://img.shields.io/maintenance/yes/2022)
![Contributions welcome](https://img.shields.io/badge/contributions-welcome-green.svg)

![Codacy grade](https://img.shields.io/codacy/grade/4c460cbeb0894666ba35c3c9971a91bb)
![Bitbucket open issues](https://img.shields.io/bitbucket/issues/cebreus/gulp-dev-stack)
![Bitbucket open pull requests](https://img.shields.io/bitbucket/pr/cebreus/gulp-dev-stack)

* * *

<!--
## Table of Contents

-   [Key features](#key-features)
-   [Getting Started](#getting-started)
    -   [Prerequisites](#prerequisites)
    -   [Installation](#installation)
-   [Usage](#usage)
    -   [Development](#development)
    -   [Production Build](#production-build)
-   [Roadmap](#roadmap)
-   [Contributing](#contributing)
-   [License](#license)
-   [Contact](#contact)
-->

## Introduction

It is meant to be used for building static pages with full output control. Creates a bundled of the web page(s) with a style sheet(s), transpilled JavaScript for browsers and optimized images. It has development mode with hot-reload and production build.

When you want to build whole web pages from the data sources as API or bunch of the markdown files, Static Page Generators as [Gridsome](https://gridsome.org/) (VueJS), [Gatsby](https://www.gatsbyjs.org/) (React) or [Hugo](https://gohugo.io/) (Go) will work for you much better. I personally prefer Gridsome or Hugo. Gridsome produces HTML files for every markdown file or API source and then in browser hydrates with javascript. The best solution for SEO.

### Typical use cases

-   Building landing pages.
-   Building prototypes.
-   Building the final output bundle for clients or programmers.
-   Optimize images.

### Key features

-   Separate tasks for developing `npm run develop` and final build `npm run build`.
-   [Bootstrap](https://getbootstrap.com/) version 4 as a frontend framework.
-   [Nunjucks](https://mozilla.github.io/nunjucks/) as templating engine.
-   JSON as the main data source for templates (`<head />` etc.).
-   [SCSS](https://sass-lang.com/) and [BEM](https://en.bem.info/) with PostCSS, Autoprefixer and other modules for SCSS processing.
-   Generates favicons.
-   Optimizes images.
-   Automatic formatting, linting and repair of source files — Eslint, Prettier, Stylelint, Textlint. Execution using npm scripts and automatically before committing.
-   [Gitflow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow); [Semantic Commit Messages](https://seesparkbox.com/foundry/semantic_commit_messages) based on [Conventional Commits](https://www.conventionalcommits.org/); [Semantic Versioning](https://semver.org/); Git submodule for the release process.

## Getting Started

This is an example of how you may give instructions on setting up your project locally. To get a local copy up and running follow these simple example steps.

### Prerequisites

[Node.js and npm](https://nodejs.org/en/) are required.

### Installation

1.  Clone the repository

    ```bash
    git clone https://bitbucket.org/cebreus/gulp-dev-stack/
    ```

2.  Install npm packages

    ```bash
    npm i
    ```

## Usage

### Development

Starts watchers, compilers etc. for dynamic development with hot reload in the browser.

1.  Run development task

    ```bash
    npm run develop
    ```

2.  Open Browser on URL `http://localhost:4000` or what you see in command-line.

3.  Modify files in `src` folder a subfolders:

    -   folder `/data` contind JSON files with data structures for templates
    -   folder `/gfx` contains graphic files
    -   folder `/pages` contains template files
    -   folder `/scss` contains all SCSS files
    -   file `/fonts.list` defines font famillys

### Production Build

Produces optimized files in production quality.

1.  Run build task

    ```bash
    npm run build
    ```

2.  See files in `build` folder.

## Roadmap

See the [open issues](https://bitbucket.org/socialauth/login/atlassianid/?next=%2Fcebreus%2Fgulp-dev-stack%2Fissues%3Fstatus%3Dnew%26status%3Dopen) for a list of proposed features (and known issues).

## Contributing

Contributions are what make the open source community such an amazing place to be learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact

Your Name - [@cebreus69](https://twitter.com/cebreus69) — cebreus@live.com

Project Link: [https://bitbucket.org/cebreus/gulp-dev-stack](https://bitbucket.org/cebreus/gulp-dev-stack/)
