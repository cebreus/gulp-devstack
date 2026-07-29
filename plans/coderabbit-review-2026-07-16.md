# CodeRabbit full-repo review — gulp-devstack (2026-07-16)

206 souborů v diffu, 72 findings (src 12, tests 20, gulp 22, zbytek 18).

## devstack-review-src

- **minor** `src/js/custom.js:1-14` — Restore the saved theme during initialisation.
- **minor** `src/scss/u-devstack.scss:141-149` — Allow the grid overlay to fill the row.
- **minor** `src/config/site.js:18-21` — Replace placeholder metadata defaults.
- **major** `src/routes/layout-default.njk:60-81` — Keep the hero inside the main landmark.
- **minor** `src/config/site.js:24-30` — Do not reference an absent Open Graph image.
- **major** `src/lib/components/media/responsive-image.njk:5-7` — Do not eagerly load every responsive image by default.
- **minor** `src/lib/components/hero/hero.scss:104-119` — Place the decorative glow behind the hero content.
- **minor** `src/routes/index.njk:84-86` — Render the Markdown route body.
- **minor** `src/routes/about/index.scss:163-165` — Prevent horizontal overflow in the component examples.
- **minor** `src/routes/_blueprint.md:37-40` — Use the documented body parameter.
- **minor** `src/routes/about/_pipeline-table.njk:85-101` — Render unsupported modes consistently.
- **minor** `src/routes/about/index.njk:344-348` — Do not claim that SRI prevents file modification.

## devstack-review-tests

- **minor** `tests/unit/hero.test.js:19-21` — Assert that the labels are attached to the landmark roots.
- **minor** `tests/unit/image-catalog.test.js:108-132` — Cover uncatalogued local images.
- **major** `tests/test-helpers.js:61-65` — Prevent fixture paths escaping the sandbox.
- **major** `tests/test-helpers.js:19-40` — Restrict cleanup to helper-created sandbox directories.
- **major** `tests/test-helpers.js:72-82` — Validate an existing node\_modules entry.
- **major** `tests/test-helpers.js:11-15` — Guarantee unique, confined sandbox paths.
- **minor** `tests/unit/config.test.js:85-95` — Delete environment variables that were originally absent.
- **minor** `tests/unit/helpers.test.js:19-47` — Compare the utils barrel against an explicit export whitelist.
- **minor** `tests/unit/config.test.js:49-61` — Assert the complete export set rather than known private names.
- **major** `tests/integration/sass.test.js:101-116` — Exercise an actual custom PostCSS plugin.
- **major** `tests/integration/mismatched-images.test.js:76-112` — Do not emit PNG content under a `.jpg` filename.
- **major** `tests/integration/images-final.test.js:35-44` — Explicitly trigger Sharp failures in these fallback tests.
- **minor** `tests/unit/images-logic.test.js:125-131` — Use an actually valid PNG fixture.
- **major** `tests/visual/parity.test.js:101-123` — Preserve handles during partial setup and complete all teardown paths.
- **minor** `tests/integration/assets.test.js:71-75` — Validate the generated SRI digest, not only its prefix.
- **minor** `tests/integration/full-build.test.js:71-83` — Verify that assets is a directory.
- **minor** `tests/integration/assets.test.js:34-50` — Assert that the revisioned asset was actually written.
- **major** `tests/visual/helpers.js:38-47` — Use path-relative containment instead of a string prefix.
- **major** `tests/e2e/pages.test.js:28-42` — Do not use directory existence as proof that build artefacts are current.
- **major** `tests/e2e/dev-watch.test.js:71-85` — Reap the dev process on every failure path.

## devstack-review-gulp

