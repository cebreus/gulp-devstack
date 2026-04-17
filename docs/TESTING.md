# Testing & Quality Assurance Strategy

Gulp DevStack follows a **"Zero-Trust" Continuous Validation** model. We treat our build pipeline as a product that must be verified at every stage.

## 1. Architectural Principles

- **Build-Centric Testing Pyramid**: Since our product is a Build Pipeline, **Integration Tests** (Level 2) form the thickest core of our pyramid. E2E tests verify the final artifact, but integration tests verify the core transformations.
- **Zero-Dependency Core**: We use the native `node:test` runner and `node:assert`. No Jest, Mocha, or similar frameworks.
- **AAA Pattern (Arrange-Act-Assert)**: Every test case is structured into three clear phases.
- **Deterministic Sandboxing**: Integration tests use disposable sandbox directories (`tests/.sandboxes/`). **Cleanup Strategy**: Sandboxes must be purged in the `after()` hook regardless of test outcome to prevent CI disk exhaustion.
- **Anti-Mocking (I/O)**: Do not mock `node:fs` or `child_process`. Use real file operations inside Sandboxes to guarantee true fidelity.
- **Dependency Injection**: Gulp tasks accept `config` as a parameter — no hidden global state.
- **Artifact Integrity Guard**: All major transformation tasks (Sass, JS, HTML, Images) utilize a mandatory integrity check. If a task produces an empty file (0 bytes or below a specific threshold), the pipeline will **fail fast** and throw an error. This prevents "silent" successful builds that result in a broken website.

---

## 2. The Testing Hierarchy

### Level 1: Unit Tests (`tests/unit/`)

**Target**: Pure functions and isolated logic.

- **Scope**: Path calculations, data normalization, Nunjucks expression resolving, config parsing.
- **Command**: `pnpm test:unit`

### Level 2: Integration Tests (`tests/integration/`)

**Target**: Module interactions and file-system side-effects.

- **Scope**: Markdown → JSON pipeline, asset revisioning, SRI hash generation, SASS compilation.
- **Mechanism**: Uses `createTestSandbox()` to write mock files and verify output on disk.
- **Command**: `pnpm test:integration`

### Level 3: Smoke Tests (`tests/smoke/`)

**Target**: Verify that a real production build artifact is structurally valid.

- **Scope**: Presence of `index.html`, fingerprinted assets, SRI hashes in HTML, rev-manifest.
- **Requires**: A completed `pnpm build` before running — smoke tests do NOT trigger a build.
- **Command**: `pnpm test:smoke`

### Level 4: E2E & Accessibility Suite (`tests/e2e/`)

**Target**: The final user experience in a real browser.

- **Engine**: **Playwright** (Chromium) via `node:test`.
- **Validation**:
  - **A11y**: WCAG 2.1 AA compliance check via **Axe-core** (`wcag2a`, `wcag2aa`, `best-practice`).
  - **Link Integrity**: Dead link and broken anchor detection via **Linkinator**.
  - **Visual/UX**: Routing, meta tags, console errors, and resource 404 checks. Note: Pixel-perfect visual regression testing is currently out-of-scope; we rely on DOM assertions.
  - **Adaptive**: Automatically detects Showcase vs. Blank template mode.
- **Flaky Test Management**: Playwright tests are inherently prone to race conditions. Write robust locators (`waitFor()`) and utilize CI retries if necessary.
- **Command**: `pnpm test:e2e`

---

## 3. Local Dev Loop vs. CI Gate

To prevent "Zero-Trust" from slowing down development, we separate local loops from final validation.

**Local Workflow (Speed is Key):**

1. Run `pnpm test:unit` for fast logic verification.
2. Run targeted integration tests (`pnpm test:integration tests/integration/my-feature.test.js`).

**The "Master Gate" (Pre-Push / CI Validation):**
For a professional release, always follow this **deterministic order** — from fastest (static) to slowest (browser):

1. **Linting** (`pnpm lint`): Static analysis — ESLint, Stylelint, NJKLint, Prettier.
2. **Unit + Integration** (`pnpm test`): Logic and pipeline verification.
3. **Production Build** (`pnpm build`): Generating the final artifact.
4. **Smoke Tests** (`pnpm test:smoke`): Validate build artifact structure (HTML, assets, SRI hashes, manifest).
5. **E2E Validation** (`pnpm test:prod`): Browser + accessibility checks against the production build.
6. **Performance Budget** (`pnpm sanity:budget`): Size-limit check.

**Shortcut**: `pnpm verify:pipeline` executes this entire sequence automatically.

**CI sequence**: `pnpm test:ci` runs `test → test:smoke → test:e2e` in series (requires a pre-existing build).

---

## 4. Sandbox Utilities

To test a pipeline feature, use the utilities from `tests/test-helpers.js`:

```javascript
import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'
import { createTestSandbox, cleanupSandbox, writeFixtures } from '../test-helpers.js'

describe('My Feature', () => {
  let sandboxPath

  before(async () => {
    // Returns a string path to an isolated temp directory
    sandboxPath = await createTestSandbox('my-feature-test')
  })

  after(async () => {
    await cleanupSandbox(sandboxPath)
  })

  it('should generate valid output (Happy Path)', async () => {
    // 1. Arrange: Write mock files into the sandbox
    await writeFixtures(sandboxPath, {
      'src/routes/index.md': '---\ntitle: Home\n---\n# Hello',
    })

    // 2. Act: Run the task under test
    // ...

    // 3. Assert: Verify the existence and content of output files
    const output = await fs.readFile(path.join(sandboxPath, 'output.json'), 'utf8')
    assert.ok(output.includes('Home'))
  })

  it('should handle missing files gracefully (Negative Test)', async () => {
    // 1. Arrange: Empty sandbox (no fixtures)
    // 2. Act & 3. Assert: Verify the task throws with expected cause
    await assert.rejects(
      async () => { /* run task */ },
      { message: /invalid input/ }
    )
  })
})
```

**Available helpers:**

| Function                     | Returns           | Purpose                                           |
| :--------------------------- | :---------------- | :------------------------------------------------ |
| `createTestSandbox(prefix)`  | `Promise<string>` | Creates isolated temp directory, returns its path |
| `cleanupSandbox(path)`       | `Promise<void>`   | Removes the sandbox directory                     |
| `writeFixtures(path, files)` | `Promise<void>`   | Writes a map of relative paths → content to disk  |
| `mockEnv(overrides)`         | `object`          | Returns a mock `process.env`-like object          |

---

## 5. Summary Table

| Metric             | Tool        | Standard            |
| :----------------- | :---------- | :------------------ |
| **Test Runner**    | `node:test` | Native ESM          |
| **Browser Engine** | Playwright  | Chromium (headless) |
| **Accessibility**  | Axe-core    | WCAG 2.1 AA         |
| **Asset Hashing**  | SRI/SHA384  | W3C Security        |
| **Performance**    | Size-limit  | Custom Budgets      |
| **Link Integrity** | Linkinator  | Recursive check     |
