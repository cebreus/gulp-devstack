# Gulp DevStack: Engineering Context

## Setup

```bash
pnpm install        # Install dependencies
pnpm dev            # Dev server with hot-reloading
pnpm build          # Production build → build-prod/
pnpm export         # Hand-off build → build-export/ (no hashing, no SRI)
pnpm run component  # Scaffold new UI component
```

## Testing & Quality

```bash
pnpm test              # Unit + integration tests (node:test)
pnpm test:e2e          # Playwright + Axe-core (A11y) + Linkinator
pnpm verify:pipeline   # Master gate: Lint → Test → Build → E2E → Budget
pnpm lint              # All linters (JS, CSS, MD, Templates, Prettier)
pnpm format            # Auto-fix lint and formatting
pnpm commit            # Guided commit via Commitizen
```

## Stack

- **Build**: Gulp 5, modular tasks in `gulp/tasks/`
- **Templates**: Nunjucks + Markdown, file-based routing in `src/routes/`
- **Styles**: Dart Sass + PostCSS + custom Bootstrap 5, scoped to `src/scss/`
- **Scripts**: esbuild, entry points in `src/js/`
- **Images**: Sharp (AVIF, WebP, SVG), pipeline in `gulp/tasks/process-images.js`
- **Tests**: `tests/unit/`, `tests/integration/`, `tests/smoke/`, `tests/e2e/`

## Code Style

- **No classes.** Use named functions: `export function foo() {}` — not `const foo = () => {}`.
- Arrow functions are allowed only as inline callbacks (`.map()`, `.filter()`).
- **ESM only.** Always use `import`/`export`. Never use `require` or `module.exports`.
- **Node.js stdlib imports must use the `node:` prefix** — e.g. `import fs from 'node:fs'`, not `import fs from 'fs'`.
- **`async/await` over callbacks.** Avoid unnecessary Promise wrapping or raw callback chains. Exception: synchronous init calls (e.g. `mkdirSync`) are acceptable before a stream pipeline starts.
- **No `++`/`--` operators.** Use `+= 1` / `-= 1` instead.
- Follow KISS, DRY, SOLID, YAGNI. Do not over-abstract.
- Keep files small. Group related code together — do not split every function into its own file.
- **Use libraries, not custom code.** E.g. for A11y: `axe-core`, for link checking: `linkinator`.
- Files starting with `_` (e.g. `_draft.md`) are ignored by the build pipeline until renamed.
- **Types via JSDoc only.** No TypeScript, no external `.d.ts` files. Use inline `/** @param {string} foo */` annotations.
- **Named constants over magic values.** Use `const MAX_RETRIES = 3` instead of bare `3`. Use SCREAMING\_SNAKE\_CASE for module-level constants.
- **Destructure multi-argument options into a single object param** — applies to *optional config/options objects*, not to primary positional args like `src` or `dest`. E.g. `function foo(src, dest, { minify = false, sourceMaps = false } = {})`.
- **Unused callback parameters must use the `_` prefix** — e.g. `transform(file, _enc, cb)`.
- **Dynamic `import()` for optional or heavy dependencies** that are not always needed (e.g. `const { default: sri } = await import('gulp-sri-hash')`).
- **Parallel async with `Promise.all()`** or `gulp.parallel()` when tasks are independent.
- **Module export convention:** one `export default` for the primary entry point (function *or* API object) + named `export function` for all public helpers in the same file.
- **Internal-only functions use `@private` JSDoc tag** — they are not exported and not part of the public API.

## Naming

- **Booleans:** `is*`, `has*`, `can*`, `should*`
- **Data converters:** `to*`, `from*`, `build*`, `extract*`
- **Utilities:** `ensure*`, `get*`, `handle*`, `attach*`
- **Task files** (`gulp/tasks/`): verb + noun, kebab-case — e.g. `process-html.js`
- **Utility files** (`gulp/utils/`): domain noun, kebab-case — e.g. `data-helpers.js`
- **Data keys must be camelCase** — e.g. `pageId`, `openGraph`, `twitterCards`. No snake\_case or PascalCase in data objects.