- **major** `gulp/tasks/process-fonts.js:28-36` — Verify every font referenced by the stylesheet.
- **major** `gulp/tasks/process-html.js:60-65` — Filter private routes before rendering.
- **major** `gulp/tasks/process-data.js:105-127` — Build menu entries from resolved frontmatter.
- **major** `gulp/utils/route-data.js:51-56` — Validate route containment before deriving paths.
- **minor** `gulp/utils/route-data.js:333-339` — Use the trimmed frontmatter value for `pageId`.
- **major** `gulp/utils/navigation-assets.js:32-44` — Only treat a missing asset directory as empty.
- **minor** `gulp/tasks/debug-build.js:113-128` — Continue auditing build artefacts when routes are missing.
- **minor** `gulp/templates/component/component.md.hbs:4-5` — Use standard Nunjucks include syntax.
- **major** `gulp/utils/core.js:186-201` — Make `handleEmptyPaths` log the documented warning level.
- **major** `gulp/utils/index.js:3-16` — Re-export `toBooleanFlag` and `toPosixPath` from the utils barrel.
- **major** `gulp/utils/image-pipeline.js:119-124` — Fail conversions instead of silently emitting the source format.
- **minor** `gulp/utils/image-helpers.js:30-33` — Require an SVG root element when detecting SVG files.
- **major** `gulp/tasks/process-images.js:60-62` — Drop invalid SVG files before writing the destination.
- **major** `gulp/tasks/lint-templates.js:27-35` — Do not suppress lint failures outside watch mode.
- **minor** `gulp/tasks/generate-favicons.js:78-95` — Keep generated HTML aligned with output overrides.
- **major** `gulp/utils/sass-dependency-cache.js:8-18` — Rebuild when the dependency manifest is missing or invalid.
- **major** `gulp/tasks/process-sass.js:10-11` — Fail release builds when any Sass compilation fails.
- **major** `gulp/utils/sass-pipeline.js:32-38` — Reject multiple sources targeting one output filename.
- **major** `gulp/tasks/process-sass.js:61-74` — Preserve every custom Sass include path.
- **major** `gulp/tasks/process-sass.js:307-314` — Apply build-mode options to route styles.
- **major** `gulp/utils/sass-dependency-cache.js:56-59` — Refresh the manifest after every successful compilation.
- **major** `gulp/tasks/clean-build.js:14-21` — Constrain deletion to an allowed root before calling `deleteAsync(paths, { force: true })`.

## devstack-review-rest

- **major** `docs/TEMPLATE-DATA.md:71-76` — Document the trust boundary around `safe`.
- **minor** `CHANGELOG.md:118-121` — Fix the Node.js typo.
- **minor** `CHANGELOG.md:88-92` — Correct the self-referential test rename.
- **minor** `docs/TESTING.md:142-145` — Make the negative-test example execute the operation under test.
- **minor** `public/humans.txt:11` — Correct the invalid update date.
- **minor** `.editorconfig:5-18` — Scope `quote_type = single` away from JSON, which inherits it otherwise.
- **minor** `scripts/release.js:76-77` — Do not terminate the process before cleaning the temporary config.
- **major** `scripts/run-njklint.js:61-65` — Do not report success when the linter is terminated by a signal.
- **minor** `public/robots.txt:1-4` — Simplify the robots rule because `?` is literal in the current pattern.
- **minor** `plopfile.js:13-20` — Reject malformed kebab-case names.
- **minor** `scripts/hooks/fold-lines.js:18-43` — Do not alter indentation or split opaque commit-message tokens.
- **minor** `scripts/hooks/fix-blank-line.js:4-6` — Fail when the hook message path is missing.
- **major** `.github/workflows/pr-checks.yml:39-186` — Pin workflow actions to immutable SHAs.
- **major** `.github/workflows/clean-workflows.yml:15-18` — Pin `igorjs/gh-actions-clean-workflow` to a commit SHA because `@v3` is mutable.
- **major** `.github/workflows/github-pages-deploy-pnpm.yml:35-84` — Pin deployment actions to immutable SHAs.
- **minor** `lint-staged.config.js:2-6` — Run JavaScript, SCSS, and Nunjucks fixers in ordered chains.
- **minor** `eslint.config.js:116-118` — Use the complete test-pattern list for the production JSDoc override.
- **major** `.remarkrc.js:32-36` — Use supported rule scoping because `overrides` is unsupported.
