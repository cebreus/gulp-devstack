# Front-end Gulp DevStack Changelog

## [5.0.0](https://github.com/cebreus/gulp-devstack/compare/4.5.0...5.0.0) (2026-07-02)

> **Major release!** Ported to the new Gulp 5 architecture, added a new showcase page, replaced Husky with Lefthook, and upgraded Node.js to >=24.10.0 along with various dependencies.

### ⚠️ BREAKING CHANGES

- refactor!(build): port to the new Gulp 5 architecture and split monolithic tasks into domain modules
- chore(deps): bump node engine requirement to >=24.10.0

### 🚀 New Features

- feat(showcase): add new showcase page with template, markdown content, and route-local styles
- feat(scripts): extract template operations into dedicated content and package modules
- feat(scripts): apply file purge policy to strip external tests and agent memories
- feat(scripts): remove internal test scripts from generated package configuration
- feat(scripts): add comprehensive unit and acceptance tests for template generation
- feat(scripts): update module boundary tests to verify internal boundaries
- feat(content): Implement calculateReadingTime with Markdown stripping
- feat(content): Integrate into processData task to provide readingTime metadata
- feat(content): Add unit and integration tests

### Other changes

#### Developer Experience (DX)

- chore(dx): Git hooks now managed by Lefthook, replacing Husky.
- chore(dx): Extracted lint-staged configuration to dedicated file.
- chore(dx): `lefthook.yml` defines pre-commit, commit-msg, pre-push, and prepare-commit-msg hooks.
- chore(dx): Updated prepare script to install Lefthook.
- chore(dx): `README.md` updated to reflect the new Git hook manager.
- docs(dx): Provide specific sharp installation troubleshooting steps
- docs(dx): Detail source map policy for dev, build, and export pipelines
- docs(dx): Document testing philosophy, conventions, and visual parity tests
- docs(dx): Clarify routing and template data processing pipeline behavior
- docs(dx): Restructure `AGENTS.md` to symlink agent guidelines to `GEMINI.md`
- refactor(dx): Migrate ESLint to flat config syntax using direct plugin imports.
- refactor(dx): Add new ESLint rules for code quality, complexity, and unused imports.
- refactor(dx): Restrict JSDoc enforcement to only exported functions outside tests.
- refactor(dx): Adjust Stylelint rules to avoid conflicts and improve flexibility.
- refactor(dx): Relax specific lint rules for config and test files.
- chore(dx): ignore build output directories

#### Build & Refactoring

- refactor(build): delete monolithic `navigation.js` and replace with `route-data.js`, `html-output.js`, and `navigation-assets.js`
- refactor(build): extract sass compilation logic into `sass-pipeline.js`
- refactor(build): add `sass-dependency-cache.js` for incremental mtime-based skip logic
- refactor(build): extract image optimisation logic into `image-pipeline.js`
- refactor(build): add `private-streams.js` and `html-rendering.js` as focused utilities
- refactor(build): add `changed-filter.js` for file-change filtering
- refactor(build): remove `generate-todo.js` task
- refactor(build): refactor `gulpfile` to use createPipelines and selectDefaultPipeline helpers
- refactor(build): add cssBootstrap, cssProject, and cssRoutes as discrete named tasks
- refactor(build): add granular file-event watchers for route styles and scripts
- build: Upgrade multiple devDependencies to latest versions
- build: Resolve entry points before invoking processing task
- build: Skip processing when no matching files are identified
- build: Enhance configuration to support explicit entry points
- chore(build): add node-gyp dev dependency
- chore(build): skip integrity generation for compiled component styles
- chore(build): remove internal jsdoc block from javascript pipeline
- fix(build): implement Windows-compatible path processing in gulp utilities
- fix(build): quote glob patterns in `package.json` to prevent shell expansion errors
- fix(build): extract inline node scripts from `lefthook.yml` to dedicated files
- fix(build): update test suites to accommodate Windows path formats
- refactor(build): Tune Sharp compression effort for WebP, AVIF, and PNG formats
- refactor(build): Rename configuration constants for image optimization and favicon generation
- fix(build): Add POSIX path normalization to core utilities
- fix(build): Apply forward slash formatting consistently in route resolution
- fix(build): Add robust unit tests for Windows path compatibility
- fix(build): Improve config tests for environment path normalization and cleanup

