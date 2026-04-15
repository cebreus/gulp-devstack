# Gulp DevStack

Gulp DevStack is a high-control static engine built for developers who demand precision over abstraction. It provides an explicit build pipeline for teams that value deterministic output, professional hand-off, and low operational overhead.

## Core Philosophy: Control Over Abstraction

Modern web development often feels like a "black box" of invisible abstractions. Gulp DevStack reverses this by providing:

- **Explicit Control**: Every asset transformation is transparent, audited, and deterministic.
- **Production Confidence**: Native SRI (Subresource Integrity) and content-based hashing are integrated, not magical.
- **Handoff Quality**: Output is clean, human-readable (in Export mode), and ready for any third-party audit or integration.

---

## Triple Pipeline Strategy

The engine operates in three distinct modes, each optimized for a specific stage of the development lifecycle:

| Pipeline          | Goal                 | Key Features                                                 | Output          |
| :---------------- | :------------------- | :----------------------------------------------------------- | :-------------- |
| **`pnpm dev`**    | Developer Velocity   | Hot-reload (BrowserSync), incremental builds, source maps.   | `build-dev/`    |
| **`pnpm build`**  | Production Hardening | Asset revisioning (hashing), SRI, minification, CSS purging. | `build-prod/`   |
| **`pnpm export`** | Professional Handoff | Optimized assets, **clean filenames** (no hashing), no SRI.  | `build-export/` |

---

## Technical Stack

- **Runtime**: Node.js >= 22.0.0 (Native ESM, `node:test`, `loadEnvFile`).
- **Orchestration**: Gulp 5 (Modern Task Runner).
- **Bundling**: esbuild (Lightning-fast JS processing).
- **Styling**: SASS + PostCSS (Autoprefixer, CSSNano, PurgeCSS) + Custom Bootstrap build.
- **Templating**: Nunjucks + Markdown (Filesystem-based routing).
- **Assets**: Sharp-powered pipeline (AVIF, WebP, SVG, LQS) & Local Google Fonts downloader.

---

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. (Optional) Purge the showcase and init a blank boilerplate
npm run init:template

# 3. Start local development
pnpm dev

# 3. Generate production-ready site
pnpm build

# 4. Generate clean static export for hand-off
pnpm export

# 5. Run the zero-dependency test suite
pnpm test
```

---

## Project Architecture

The source structure is designed for modularity and clear ownership:

- `src/config/`: Centralized site metadata and build settings.
- `src/js/`: Global JavaScript logic, shared utilities, and core entry points.
- `src/lib/components/`: Reusable UI modules (Nunjucks + SCSS).
- `src/routes/`: Filesystem-based routing (Nunjucks/Markdown mapping). Also supports isolated route assets (page-specific `.js` and `.scss`).
- `src/scss/`: Global styling, design tokens, and custom-tailored Bootstrap SCSS build.
- `src/assets/`: Global assets, including fonts automatically downloaded via Google Fonts API.

---

## Documentation

- [**Routing & Data**](docs/ROUTING.md) — How Markdown and Nunjucks merge into pages.
- [**Template Data**](docs/TEMPLATE-DATA.md) — Site and Page data reference.
- [**Nunjucks Blocks**](docs/NUNJUCKS-BLOCKS.md) — Layout hierarchy and override system.
- [**Component Workflow**](docs/COMPONENTS.md) — Building and managing modular UI units.
- [**Testing Strategy**](docs/TESTING.md) — Zero-dependency testing with `node:test`.
