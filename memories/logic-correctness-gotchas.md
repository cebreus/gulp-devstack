## Minimal Layouts Need The Shared CSS Injection Contract

- **Date Discovered:** 2026-05-25 UNKNOWN
- **Category:** Logic/Correctness
- **Context/Manifestation:** `build-prod/404.html` rendered without any stylesheet links while still using Bootstrap and component classes such as `btn`, `container`, `badge`, and `c-hero`. The root cause was that `src/routes/layout-minimal.njk` emitted only `pageInlineStyles` and skipped the same `inject:css` and `pageStyles` contract used by the default layout.
- **Rule:** Any route layout that renders shared Bootstrap or component classes must include both the global `inject:css` block and the `pageStyles` loop, not only inline styles.

## Template Date Filters Must Handle Intl Option Objects

- **Date Discovered:** 2026-05-25 UNKNOWN
- **Category:** Logic/Correctness
- **Context/Manifestation:** Visual parity between `build-prod` and `build-export` broke in the footer because `{{ site.now | date({ year: 'numeric' }) }}` was rendered differently. The root cause was that the Nunjucks `date` filter only handled the `'YYYY'` token and otherwise fell back to `toISOString()`, so object-based formats produced full ISO strings instead of a year.
- **Rule:** Keep the template `date` filter routed through the shared UTC formatter that supports both `'YYYY'` and `Intl.DateTimeFormat` option objects.

## Passing Tests Must Not Leak Expected Logger Failures

- **Date Discovered:** 2026-05-26 UNKNOWN
- **Category:** Logic/Correctness
- **Context/Manifestation:** Negative-path tests such as debug diagnostics can intentionally trigger `logger.warn()` and `logger.error()` for missing templates or missing build artifacts while still passing. When those console channels are left unsuppressed, the suite reports scary `WARN`/`ERROR` lines even though assertions succeeded, creating false-positive pipeline failure noise.
- **Rule:** Keep passing test output clean. Use `silenceConsole(beforeEach, afterEach, mock)` for `console.log` pipeline noise, and additionally mock `console.warn`/`console.error` inside any test file that intentionally exercises warn/error logger branches.

## Validate Html Tests Must Mock Console Not createLogger

- **Date Discovered:** 2026-06-08 UNKNOWN
- **Category:** Logic/Correctness
- **Context/Manifestation:** `gulp/tasks/validate-html.js` creates its `logger` once at module import time. In `tests/unit/validate-html.test.js`, mocking fresh objects returned by `loggerLib.createLogger()` did not intercept that module-scoped logger, so the expected failing-validation path still printed real `[ERROR] [ValidateHtml] ...` lines during a passing test run. The fix was to mock `console.error`/`console.warn`/`console.log`, which is the actual sink used by the captured logger.
- **Rule:** When testing `gulp/tasks/validate-html.js`, intercept console methods rather than mocking new `createLogger()` instances; the task's logger is already captured at import time.