## SCSS & Templates

- **Bootstrap utility-first.** Always use Bootstrap utility classes for layout and spacing. Create custom `u-` utilities only when Bootstrap does not provide the needed functionality.
- **BEM naming:** `c-` for components, `o-` for objects, `u-` for utilities — e.g. `c-card__title`, `u-text-glow`.
- Each component has its own folder: `src/lib/components/[name]/[name].{njk,scss,md}`.
- **Flat selectors.** Avoid deep nesting in SCSS. Keep specificity low.
- Do not duplicate Bootstrap utilities. Do not override Bootstrap components directly — override SCSS variables before the `@import` instead.
- **Nunjucks:** Always validate data before rendering — `{% if variable %}`. Pass data via `{% set %}`, not `with`.
- Document each component's data schema in its `.md` file.

## Error Handling & Logging

- Never hide errors. Always use `Error.cause`: `throw new Error('Context.', { cause: originalError })`
- Fail fast. Check inputs at the top of every function. No nested `if/else` blocks.
- Log early exits with `logger.verbose()` or `logger.debug()` — never return silently.
- Create a scoped logger per task: `const logger = loggerLib.createLogger('TaskName')` (CamelCase).
- **Graceful degradation** (log `warn` + return fallback) is acceptable only for non-critical processing (e.g. template expression rendering). Real I/O and pipeline errors must always throw with `Error.cause`.
- All `validate*` functions must return `{ isValid: boolean, error: string | null }`. Never a plain boolean.

## Tests

- Use `node:test` runner and `node:assert` — never Jest, Mocha, or similar.
- Tests must be isolated and independent — no shared state between test cases.
- Use mock data and filesystem mocking where appropriate.
- Follow the AAA pattern: Arrange → Act → Assert.
- Cover edge cases and error paths, not just the happy path.

## Agent Protocol & Integrity (CRITICAL)

### Verification over Hallucination

- **"I don't know" is a valid answer.** If the state of the codebase is unclear, you MUST use tools (`grep_search`, `read_file`, `pnpm lint`) to verify before making any claims.
- **Never infer tool results.** Do not state that `pnpm format` or `pnpm test` passed unless you have successfully executed the command in the current turn and inspected the output.
- **No Sycophancy.** Do not agree with the user's negative feedback by inventing technical errors that do not exist. Analyze the failure based on actual code and logs, not on sentiment.

### Refactoring & Code Movement

- **Preserve, don't recreate.** When refactoring or moving code, use the `replace` tool to surgically move blocks. Do not use `write_file` to regenerate entire files from scratch, as it destroys original context, comments.
- **Context Integrity.** A refactoring is only successful if the original logic, comments, and intent are preserved. "Cleaner looking" code that loses original documentation is a failure.

### Communication Standards

- **Zero Self-Flagellation.** Avoid over-apologizing or emotional filler. If a mistake is made, provide a brief, technical root-cause analysis and a verified path to correction.
- **Empirical Reporting.** Every claim about the codebase status MUST be backed by a tool output within the conversation history. If it's not in the logs, it's not a fact.

### Decision Hierarchy

1. **Verify:** Read the code/Run the tool.
2. **Analyze:** Compare against standards in this document.
3. **Execute:** Apply minimal, surgical changes.
4. **Validate:** Confirm success with tests and linters.

## Agent Checklist

Before submitting code, verify:

1. Did I use a library instead of writing custom logic?
2. Did I use named `function` declarations (not classes or arrow functions at the top level)?
3. Are boolean functions named with `is`, `has`, `can`, or `should`?
4. Are inputs validated at the start of the function?
5. Did I preserve `originalError` when catching errors?
6. Does the refactored code still pass all tests?
