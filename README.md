![Maintenance](https://img.shields.io/maintenance/yes/2022)
![Contributions welcome](https://img.shields.io/badge/contributions-welcome-green.svg)

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/16e0c62b123d4dbfb27c216f5107f464)](https://www.codacy.com/gh/cebreus/gulp-devstack/dashboard?utm\_source=github.com\&utm\_medium=referral\&utm\_content=cebreus/gulp-devstack\&utm\_campaign=Badge\_Grade)
![GitHub open issues](https://img.shields.io/github/issues/cebreus/gulp-devstack)
![License](https://img.shields.io/github/license/cebreus/gulp-devstack)

# Front-end Gulp DevStack

> Gulp stack for building optimized static pages and exports for collaboration between coders and programmers.

<br>

**Table of contents** (click to expand)

<!-- toc -->

*   [Typical use cases](#typical-use-cases)
*   [Features](#features)
    *   [Something more under the hood](#something-more-under-the-hood)
*   [Getting Started](#getting-started)
    *   [Installation](#installation)
*   [Project structure](#project-structure)
*   [Workflow](#workflow)
    *   [Development](#development)
    *   [Production Build](#production-build)
    *   [Export Build](#export-build)
*   [Updates from devstack to your existing project](#updates-from-devstack-to-your-existing-project)
*   [Inject devstack to your new project](#inject-devstack-to-your-new-project)
*   [Roadmap and Known issues](#roadmap-and-known-issues)
*   [Contributing](#contributing)
*   [License](#license)
*   [Contact](#contact)

<!-- tocstop -->

## Typical use cases

*   Developing landing pages or prototypes (`npm run dev`).
*   Building carefully compiled and formated files for programmers (`npm run export`).
*   Building the final (production) output bundle ready for deployment (`npm run deploy`).

When you want to build whole web sites from the data sources as API or many markdown files, go with Static Page Generators (SGC). For example [Gridsome](https://gridsome.org/) (VueJS), [Gatsby](https://www.gatsbyjs.org/) (React) or [Hugo](https://gohugo.io/) (Go) will work for you much better.

## Features

*   SEO-friendly — Open Graph and Twiter Cards markup, self/canonical.
*   User-friendly — image optimizations, favicons, webmanifest and all sources minification to smallest bundle.
*   Developer-friendly — [ESLint](https://eslint.org/), [Prettier](https://prettier.io/), [Remark](https://remark.js.org/), [Stylelint](https://stylelint.io/) via tasks or with [Husky](https://github.com/typicode/husky) and [Lint staged](https://github.com/okonet/lint-staged).
*   Separate tasks for Development, Export and Build with automatic renaming and hashing all critical assets.
*   Ready for implementation Git based CMS as [Forestry.io](https://forestry.io/) or [Netlify CMS](https://www.netlifycms.org/) etc. — Front Matter (Markdown files metadata and content).
*   HTML temlates uses [Nunjucks](https://mozilla.github.io/nunjucks/). Fully customisable [Bootstrap 4.5.x](https://getbootstrap.com/) extended with [BEM](https://en.bem.info/). JavaScript processed with [Babel](https://babeljs.io/) or injected from CDN or as static files.

***

|                        | Preprocessing / Linting                                                                      | 🛠️ Development<br>Postprocessing                                                                                                                                 | 👁️ Export<br>Postprocessing                                                                                                                                      | 💯 Build<br>Postprocessing                                                                                                                                                               |
| ---------------------- | :------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CSS**                | [SASS](https://github.com/dlmanning/gulp-sass) / [Stylelint](https://stylelint.io/)          | [PostCSS](https://github.com/postcss/postcss) ([Autoprefixer](https://github.com/postcss/autoprefixer), [prettify](https://github.com/beautify-web/js-beautify)) | [PostCSS](https://github.com/postcss/postcss) ([Autoprefixer](https://github.com/postcss/autoprefixer), [prettify](https://github.com/beautify-web/js-beautify)) | [PostCSS](https://github.com/postcss/postcss) ([Autoprefixer](https://github.com/postcss/autoprefixer), [cssnano](https://github.com/ben-eb/cssnano), [PurgeCSS](https://purgecss.com/)) |
| **JavaScript**         | [Babel](https://babeljs.io/) / [ESLint](https://eslint.org/)                                 | only concatenate                                                                                                                                                 | concatenate & [uglify](https://github.com/terinjokes/gulp-uglify)                                                                                                | concatenate & [uglify](https://github.com/terinjokes/gulp-uglify)                                                                                                                        |
| **HTML**               | [Nunjucks](https://github.com/carlitoplatanito/gulp-nunjucks-render)                         | [prettify](https://github.com/beautify-web/js-beautify)                                                                                                          | [prettify](https://github.com/beautify-web/js-beautify)                                                                                                          | [minify](https://github.com/kangax/html-minifier)                                                                                                                                        |
| **Content & Metadata** | [Markdown](https://daringfireball.net/projects/markdown/) / [Remark](https://remark.js.org/) |                                                                                                                                                                  |                                                                                                                                                                  |                                                                                                                                                                                          |
| **JPG**, **SVG**       |                                                                                              | [imagemin](https://github.com/sindresorhus/gulp-imagemin)                                                                                                        | [imagemin](https://github.com/sindresorhus/gulp-imagemin)                                                                                                        | [imagemin](https://github.com/sindresorhus/gulp-imagemin)                                                                                                                                |
| **PNG**                |                                                                                              | [UPNG.js](https://github.com/photopea/UPNG.js/)                                                                                                                  | [UPNG.js](https://github.com/photopea/UPNG.js/)                                                                                                                  | [UPNG.js](https://github.com/photopea/UPNG.js/)                                                                                                                                          |
| **Fonts**              |                                                                                              | [gulp-google-webfonts](https://github.com/battlesnake/gulp-google-webfonts)                                                                                      | [gulp-google-webfonts](https://github.com/battlesnake/gulp-google-webfonts)                                                                                      | [gulp-google-webfonts](https://github.com/battlesnake/gulp-google-webfonts)                                                                                                              |
| **Favicons**           |                                                                                              |                                                                                                                                                                  | [Favicons](https://github.com/itgalaxy/favicons)                                                                                                                 | [Favicons](https://github.com/itgalaxy/favicons)                                                                                                                                         |
| **Workflow hints**     |                                                                                              | [Browsersync](https://browsersync.io/)                                                                                                                           |                                                                                                                                                                  |                                                                                                                                                                                          |

### Something more under the hood

*   Linting all commit messages by [CommitLint](https://commitlint.js.org/), see more about [Semantic Commit Messages](https://seesparkbox.com/foundry/semantic\_commit\_messages) and [Conventional Commits](https://www.conventionalcommits.org/)
*   Commit guide on the CLI by [git-cz](https://github.com/streamich/git-cz)
*   Automatic releases with [Release It!](https://github.com/release-it/release-it), see more about [Semantic Versioning](https://semver.org/)
*   Changelog with [Conventional Changelog](https://github.com/conventional-changelog/conventional-changelog)
*   [Gitflow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow)
*   Build and deployment to FTP.

## Getting Started

### Installation

1.  [Node.js and npm](https://nodejs.org/en/) are required.

2.  Clone the repository into the new project directory `PROJECT_NAME`

    ```bash
    git clone https://github.com/cebreus/gulp-devstack/ ./PROJECT_NAME
    ```

3.  Go to project directory `PROJECT_NAME` and install npm dependencies

    ```bash
    cd PROJECT_NAME && npm i
    ```

4.  <details>
     <summary><strong>Optional clenup</strong> (click to expand)</summary>

    *   Clean `CHANGELOG.md`

        ```bash
        > CHANGELOG.md
        ```

    *   Change or remove `LICENSE.txt` by `rm LICENSE`

        ```bash
        rm LICENSE
        ```

    *   Change this `README.md` according to your new project or replace it from the template

        ```bash
        curl https://gist.githubusercontent.com/cebreus/a6010a2a95a4f2375830b0af3193f2f9/raw/cde6d9c68f2605b34eb5b8710bd553e7ad28a678/minimalistic-readme > README.md
        ```

    *   Change these data in the `package.json` accordng to your new project
        *   `name`
        *   `description`
        *   `keywords`
        *   `author`
        *   `license`
        *   `private`
        *   `repository`
        *   `homepage`
        *   `bugs`

     </details>

## Project structure

*   ### `/.github`
    Specialties designed for GitHub.
*   ### `/content`
    *   `/pages` — each `*.md` is data source for templates; each file corresponds to the template `./src/pages/*.html`
    *   `site.md` — contains default data for all pages
*   ### `/gulp-tasks`
    Common Gulp tasks for Development workflow. Do not edit unless you know what you are doing.
*   ### `/gulp-tasks-build`
    Common Gulp tasks for Build workflow. Do not edit unless you know what you are doing.
*   ### `/gulp-tasks-export`
    Common Gulp tasks for Export workflow (compiled and formated bundles). Do not edit unless you know what you are doing.
*   ### `/src`
    Development directory. This is place of developers creativity. Change anything as you wish.
    *   `/gfx` — graphic assets
    *   `/js` — JavaScripts, all files in this directory will be concatenated into one file; files are sorted by name
    *   `/scss`
        *   `_variables.scss` — copy from the Bootstrap core for your customization.
        *   `bootstrap.scss` — copy from the Bootstrap core for your customization.
        *   `c-article.scss` — example of the [BEM component](https://csswizardry.com/2015/03/more-transparent-ui-code-with-namespaces/#component-namespaces-c-) Article.
        *   `custom.scss` — main stlesheet for customization of the project. Contains additions and overriding of the Bootstrap.
        *   `u-debugger.scss` — only in Developmnet workflow adds outline and info around HTML element with \[BEM namespaces]\([BEM component](https://csswizardry.com/2015/03/more-transparent-ui-code-with-namespaces/). Outlines [objects](https://csswizardry.com/2015/03/more-transparent-ui-code-with-namespaces/#object-namespaces-o-) `o-`, [component](https://csswizardry.com/2015/03/more-transparent-ui-code-with-namespaces/#component-namespaces-c-) `c-` and [utilities](https://csswizardry.com/2015/03/more-transparent-ui-code-with-namespaces/#utility-namespaces-u-) `u-`. To enable functionality set `$show-debugger` to `true` in the file `_variables.scss`.
        *   `u-show-grid.scss` — only in Developmnet workflow adds small box into bottom right corner with information about current viewport size accoding to Bootstrap. In the file `_variables.scss` set `$show-grid` to `true` and see bars as Bootstrap grid columns.
    *   `/templates`
        *   `/pages` — every `*.html` file will be rendered as standalone HTML page on own URL (directory name). Meta attributes passes from according Markdown file in `./content` directory.
        *   `/partials` —
        *   `layout-default.html` — main layout which extends files in `./templates/pages`
    *   `font.list` — tab-delimeted format for [gulp-google-webfonts](https://github.com/battlesnake/gulp-google-webfonts) which download font files and CSS to the project.
*   ### `/static`
    Content of this directory will be coppied into target (temp, export or build directory).
    *   `/.well-known/security.txt` — definition of the security policies. [Further info](https://securitytxt.org/)
    *   `humans.txt` — detailed public information about project e.g. team members, technologies etc. [Further info](http://humanstxt.org/)
*   ### `/` (root)
    *   `.browserslistrc` — [Browserslist](https://github.com/browserslist/browserslist) configuration to share target browsers versions between different front-end tools as Autoprefixer, Babel etc. The configuration is a copy of the Bootstrap configuration in this repo.
    *   `.editorconfig` — basic definition of code formatting for different code editors and IDEs. These settings are used as a baseline for language specialised linters in this repo. [Further info](http://editorconfig.org/)
    *   `.env.example` — template of the `.env` file, where stored fragments of the code shouldn’t be part of repo’s codebase, e.g. login to FTP.
    *   `.eslintignore` — list of the files and directories to be ignore by [Eslint](https://eslint.org/).
    *   `.eslintrc.yml` — [Eslint](https://eslint.org/) configuration to specify and configure rules of JavaScript linting. [Further info](https://eslint.org/docs/user-guide/configuring)
    *   `.gitattributes` — path-specific settings used by [Git](https://git-scm.com/). Settings that Git applies to certain subdirectories or subsets of files - for example EOL (End Of Line) setting. [Further info](https://git-scm.com/docs/gitattributes)
    *   `.gitignore` — list of path-specific pattern to be ignored (not commited) by [Git](https://git-scm.com/). [Further info](https://git-scm.com/docs/gitignore)
    *   `.prettierignore` — list of the files and directories to be ignore by [Prettier](https://prettier.io/).
    *   `.prettierrc.yml` — [Prettier](https://prettier.io/) configuration to specify and configure rules of language specific code formatting.
    *   `.release-it.yml` — [Release It!](https://github.com/release-it/release-it) configuration to specify behaviour of the versioning and package publishing related tasks.
    *   `.remarkignore` — list of the files and directories to be ignore by [Remark](https://remark.js.org/).
    *   `.remarkrc.yml` — [Remark](https://remark.js.org/) configuration to specify and configure rules of [Markdown](https://daringfireball.net/projects/markdown/) lintng.
    *   `.stylelintignore` — list of the files and directories to be ignore by [Stylelint](https://stylelint.io/).
    *   `.stylelintrc.yml` — [Stylelint](https://stylelint.io/) configuration to specify and configure rules of CSS (SCSS) linting. See used plugins! [Further info](https://stylelint.io/user-guide/configuration/)
    *   `commitlint.config.js` — [commitlint](https://commitlint.js.org/) configuration to help adhering to a commit convention.
    *   `gulpconfig.js` — configuration for 🛠️ **development** Gulp file `gulpfile.js`. Contains variables and setting which are specific for Development workflow purposes.
    *   `gulpconfig-build.js` — configuration for 💯 **build** Gulp file `gulpfile-build.js`. Contains variables and setting which are specific for Build workflow purposes.
    *   `gulpconfig-export.js` — configuration for 👁️ **export** Gulp file `gulpfile-export.js`. Contains variables and setting which are specific for Export workflow purposes.
    *   `gulpfile.js` — [Gulp](https://gulpjs.com/) 🛠️ **development** configuration and definition of automation tasks. [Further info](https://www.sitepoint.com/introduction-gulp-js/)
    *   `gulpfile-build.js` — [Gulp](https://gulpjs.com/) 💯 **build** configuration and definition of automation tasks. [Further info](https://www.sitepoint.com/introduction-gulp-js/)
    *   `gulpfile-export.js` — [Gulp](https://gulpjs.com/) 👁️ **export** configuration and definition of automation tasks. [Further info](https://www.sitepoint.com/introduction-gulp-js/)
    *   `CHANGELOG.md` — list of the notable changes in this project.
    *   `keepachangelog.hbs` — [auto-changelog](https://github.com/cookpete/auto-changelog) template for generating `CHANGELOG.md`.
    *   `LICENSE` — Open source license of [Git](https://git-scm.com/) repository. It enables others to freely use, change and distribute the project in the repository. [Further info](https://help.github.com/articles/adding-a-license-to-a-repository/)
    *   `package.json` — [NPM](https://www.npmjs.com/) packages specifics. It lists the packages (with their versions) your project depends on. [Further info](https://docs.npmjs.com/files/package.json)
    *   `package-lock.json` — [NPM](https://www.npmjs.com/) manifest. Automatically generated with change of `node_modules` or `package.json` if working with NPM. Holds information about which versions of each dependency were installed in order to get consistent installs across machines. [Further info](https://docs.npmjs.com/files/package-lock.json)
    *   `README.md` — It’s me!

## Workflow

### Development

Starts watchers, compilers etc., for development with hot-reload in the browser.

1.  Run development task

    ```bash
    npm run dev
    ```

2.  Open Browser on URL `http://localhost:4000` or what you see in command-line.

3.  Modify files in `src` directory a sub-directories.

4.  Changes in the configuration files requires a restart. Stop dev task and run `npm run dev` again.

### Production Build

Produces optimized files in production quality.

1.  Run build task

    ```bash
    npm run build
    ```

2.  See files in `build` directory.

### Export Build

Produces optimized and formated files with good readability of the code.

1.  Run build task

    ```bash
    npm run export
    ```

2.  See files in `export` directory.

## Updates from devstack to your existing project

1.  create a branch in your project’s repo (e.g. `devstack-update`)

    ```bash
    git checkout -b devstack-update
    ```

2.  Add this Gulp DevStack as a remote to your project `devstack`

    ```bash
    git remote add devstack git@github.com:cebreus/gulp-devstack.git
    ```

3.  Fetch remote

    ```bash
    git fetch devstack
    ```

4.  Merge `devstack-update` to your branch (e.g. `master`) (use `--allow-unrelated-histories` if necessary)

    ```bash
    git merge master
    ```

5.  solve eventual conflicts

6.  push the devstack-update branch

    ```bash
    git push -u devstack-update
    ```

7.  create PR from `devstack-update` to your master

## Inject devstack to your new project

```bash
git remote add devstack git@github.com:cebreus/gulp-devstack.git
git fetch devstack
git merge devstack master --squash --allow-unrelated-histories
git commit -m "feat: Gulp DevStack init"
```

Optional clenup

```bash
> CHANGELOG.md
rm LICENSE
curl https://gist.githubusercontent.com/cebreus/a6010a2a95a4f2375830b0af3193f2f9/raw/cde6d9c68f2605b34eb5b8710bd553e7ad28a678/minimalistic-readme > README.md
```

## Roadmap and Known issues

See the [open issues](https://github.com/cebreus/gulp-devstack/issues) for a list of proposed features (and known issues).

## Contributing

Contributions are what makes the open-source community such a fantastic place to learn, inspire, and create. Any contributions you make are **much appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (\`git commit -m "feat: Add some AmazingFeature")
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## License

It is distributed under the MIT License. See `LICENSE` for more information.

## Contact

Jaroslav Vrána — cebreus@live.com, [web site](https://www.cebre.us/)

Project Link: [github.com/cebreus/gulp-devstack](https://github.com/cebreus/gulp-devstack)
