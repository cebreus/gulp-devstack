# Gulp DevStack

**Gulp DevStack** is a high-performance, modern build system for creating static websites (SSG). It combines the simplicity of static sites with the power of modern frontend tooling, giving you absolute control over your code without the bloat of heavy frameworks.

Whether you are building a simple landing page or a complex static site with a Headless CMS, Gulp DevStack delivers professional-grade, zero-dependency outputs ready for any environment.

## Why Gulp DevStack?

- **Transparent & Zero-Magic**: What you write is what you get. No hidden framework magic. Full control over the final HTML, CSS, and JS.
- **Production-Ready by Default**: Built-in asset optimization (WebP/AVIF), Subresource Integrity (SRI) security hashes, and strict accessibility (A11y) checks.
- **Agency & Handoff Friendly**: The `export` pipeline generates clean, unhashed, highly readable source code perfect for client handoffs or integration into legacy systems.
- **Content-Driven**: Seamlessly integrates Nunjucks templates with Markdown. Ready for any Headless CMS.
- **AI-Ready Architecture**: Ships with pre-configured agent context (`AGENTS.md` and `.github/instructions/*.md`) and strict coding conventions. This ensures LLM assistants can instantly understand, refactor, and extend the codebase without friction or hallucinations.

## Quick Start

1. **Install dependencies**: `pnpm install`
2. **Scaffold a blank project** *(Optional)*: `pnpm run init:template`
3. **Start the local dev server** (with Hot-Reloading): `pnpm dev`
4. **Build the final production website**: `pnpm build`

## Three Ways to Build

| Command           | Goal             | Features                                     | Output Folder   |
| :---------------- | :--------------- | :------------------------------------------- | :-------------- |
| **`pnpm dev`**    | Fast Development | Local server, auto-reload, source maps.      | `build-dev/`    |
| **`pnpm build`**  | Production       | Minified files, security hashes, A11y tests. | `build-prod/`   |
| **`pnpm export`** | Static Export    | Clean filenames (no hashes), handoff ready.  | `build-export/` |

## Technical Details

- **Engine**: Node.js 22+, Gulp 5
- **Scripts**: esbuild (ESM only, highly optimized)
- **Styles**: Bootstrap 5 (utility-first approach with BEM methodology), Dart Sass, PostCSS, Autoprefixer, CSSNano, PurgeCSS
- **Templates**: Nunjucks & Markdown
- **Image optimization and conversion**: SVGO (SVG), Sharp (AVIF, JPEG, WebP), uPNG (PNG)
- **Generators**: Favicons (cross-platform manifests & icons), Google Webfonts
- **Quality Assurance**: ESLint, Stylelint, Remark (Markdown), Nunjucklinter, Prettier, Husky, Commitlint, Size-limit
- **Testing**: Native `node:test`, Playwright, axe-core, HTML-Validate, Linkinator
- **Dev Server**: BrowserSync (Hot-reloading)

## Developer Experience (DX)

Gulp DevStack solves common frontend headaches right out of the box, providing a rich set of integrated tools for a premium development workflow:

- **Integrated & Buildable Bootstrap**: Bootstrap 5 is built directly within the pipeline, allowing you to easily customize variables and generate only the CSS you need.
- **BEM Styling with Linting**: Enforced BEM (Block Element Modifier) architecture backed by strict `stylelint` rules to keep your styles clean and maintainable.
- **Advanced Asset Optimization**:
  - Automated WebP and AVIF generation via Sharp.
  - SVG optimization using **SVGO**.
  - All internal assets are optimized for maximum quality and minimum file size (without altering dimensions).
- **Automated Generators**:
  - **Component Installer**: Quickly scaffold new UI components from the CLI (`pnpm run component`).
  - **Google Webfonts**: Automatically download, subset, and self-host fonts.
  - **Favicon Generator**: Create all necessary app icons and manifests automatically.
  - **TODO Generator**: Extracts inline TODOs into a unified list.
- **Code Quality & Tooling**:
  - **Husky & Commitlint**: Pre-commit hooks ensure conventional commits and code formatting.
  - **Size-limit**: Built-in bundle budget checks to prevent performance regressions.
  - **Optional Source Maps**: Easily debug your code during development.
  - **Automated Releases**: Versioning, changelog generation, and tagging via `release-it`.
  - **CI/CD Deployment**: Pre-configured GitHub Actions workflow for zero-touch deployments directly to **GitHub Pages**.

### Automated Release

To create a new version (tags, changelog, version bump), run:

```bash
pnpm run release
```

On-demand release process, ensuring your `package.json` and `pnpm-lock.yaml` remain clean.

## Documentation & Architecture

Gulp DevStack uses a modular, file-based architecture. For detailed information on the project structure, routing, and data pipelines, please refer to our documentation:

- [**Pages & Routing**](docs/ROUTING.md) — File-based routing and permalinks.
- [**Data**](docs/TEMPLATE-DATA.md) — How to use JSON/Markdown data in your templates.
- [**Components**](docs/COMPONENTS.md) — BEM naming and UI Architecture.
- [**Testing**](docs/TESTING.md) — Zero-Trust and E2E validation.
- [**Engineering Context (AGENTS.md)**](AGENTS.md) — Core coding standards and AI-ready rules.
