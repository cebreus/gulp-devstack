# Gulp DevStack

High-control static web workflow with predictable output and zero-trust validation. Built on **Gulp 5**, **Nunjucks**, **Dart Sass**, and **esbuild**.

- **Project Website**: [gulp-devstack.cebre.us](https://gulp-devstack.cebre.us)
- **Documentation**: [Technical Guides](https://gulp-devstack.cebre.us/about)
- **Reference**: [Showcase & Components](https://gulp-devstack.cebre.us/showcase)

---

## Architectural Philosophy

Gulp DevStack is designed for developers who demand precision. It rejects framework abstractions in favor of explicit control and deterministic output.

### 1. File-Based Routing

Every file or directory in `src/routes/` maps directly to a public URL.

- `src/routes/index.njk` → `/`
- `src/routes/404.njk` → `/404.html`
- `src/routes/about/index.md` → `/about/`

### 2. Hybrid Data Architecture (The Merge Pattern)

Routes support an "Override & Merge" pattern. If a folder contains both `.njk` (template) and `.md` (data), the build engine automatically merges them. The `.md` frontmatter and content are injected into the Nunjucks context, allowing a clean split between presentation and content.

### 3. Isolated Page Assets

To prevent bundle bloat, the pipeline supports **Asset Autodiscovery**. If you create `src/routes/my-page/index.scss` or `index.js`, they are automatically compiled and injected *only* into that specific page.

---

## Technical Standards & Pipeline

### Triple-Pipeline Strategy

1. **Development Mode** (`pnpm dev`): Optimized for speed. Hot-reloading via BrowserSync (strictly on port 3000), source maps, and incremental builds.
2. **Production Build** (`pnpm build`): Optimized for security and performance. Assets are revisioned (fingerprinted), SRI hashes are injected, and CSS is purged.
3. **Export Mode** (`pnpm export`): A specialized mode that flattens the directory structure for hosting environments that don't support clean URLs natively.

### Zero-Trust Verification

The `verify:pipeline` command ensures the project never regresses:

- **WCAG Audits**: Automated accessibility checks via Playwright and Axe-core.
- **Link Integrity**: Exhaustive validation of all internal links and anchors.
- **Visual Parity**: Automated screenshot comparison between Build and Export modes to ensure visual consistency across pipelines.
- **Strict Validation**: HTML5 structure verification via `html-validate`.

---

## Project Structure

```text
├── gulp/              # Modular task definitions & pipeline logic
├── src/
│   ├── assets/        # Global images, fonts, and icons
│   ├── config/        # Centralized site metadata (site.js, env.js)
│   ├── js/            # Global scripts bundled via esbuild
│   ├── lib/           # Shared Nunjucks components & partials
│   ├── routes/        # Source for pages (Routing & Content)
│   └── scss/          # Global styles (Bootstrap 5.3 + Custom overrides)
├── tests/
│   ├── unit/          # Pure logic testing
│   ├── integration/   # Pipeline & Gulp task validation
│   ├── e2e/           # Browser-based integrity & A11y checks
│   └── visual/        # Cross-pipeline visual parity checks
└── docs/              # Deep technical documentation
```

## Advanced Commands

- `pnpm verify:pipeline` - The canonical CI/CD check.
- `pnpm test:visual` - Run visual regression tests.
- `pnpm run component` - Scaffold new Nunjucks/SCSS components via Plop.

## License

MIT - Developed by [Jaroslav Vrana](https://github.com/cebreus)
