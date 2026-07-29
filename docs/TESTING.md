# Testing & Quality Assurance Strategy

Gulp DevStack follows a **"Zero-Trust" Continuous Validation** model. We treat our build pipeline as a product that must be verified at every stage.

## 1. Architectural Principles

- **Build-Centric Testing Pyramid**: Since our product is a Build Pipeline, **Integration Tests** (Level 2) form the thickest core of our pyramid. E2E tests verify the final artifact, but integration tests verify the core transformations.
- **Zero-Dependency Core**: We use the native `node:test` runner and `node:assert`. No Jest, Mocha, or similar frameworks.
- **TDD First**: Prefer a narrow Red → Green → Refactor loop. Add or update the failing test first, make it pass with the smallest change, then refactor.
- **AAA Pattern (Arrange-Act-Assert)**: AAA is the default shape for tests, but what matters is an observable contract assertion, not comment ceremony.
- **Deterministic Sandboxing**: Integration tests use disposable sandbox directories (`tests/.sandboxes/`). **Cleanup Strategy**: Sandboxes must be purged in the `after()` hook regardless of test outcome to prevent CI disk exhaustion.
- **Anti-Mocking (I/O)**: Do not mock `node:fs` or `child_process`. Use real file operations inside Sandboxes to guarantee true fidelity.
- **Dependency Injection**: Gulp tasks accept `config` as a parameter — no hidden global state.
- **Artifact Integrity Guard**: All major transformation tasks (Sass, JS, HTML, Images) utilize a mandatory integrity check. If a task produces an empty file (0 bytes or below a specific threshold), the pipeline will **fail fast** and throw an error. This prevents "silent" successful builds that result in a broken website.
- **Meaningful Assertions**: Avoid existence-only checks and `assert.doesNotReject()` as the only proof. Every test should verify a real observable outcome: output content, emitted warnings, file layout, browser behavior, or thrown error contract.

## 1.1 Test Style Conventions

- Use `describe(...)` and `it(...)` from `node:test` consistently. Avoid mixing in `test(...)` unless there is a strong reason.
- Use `node:assert/strict` only. Do not use Jest/Vitest `expect(...)` or Chai/should-style assertions.
- Prefer behavior-focused `it(...)` titles such as `should render site and menu data loaded through route artifacts`.
- Keep one contract per `it(...)` block. Multiple low-level assertions are fine when they prove one behavior.
- For async guard-clauses, pair `assert.doesNotReject(...)` with a positive observation, such as a warning emission or an unchanged output.
- Use sandboxes for filesystem side-effects and clean them up in `after(...)` or `runInSandbox(...)`.

## 2. The Testing Hierarchy

### Level 1: Unit Tests (`tests/unit/`)

**Target**: Pure functions and isolated logic.

- **Scope**: Path calculations, data normalization, Nunjucks expression resolving, config parsing.
- **Command**: `pnpm test:unit`

### Level 2: Integration Tests (`tests/integration/`)

**Target**: Module interactions and file-system side-effects.

- **Scope**: Markdown → JSON pipeline, asset revisioning, SRI hash generation, SASS compilation.
- **Mechanism**: Uses `createTestSandbox()` to write mock files and verify output on disk.
- **Boundary**: Integration tests do not invoke the root full build. The master gate owns `build`, followed by artifact-only smoke tests.
- **Command**: `pnpm test:integration`

### Level 3: Smoke Tests (`tests/smoke/`)

**Target**: Verify that a real production build artifact is structurally valid.

- **Scope**: Presence of `index.html`, fingerprinted assets, SRI hashes in HTML, and the web manifest.
- **Requires**: A completed `pnpm build` before running — smoke tests do NOT trigger a build.
- **Command**: `pnpm test:smoke`

### Level 4: E2E & Accessibility Suite (`tests/e2e/`)

**Target**: The final user experience in a real browser.

- **Engine**: **Playwright** (Chromium) via `node:test`.
- **Validation**:
  - **A11y**: Axe-core checks for `wcag2a`, `wcag2aa`, and `best-practice` rules in Chromium.
  - **Link Integrity**: Dead link and broken anchor detection via **Linkinator**.
  - **Visual/UX**: Routing, meta tags, console errors, and resource 404 checks.
  - **Adaptive**: Automatically detects Showcase vs. Blank template mode.