#### Dependencies

- chore(deps): add `pnpm-workspace.yaml` with allowBuilds entries for native packages
- chore(deps): move dependency overrides to `pnpm-workspace.yaml` per pnpm 11+ rules
- chore(deps): upgrade eslint to v10, cssnano to v8, html-validate to v11
- chore(deps): add eslint-plugin-unused-imports and @eslint-community/eslint-plugin-eslint-comments
- chore(deps): drop npm-run-all, rimraf, gulp-newer, gulp-sass, gulp-todo, and other unused packages
- chore(deps): add svgo v4 as direct dependency for SVG optimisation
- chore(deps): Upgraded various development libraries to latest versions
- chore(deps): Removed node-gyp, prompts, and remark-lint dev dependencies

#### Tests

- test(suite): add unit tests for changed-filter, private-streams, validate-html, and run-njklint
- test(suite): add unit tests for `gulpfile` structure and module boundaries
- test(suite): add integration tests for clean-build, copy-static, process-html, and process-js-routes
- test(suite): rename `images-final.test.js` to `images-final.test.js` for naming consistency
- test(suite): add runInSandbox and silenceConsole helpers to test-helpers
- test(suite): rename mockEnv to createMockEnvironment
- test(suite): suppress logger warn and error output in passing test runs
- test(suite): refactor visual parity suite to explicit named test cases
- test(suite): add documentation synchronization end-to-end test
- test(suite): implement fallback watch target resolution in development server test
- test(suite): add dependency symlink helper and cleanup resilience to test sandbox

#### Source & Initialization

- chore(src): add `run-njklint.js` to wrap nunjucklinter CLI invocations
- chore(src): split `init-template.js` into `init-template-content.js` and `init-template-ops.js`
- chore(src): update about page template and markdown content
- chore(src): update hero component styles and markup
- chore(src): update `env.js` config and JS entry points
- chore(src): update plopfile for new component generator structure
- chore(init): The component script is no longer available.
- chore(init): All associated content generation, file operations, and package setup removed.
- chore(init): Dedicated unit and integration tests for the initialization process are deleted.
- chore(src): remove default components, hero sections, and showcase routes
- chore(src): delete dummy fonts, logos, and vector assets
- chore(src): remove obsolete github instructions, unused codeql workflow, and init script
- chore(src): drop size-limit configuration and dependencies
- chore(src): update `README.md`, AI agent documentation, and repository rules
- chore(src): clean up outdated visual parity and unit test suites

## [4.5.0](https://github.com/cebreus/gulp-devstack/compare/4.4.0...4.5.0) (2024-05-13)

> It contains Bootstrap 5.3.2, Node,je version bump to 18.x, security updates
> and major package upgrades.

### ⚠️ BREAKING CHANGES

- Node.js version bump to 18.x
- Update GitHub Actions to latest versions

### 🚀 New Features

- Update Bootstrap to 5.3.2

### Other changes

- fix: `gulp-todo.js`
- fix: callbacks
- refactor: logging
- refactor: documentation
- refactor: linters

## [4.4.1](https://github.com/cebreus/gulp-devstack/compare/4.0.0...4.4.1) (2023-07-03)

> Fix a glob in the `copyStaticFnc()` function, refactor the `buildTodo()`
> function and security updates.

## [4.4.0](https://github.com/cebreus/gulp-devstack/compare/4.0.0...4.4.0) (2023-06-12)

> It contains Bootstrap 5.3.0, security updates and major package upgrades.

### 🚀 New Features

- feat: upgrade Bootstrap to 5.3.0
- feat: new GitHub action for deployment to GitHub Pages

## Release [4.3.1](https://github.com/cebreus/gulp-devstack/compare/4.0.0...4.3.1) (2023-05-30)

> Security updates, README fix.

## Release [4.3.0](https://github.com/cebreus/gulp-devstack/compare/4.0.0...4.3.0) (2023-05-18)

