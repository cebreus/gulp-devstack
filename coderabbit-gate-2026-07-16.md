# CodeRabbit gate — gulp-devstack (2026-07-16)

Kanonicke jadro: gulp-devstack. Stav repa: commit `5ba5505`.
Verifikace: testy 178/178, lint:js OK, build OK, export OK.
Konvergence: canon (referencni repo).

Kazdy bod kanonickeho seznamu (CR-01..CR-84) ma explicitni status — nic nebylo preskoceno bez oznaceni.
Souhrn: already-fixed: 1, fixed: 67, not-present: 14.

## Legenda

- **fixed** — oprava provedena primo v tomto repu
- **fixed-via-canon-sync** — soubor konvergovan na canon (gulp-devstack) verzi, ktera fix nese; u souboru s projektovou deltou overeno testy
- **already-fixed** — vyreseno jiz pred timto pruchodem
- **not-present** — kod/soubor v tomto repu neexistuje
- **n/a-different-impl** — stejny problem reseny jinou implementaci (bez vady)
- **skipped-needs-review** — zamerne odlozeno, vyzaduje rucni revizi

## Matice

| ID | Zavaznost | Soubor | Status | Poznamka |
|---|---|---|---|---|
| CR-01 | major | `gulp/tasks/process-sass.js` | **fixed** | preserve ALL configured include paths (not just. opraveno primo v canonu |
| CR-02 | major | `gulp/utils/sass-dependency-cache.js` | **fixed** | missing/invalid manifest => cache miss (return null, force recompile). opraveno primo v canonu |
| CR-03 | major | `gulp/tasks/process-sass.js` | **fixed** | fail non-dev builds on Sass compilation errors (mode !== 'dev' || SHOULD_FAIL_ON_SASS_ERROR). opraveno primo v canonu |
| CR-04 | major | `gulp/utils/sass-pipeline.js` | **fixed** | throw when outputFilename set with multiple sources. opraveno primo v canonu |
| CR-05 | major | `gulp/tasks/process-sass.js` | **fixed** | apply buildModeStyleOptions to route styles (not just skipNewer). opraveno primo v canonu |
| CR-06 | major | `gulp/utils/sass-dependency-cache.js` | **fixed** | write dependency manifest after EVERY successful compilation (drop skipNewer gate). opraveno primo v canonu |
| CR-07 | major | `gulp/utils/route-data.js` | **fixed** | pageId: use normalized (deepTrimStrings) frontmatter, not raw. opraveno primo v canonu |
| CR-08 | major | `gulp/tasks/process-data.js` | **fixed** | buildMenuEntry from renderedFrontmatter, not raw frontmatter. opraveno primo v canonu |
| CR-09 | major | `gulp/utils/route-data.js` | **fixed** | path-segment-aware route containment (getRouteRelativePath, reject ../ and absolute). opraveno primo v canonu |
| CR-10 | major | `gulp/tasks/process-html.js` | **fixed** | filter isPrivateFile routes before rendering. opraveno primo v canonu |
| CR-11 | major | `gulp/utils/navigation-assets.js` | **fixed** | include flat home.css/home.js in root-route candidates. opraveno primo v canonu |
| CR-12 | major | `gulp/utils/navigation-assets.js` | **fixed** | catch: ENOENT => null, rethrow other errors. opraveno primo v canonu |
| CR-13 | major | `gulp/utils/html-rendering.js` | **not-present** | cs-* regional locale handled like cs in resolveLocalizedPath. ceska typografie zije jen v downstream projektech |
| CR-14 | minor | `gulp/utils/html-rendering.js` | **not-present** | mdText: strip markup or rename (misleading). mdText filtr v canonu neexistuje |
| CR-15 | minor | `gulp/utils/html-typography.js` | **not-present** | add textarea to SKIP_TAGS. html-typography.js v canonu neexistuje |
| CR-16 | minor | `gulp/utils/logger.js` | **fixed** | parse DEBUG/VERBOSE as boolean flags (false/0 = off). opraveno primo v canonu |
| CR-17 | major | `gulp/utils/core.js` | **fixed** | handleEmptyPaths: logger.warn not logger.verbose. opraveno primo v canonu |
| CR-18 | major | `gulp/utils/index.js` | **fixed** | barrel: re-export toBooleanFlag, toPosixPath. opraveno primo v canonu |
| CR-19 | major | `gulp/utils/image-pipeline.js` | **fixed** | WebP/AVIF conversion failure => fail (cb(error)), no silent source-format fallback. opraveno primo v canonu |
| CR-20 | major | `gulp/tasks/process-images.js` | **fixed** | drop _isInvalid files (cb(null,null)), do not publish. opraveno primo v canonu |
| CR-21 | minor | `gulp/utils/image-helpers.js` | **fixed** | isSvgBuffer: require <svg root element, not any <?xml. opraveno primo v canonu |
| CR-22 | major | `gulp/tasks/process-fonts.js` | **fixed** | catch: only ENOENT = no assets; rethrow I/O/permission errors. opraveno primo v canonu |
| CR-23 | major | `gulp/tasks/process-fonts.js` | **fixed** | verify every local url(...) font referenced by CSS exists. opraveno primo v canonu |
| CR-24 | major | `gulp/tasks/generate-sitemap.js` | **not-present** | exclude exact page path, not route subtree prefix. sitemap task v canonu odstranen |
| CR-25 | major | `gulp/tasks/generate-sri.js` | **fixed** | fail build when SRI generation skips a matched tag. opraveno primo v canonu |
| CR-26 | major | `gulp/tasks/serve-site.js` | **not-present** | decodeURIComponent try/catch => 400 for malformed encoding. serve pres BrowserSync, custom handler odstranen |
| CR-27 | major | `gulp/tasks/serve-site.js` | **not-present** | clear serverInstance when listen() fails. serve pres BrowserSync |
| CR-28 | minor | `gulp/tasks/serve-site.js` | **not-present** | close() before closeAllConnections(). serve pres BrowserSync |
| CR-29 | major | `gulp/tasks/clean-build.js` | **fixed** | no unrestricted force:true del; validate targets under allowed root. opraveno primo v canonu |
| CR-30 | major | `gulp/tasks/lint-templates.js` | **fixed** | rethrow lint failures outside watch mode. opraveno primo v canonu |
| CR-31 | major | `gulp/tasks/lint-templates.js` | **fixed** | execFile with arg array, no shell interpolation of filenames. opraveno primo v canonu |
| CR-32 | minor | `gulp/tasks/debug-build.js` | **fixed** | audit build output even when routes dir missing. opraveno primo v canonu |
| CR-33 | minor | `gulp/tasks/generate-favicons.js` | **fixed** | keep generated HTML aligned with rootIconPath/manifestPath overrides. opraveno primo v canonu |
| CR-34 | major | `gulp/templates/component/component.md.hbs` | **fixed** | replace unsupported `include ... with {}` syntax. opraveno primo v canonu |
| CR-35 | major | `gulpfile.js` | **fixed** | validate BUILD_MODE against whitelist, fail fast. opraveno primo v canonu |
| CR-36 | major | `gulpfile.js` | **already-fixed** | wrap favicons() in async-completion adapter before Promise.all. favicons bezi pres gulp.parallel adapter |
| CR-37 | major | `gulpfile.js` | **fixed** | wrap gulp.parallel copy task with runGulpTask. opraveno primo v canonu |
| CR-38 | major | `eslint.config.js` | **fixed** | apply JS policy to .mjs/.cjs; CommonJS override for .cjs. opraveno primo v canonu |
| CR-39 | minor | `eslint.config.js` | **fixed** | production JSDoc override: ignores = TEST_FILE_PATTERNS. opraveno primo v canonu |
| CR-40 | major | `lint-staged.config.js` | **fixed** | include .mjs/.cjs in globs. opraveno primo v canonu |
| CR-41 | minor | `lint-staged.config.js` | **fixed** | avoid same-file concurrent fixers (Prettier overlap with eslint/stylelint/njklint globs). opraveno primo v canonu |
| CR-42 | major | `.remarkrc.js` | **fixed** | overrides unsupported; scope no-duplicate-headings via nested config under src/routes/. opraveno primo v canonu |
| CR-43 | major | `.github/workflows/*` | **fixed** | pin ALL actions to full commit SHAs (pr-checks, clean-workflows, github-pages-deploy-pnpm; keep version comment). opraveno primo v canonu |
| CR-44 | minor | `.github/workflows/github-pages-deploy-pnpm.yml` | **fixed** | quote E2E test glob. opraveno primo v canonu |
| CR-45 | major | `scripts/run-njklint.js` | **fixed** | exit status: result.status ?? 1; prefer process.exitCode over exit(). opraveno primo v canonu |
| CR-46 | major | `scripts/print-cv.js` | **not-present** | fail on non-OK page.goto response. print-cv.js neexistuje |
| CR-47 | minor | `scripts/print-cv.js` | **not-present** | catch malformed URI escapes => null. print-cv.js neexistuje |
| CR-48 | major | `scripts/sort-frontmatter.js` | **not-present** | skip symlinks in collectMarkdownFiles. sort-frontmatter.js neexistuje |
| CR-49 | minor | `scripts/hooks/fix-blank-line.js` | **fixed** | preserve CRLF line endings. opraveno primo v canonu |
| CR-50 | minor | `scripts/hooks/fix-blank-line.js` | **fixed** | throw on missing message path (also fold-lines.js). opraveno primo v canonu |
| CR-51 | minor | `scripts/hooks/fold-lines.js` | **fixed** | preserve indentation, don't split opaque tokens. opraveno primo v canonu |
| CR-52 | minor | `scripts/release.js` | **fixed** | no process.exit before finally cleanup; use exitCode. opraveno primo v canonu |
| CR-53 | major | `tests/test-helpers.js` | **fixed** | mkdtemp with sanitized prefix for sandboxes. opraveno primo v canonu |
| CR-54 | major | `tests/test-helpers.js` | **fixed** | cleanup only non-symlink dirs under tests/.sandboxes. opraveno primo v canonu |
| CR-55 | major | `tests/test-helpers.js` | **fixed** | reject fixture paths escaping sandbox (.. / absolute). opraveno primo v canonu |
| CR-56 | major | `tests/test-helpers.js` | **fixed** | validate EEXIST node_modules link resolves to expected target. opraveno primo v canonu |
| CR-57 | minor | `tests/test-helpers.js` | **fixed** | aggregate cleanup error with primary test failure. opraveno primo v canonu |
| CR-58 | major | `tests/test-helpers.js` | **fixed** | scope console mock per test (no shared closure). opraveno primo v canonu |
| CR-59 | major | `tests/unit/helpers.test.js` | **fixed** | try/finally sandbox cleanup in all sandbox tests. opraveno primo v canonu |
| CR-60 | major | `tests/visual/helpers.js` | **fixed** | path.relative containment (no prefix startsWith). opraveno primo v canonu |
| CR-61 | major | `tests/visual/parity.test.js` | **fixed** | non-zero MAX_DIFF_PIXEL_RATIO (e.g. 0.001). opraveno primo v canonu |
| CR-62 | major | `tests/visual/parity.test.js` | **fixed** | sequential server startup, Promise.allSettled teardown. opraveno primo v canonu |
| CR-63 | major | `tests/e2e/pages.test.js` | **fixed** | always rebuild when self-hosting artifacts (no exists() shortcut). opraveno primo v canonu |
| CR-64 | major | `tests/e2e/pages.test.js` | **fixed** | close pages in try/finally / afterEach. opraveno primo v canonu |
| CR-65 | major | `tests/e2e/pages.test.js` | **fixed** | restrict linkinator crawl to same-origin via linksToSkip. opraveno primo v canonu |
| CR-66 | major | `tests/e2e/dev-watch.test.js` | **fixed** | browser launch inside try; guaranteed child teardown; await exit event. opraveno primo v canonu |
| CR-67 | major | `tests/e2e/dev-watch.test.js` | **fixed** | bound readiness fetch with abort timeout. opraveno primo v canonu |
| CR-68 | major | `tests/e2e/docs-sync.test.js` | **fixed** | parse only fenced/inline command snippets. opraveno primo v canonu |
| CR-69 | minor | `tests/unit/serve-site.test.js` | **not-present** | restore/delete env vars in afterEach. serve-site.test.js odstranen |
| CR-70 | major | `tests/unit/validate-html.test.js` | **fixed** | add deterministic assertions to no-assert test. opraveno primo v canonu |
| CR-71 | minor | `tests/unit/config.test.js` | **fixed** | conditional env restoration (delete when originally absent). opraveno primo v canonu |
| CR-73 | minor | `tests/integration/sass.test.js` | **fixed** | exercise real custom PostCSS plugin. opraveno primo v canonu |
| CR-74 | major | `tests/integration/images-final.test.js` | **fixed** | force Sharp failure in fallback tests. opraveno primo v canonu |
| CR-75 | major | `tests/integration/mismatched-images.test.js` | **fixed** | no PNG bytes under .jpg name. opraveno primo v canonu |
| CR-76 | minor | `tests/integration/assets.test.js` | **fixed** | validate real SRI digest; assert revisioned file written. opraveno primo v canonu |
| CR-77 | minor | `tests/integration/full-build.test.js` | **not-present** | assert assets is directory. full-build.test.js odstranen |
| CR-78 | minor | `tests/unit/images-logic.test.js` | **fixed** | valid minimal PNG fixture. opraveno primo v canonu |
| CR-80 | minor | `tests/unit/serve-site.test.js` | **not-present** | deterministic SSE waits instead of fixed 50ms. serve-site.test.js odstranen |
| CR-81 | minor | `tests/unit/hero.test.js` | **not-present** | assert labels on landmark roots. hero.test.js odstranen |
| CR-82 | minor | `tests/unit/image-catalog.test.js` | **fixed** | cover uncatalogued local images. opraveno primo v canonu |
| CR-83 | trivial | `tests/unit/helpers.test.js` | **fixed** | move misplaced _variables.scss assertion. opraveno primo v canonu |
| CR-84 | trivial | `tests/*` | **fixed** | misc minor tightenings (process-data.test.js assertions, validate-html path helper, copy-static glob helper, parity matrix usage, migration-routes guard). opraveno primo v canonu |
