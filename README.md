# Frontend Gulp DevStack

![Maintenance](https://img.shields.io/maintenance/yes/2022)
![Contributions welcome](https://img.shields.io/badge/contributions-welcome-green.svg)

_We recommend that you open this README in another tab as you perform the tasks below. You can [watch our video](https://www.youtube.com/watch?v=0ocf7u76WSo&feature=youtu.be) for a full demo of all the steps in this tutorial. Open the video in a new tab to avoid leaving Bitbucket._

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

1. Click **Source** on the left side.
2. Click the README.md link from the list of files.
3. Click the **Edit** button.
4. Delete the following text: _Delete this line to make a change to the README from Bitbucket._
5. After making your change, click **Commit** and then **Commit** again in the dialog. The commit page will open and you’ll see the change you just made.
6. Go back to the **Source** page.

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

Use these steps to clone from SourceTree, our client for using the repository command-line free. Cloning allows you to work on your files locally. If you don't yet have SourceTree, [download and install first](https://www.sourcetreeapp.com/). If you prefer to clone from the command line, see [Clone a repository](https://confluence.atlassian.com/bitbucket/clone-a-repository-223217891.html).

### Prerequisites

Now that you're more familiar with your Bitbucket repository, go ahead and add a new file locally. You can [push your change back to Bitbucket with SourceTree](https://confluence.atlassian.com/get-started-with-sourcetree/commit-and-push-a-change-git-847359114.html), or you can [add, commit,](https://confluence.atlassian.com/bitbucket/add-edit-and-commit-to-source-files-223217905.html) and [push from the command-line](https://confluence.atlassian.com/bitbucket/push-updates-to-a-repository-221449525.html).