> Security updates and minor fixes.

## Release [4.2.0](https://github.com/cebreus/gulp-devstack/compare/4.0.0...4.2.0) (2023-03-29)

> Security updates, minor enhancements and upgrade of gulp-imagemin to
> version 8.

## Release [4.1.1](https://github.com/cebreus/gulp-devstack/compare/4.0.0...4.1.1) (2023-03-29)

> Security updates.

## Release [4.1.0](https://github.com/cebreus/gulp-devstack/compare/4.0.0...4.1.0) (2023-01-29)

> Code cleanup, security fixes, major code maintenance, Stylelint fixes and
> Babel upgrade.

### 🚀 New Features

- feat: update Bootstrap to 5.2.3

## Release [4.0.0](https://github.com/cebreus/gulp-devstack/compare/3.5.0...4.0.0) (2022-10-05)

> **Major release!** Refactored all Gulp tasks and scripts. Contains Bootstrap
> 5.2.2 and security updates.

### ⚠️ BREAKING CHANGES

- refactor: all Gulp tasks and scripts

### 🚀 New Features

- feat: update Bootstrap to 5.2.2
- feat: new header on 404 page

### Other changes

- refactor: textlint rules
- refactor: eslint rules
- refactor: npm script 'todo'
- refactor: release process
- fix: use local instance of the Gulp
- fix: npm script 'prepare'
- chore: npm up

## Release [3.5.0](https://github.com/cebreus/gulp-devstack/compare/3.4.0...3.5.0) (2022-06-20)

> Security updates, Bootstrap 5.2.0 and minor fixes and refactors.

- feat: update Bootstrap to 5.2.0
- refactor: calling if the npm scripts
- fix: unresolved variable
- fix: fs-read() encoding to 'utf8'

## Release [3.4.0](https://github.com/cebreus/gulp-devstack/compare/3.3.1...3.4.0) (2022-02-02)

> Update to Node.js 16 and cross-platform fixes.

- Node.js 16
- Prefix relative paths in export with '.'
- Add caching to GitHub workflow
- Add VS code extensions recommendations

## Release [3.3.1](https://github.com/cebreus/gulp-devstack/compare/3.3.0...3.3.1) (2021-12-01)

> Security and README updates.

## Release [3.3.0](https://github.com/cebreus/gulp-devstack/compare/3.2.0...3.3.0) (2021-11-22)

### 🚀 New Features

- Brand new landing page.
- Refactor Twitter cards markup.
- GitHub workflow for install, build and deploy to GitHub Pages.

## Release [3.2.0](https://github.com/cebreus/gulp-devstack/compare/3.1.1...3.2.0) (2021-11-11)

Updated npm packages include `gulp-sass` (version 5) & `sass` (Dart Sass).

### 🚀 New Features

- feat: Bootstrap 5.1.3
  [`60da2f6`](https://github.com/cebreus/gulp-devstack/commit/60da2f6b6d7343c41c09983cdfd8ba604a6195c1)

## Release [3.1.1](https://github.com/cebreus/gulp-devstack/compare/3.1.0...3.1.1) (2021-09-22)

Required node 14.x, updated npm packages

- fix: husky execute
- fix: validation of HTML
- refactor: remove gitmodule git-release

## Release [3.1.0](https://github.com/cebreus/gulp-devstack/compare/3.0.0...3.1.0) (2021-05-30)

### 🚀 New Features

- feat: Bootstrap 5.0.1
  [`507d13c`](https://github.com/cebreus/gulp-devstack/commit/507d13c45b77e1fc47ee8c232ddba165649946a6)

## Release [3.0.0](https://github.com/cebreus/gulp-devstack/compare/2.0.0...3.0.0) (2021-03-10)

## Release [2.0.0](https://github.com/cebreus/gulp-devstack/compare/1.1.0...2.0.0) (2021-03-09)

## Release [1.1.0](https://github.com/cebreus/gulp-devstack/compare/1.0.0...1.1.0) (2021-03-09)

## Release 1.0.0 (2021-03-09)
