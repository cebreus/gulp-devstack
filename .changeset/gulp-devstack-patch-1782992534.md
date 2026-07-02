---
"gulp-devstack": patch
---

- test(suite): add unit tests for changed-filter, private-streams, validate-html, and run-njklint
- test(suite): add unit tests for gulpfile structure and module boundaries
- test(suite): add integration tests for clean-build, copy-static, process-html, and process-js-routes
- test(suite): rename images\_final.test.js to images-final.test.js for naming consistency
- test(suite): add runInSandbox and silenceConsole helpers to test-helpers
- test(suite): rename mockEnv to createMockEnvironment
- test(suite): suppress logger warn and error output in passing test runs
- test(suite): refactor visual parity suite to explicit named test cases
