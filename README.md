# Gulp DevStack

High-control static web workflow with predictable output and zero-trust validation. Built on **Gulp 5**, **Nunjucks**, **Dart Sass**, **PostCSS**, **esbuild**, and **Sharp**.

- **Project Website**: [gulp-devstack.cebre.us](https://gulp-devstack.cebre.us)
- **Documentation**: [Technical Guides](https://gulp-devstack.cebre.us/about)
- **Reference**: [Showcase & Components](https://gulp-devstack.cebre.us/showcase)

---

## Architectural Philosophy

Gulp DevStack is designed for developers who demand precision. It rejects framework abstractions in favor of explicit control and deterministic output.

### 1. Template-Based Routing

Every routable Nunjucks template in `src/routes/` maps directly to public HTML. Internal layout files use the `layout-*.njk` prefix and are excluded from output.

- `src/routes/index.njk` → `/`
- `src/routes/404.njk` → `/404.html`
- `src/routes/about/index.njk` → `/about/`

### 2. Hybrid Data Architecture (The Merge Pattern)

Routes support an "Override & Merge" pattern. If a folder contains both `.njk` (template) and `.md` (data), the build engine automatically merges them. The `.md` frontmatter and content are compiled into `.temp/pages/*.json` and injected into the Nunjucks context as `page`, allowing a clean split between presentation and content.

### 3. Isolated Page Assets

To prevent bundle bloat, the pipeline supports **Asset Autodiscovery**. If you create `src/routes/my-page/index.scss` or `index.js`, they are automatically compiled and injected *only* into that specific page.

---

## Technical Standards & Pipeline

### Triple-Pipeline Strategy

1. **Development Mode** (`pnpm dev`): Optimized for speed. Hot-reloading via BrowserSync (strictly on port 3000), source maps, and incremental builds.
2. **Production Build** (`pnpm build`): Optimized for security and performance. Assets are revisioned (fingerprinted), SRI hashes are injected, and CSS is purged.
3. **Export Mode** (`pnpm export`): A clean handoff mode. It keeps readable, non-hashed CSS/JS and formats HTML, while preserving the same route structure as the production build.

### Zero-Trust Verification

The `verify:pipeline` command ensures the project never regresses:

- **WCAG Audits**: Automated accessibility checks via Playwright and Axe-core.
- **Link Integrity**: Exhaustive validation of all internal links and anchors.
- **Visual Parity**: Automated screenshot comparison between Build and Export modes to ensure visual consistency across pipelines.
- **Strict Validation**: HTML5 structure verification via `html-validate`.
- **Graph Awareness**: `graphify update .` refreshes `graphify-out/graph.json`, `graphify-out/graph.html`, and `graphify-out/GRAPH_REPORT.md` after code changes.

---

## Project Structure

```text
├── gulp/              # Modular task definitions & pipeline logic
├── scripts/           # Release, lint wrapper, and hook support scripts
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
├── docs/              # Technical documentation
├── memories/          # Agent-maintained project gotchas
└── graphify-out/      # Knowledge graph outputs
```

## Advanced Commands

- `pnpm verify:pipeline` - The canonical CI/CD check.
- `pnpm test:ci` - Runs `test`, `test:smoke`, and `test:e2e`; requires a build artifact first.
- `pnpm test:visual` - Run visual regression tests.
- `pnpm run component` - Scaffold new Nunjucks/SCSS components via Plop.
- `graphify update .` - Refresh the local code graph after code changes.

## License

MIT - Developed by [Jaroslav Vrana](https://github.com/cebreus)
