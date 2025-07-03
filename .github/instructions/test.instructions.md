---
applyTo: '**/*.test.js'
---

Test files must follow these standards (see also REFACTORING\_GUIDE.md):

- Use the `node:test` runner and `node:assert` for all tests.
- Each test case must have a clear, descriptive name in English.
- Cover all important use cases, including edge cases and error handling.
- Keep tests isolated and independent; avoid shared state between tests.
- Use mock data and file system mocking where appropriate.
- Prefer small, focused test functions over large, complex ones.
- Write clear comments explaining the purpose of each test section.
- Ensure all tests are readable, maintainable, and easy to extend.
- Run tests frequently and keep them up to date with code changes.
- If anything is unclear, ask for clarification.

All test code, comments, and documentation must be in English.