- **Flaky Test Management**: Playwright tests are inherently prone to race conditions. Write robust locators (`waitFor()`) and utilize CI retries if necessary.
- **Local prerequisites**: Run `pnpm exec playwright install chromium` once and configure `SITE_BASE_URL` in `.env.local` (copy `.env.example`).
- **Fresh local build**: `pnpm test:e2e`
- **Existing production artifact**: `pnpm test:prod` (requires `build-prod`)
- **Existing export artifact**: `pnpm test:export` (requires `build-export`)

### Visual Parity (`tests/visual/`)

**Target**: Confirm that `build` and `export` deliver the same rendered website.

- `tests/visual/parity.test.js` compares representative routes, themes, and viewports between `build-prod` and `build-export`.
- `build` and `export` may differ in hashing, compression, minification, and handoff formatting, but they must remain **functionally and visually equivalent** in the browser.
- Treat rendered equivalence as the invariant: different artifacts are acceptable, different GUI output is not.
- Keep this suite in `verify:pipeline` as a regression guard for formatter, injection, and output-layout changes.
- **Command**: `pnpm test:visual`

## 3. Local Dev Loop vs. CI Gate

To prevent "Zero-Trust" from slowing down development, we separate local loops from final validation.

**Local Workflow (Speed is Key):**

1. Run `pnpm test:unit` for fast logic verification.
2. Run the narrowest relevant file directly, for example `node --test --test-concurrency=1 tests/integration/my-feature.test.js`.
3. Escalate to `pnpm test`, then the relevant pipeline command (`pnpm build` or `pnpm export`) only when the smaller loop is green.

**The "Master Gate" (Pre-Push / CI Validation):**
For a professional release, always follow this **deterministic order** — from fastest (static) to slowest (browser):

1. **Linting** (`pnpm lint`): Static analysis — ESLint, Stylelint, NJKLint, Prettier.
2. **Unit + Integration** (`pnpm test`): Logic and pipeline verification.
3. **Production Build** (`pnpm build`): Generating the final artifact.
4. **Smoke Tests** (`pnpm test:smoke`): Validate build artifact structure (HTML, assets, SRI hashes, manifest).
5. **Export Build** (`pnpm export`): Generate the clean handoff artifact.
6. **Build E2E Validation** (`pnpm test:prod`): Browser + accessibility checks against the production build.
7. **Export E2E Validation** (`pnpm test:export`): Browser + accessibility checks against the export build.
8. **Visual Parity** (`pnpm test:visual`): Confirm `build` and `export` render the same pages.

**Shortcut**: `pnpm verify:pipeline` executes this entire sequence automatically.

**CI sequence**: `pnpm test:ci` runs linting, unit/integration tests, the documentation contract, one production build, smoke tests, HTML validation, and browser/accessibility checks against that same artifact.

**Development loop**: `pnpm test:dev-watch` verifies rebuild/reload behaviour separately. It is not part of production E2E or CI.

---

## 4. Sandbox Utilities

To test a pipeline feature, use the utilities from `tests/test-helpers.js`:

```javascript
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
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
| `runInSandbox(prefix, fn)`   | `Promise<void>`   | Creates, passes, and always cleans a sandbox      |
| `writeFixtures(path, files)` | `Promise<void>`   | Writes a map of relative paths → content to disk  |
| `createMockEnvironment(...)` | `object`          | Returns a mock `process.env`-like object          |
| `silenceConsole(...)`        | `void`            | Silences noisy `console.log` in integration tests |

## 5. Summary Table

| Metric             | Tool        | Standard            |
| :----------------- | :---------- | :------------------ |
| **Test Runner**    | `node:test` | Native ESM          |
| **Browser Engine** | Playwright  | Chromium (headless) |
| **Accessibility**  | Axe-core    | WCAG 2.1 AA         |
| **Asset Hashing**  | SRI/SHA384  | W3C Security        |
| **Link Integrity** | Linkinator  | Recursive check     |
