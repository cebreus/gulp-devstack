## Minimal Layouts Need The Shared CSS Injection Contract

- **Date Discovered:** 2026-05-25 UNKNOWN
- **Category:** Logic/Correctness
- **Context/Manifestation:** `layout-minimal.njk` skip `inject:css` and `pageStyles`. Pages miss Bootstrap/component CSS.
- **Rule:** Route layout using Bootstrap/components must include global `inject:css` block and `pageStyles` loop.

## Template Date Filters Must Handle Intl Option Objects

- **Date Discovered:** 2026-05-25 UNKNOWN
- **Category:** Logic/Correctness
- **Context/Manifestation:** Nunjucks `date` filter fail object formats, fallback to `toISOString()`. Break `build-prod` vs `build-export` parity.
- **Rule:** Route template `date` filter via shared UTC formatter supporting `'YYYY'` and `Intl.DateTimeFormat` objects.

## Passing Tests Must Not Leak Expected Logger Failures

- **Date Discovered:** 2026-05-26 UNKNOWN
- **Category:** Logic/Correctness
- **Context/Manifestation:** Negative-path tests trigger `logger.warn()`/`logger.error()`. Create false-positive pipeline failure noise.
- **Rule:** Use `silenceConsole` for `console.log`. Mock `console.warn`/`console.error` in tests exercising logger branches.

## Validate Html Tests Must Mock Console Not createLogger

- **Date Discovered:** 2026-06-08 UNKNOWN
- **Category:** Logic/Correctness
- **Context/Manifestation:** `validate-html.js` create logger at module import. Mocking `createLogger()` fail intercept. Noise leak into test output.
- **Rule:** Intercept `console.*` directly when testing `validate-html.js`. Logger already captured at import.

## POSIX Glob Path Normalization

- **Date Discovered:** 2026-06-11
- **Category:** Logic/Correctness
- **Context/Manifestation:** `globSync` with `{ posix: true }` fail match Windows `\` paths from `path.join`.
- **Rule:** Centralize path normalization in `gulp/config.js` via `toPosixPath()`. Base paths must be POSIX-compliant.

## Cross-Platform Directory Resolution from Globs

- **Date Discovered:** 2026-06-11
- **Category:** Logic/Correctness
- **Context/Manifestation:** Base dir extraction from glob fail on Windows if only check `/`.
- **Rule:** Use `Math.max(sub.lastIndexOf('/'), sub.lastIndexOf('\\'))` to find last directory separator.

## Windows-Safe Script Entrypoint Detection

- **Date Discovered:** 2026-06-11
- **Category:** Logic/Correctness
- **Context/Manifestation:** Direct entrypoint detection fail on Windows due to drive letter case/slashes.
- **Rule:** Normalize paths and use case-insensitive compare on Windows for `isDirectRun`.
