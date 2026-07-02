## 🎯 Overview
This PR introduces a monumental architectural refactor and upgrade of the DevStack. It brings the project up to modern Node.js standards (Node >=24.10.0), upgrades the core engine to **Gulp 5**, entirely modularises the build pipeline, and establishes a strict, Fail-Closed testing and DX environment. 

This is a major release candidate (`v5.0.0`).

## 🚀 Key Changes

### 1. Core Build System & Gulp 5
- **Upgraded to Gulp 5:** Improved streaming, incremental builds, and task parallelism.
- **Domain-Driven Architecture:** Completely refactored `gulpfile.js` and split Gulp utilities into explicit domain modules (`html-rendering`, `image-pipeline`, `sass-pipeline`).
- **Style Compilation:** Split global CSS into explicit bundles, extracted shared route Sass abstracts, and tightened the PurgeCSS logic.
- **Pipeline Optmisation:** Centralised route content artifacts and improved image optimization (Sharp).

### 2. Testing & Quality Gates (Fail-Closed)
- **Native Node Testing:** Rolled out a comprehensive test suite using `node:test` and `node:assert` (Zero third-party test runners).
- **Test Categories:** Expanded coverage across `tests/unit`, `tests/integration`, and `tests/e2e` (including Docs sync and template purges).
- **Visual Regression:** Added visual parity tests to guarantee build vs. export stability.

### 3. Developer Experience (DX) & Tooling
- **Git Hooks:** Migrated from Husky to **Lefthook** for faster and more reliable pre-commit checks.
- **ESLint Flat Config:** Modernised linting configuration with ESLint v10 Flat Config and cleaned up deprecated rules.
- **Init Script:** Added a brand new `scripts/init-template.js` to intelligently initialize new projects, purging non-baseline templates and tests.
- **Quality Tools:** Consolidating quality checkers towards Fallow-based pipelines and resolving lingering JSDoc warnings.

### 4. Documentation & AI Guidelines
- **Memories/ System:** Introduced the `memories/` directory containing explicit, curated guidelines for AI agents (`architectural-gotchas`, `logic-correctness`, etc.).
- **Guides:** Rewrote core documentation, component lists, and project integration guidelines.

## ⚠️ Breaking Changes
- Requires **Node.js `>=24.10.0`**.
- Fully ESM-first JavaScript (CommonJS is no longer supported in the build pipeline).
- Replaced outdated Ruby-based CSS linting and isolated tools (jscpd) with modern equivalents (Stylelint, Fallow).

## 📝 Merge & Release Strategy
1. Merge this PR into `develop`.
2. Execute `pnpm run release` on `develop` to auto-generate `CHANGELOG.md`, bump the version to `v5.0.0`, tag the release, and push to `master`.
