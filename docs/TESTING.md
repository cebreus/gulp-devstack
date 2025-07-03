# Testing Strategy & Implementation

Gulp DevStack utilizes a modern, zero-dependency testing approach powered by the native `node:test` runner. The suite is designed for high reliability, fast execution, and deterministic validation of the build pipeline.

## 1. Core Principles

- **Zero-Dependency:** No external test frameworks (Jest, Mocha, Chai). We use native `node:test` and `node:assert`.
- **AAA Pattern:** All tests follow the **Arrange-Act-Assert** structure for clarity.
- **Isolation:** Tests use a sandbox mechanism to avoid side effects on the source repository.
- **Dependency Injection (DI):** Core Gulp tasks are refactored to accept configuration and dependencies, enabling precise unit testing.

## 2. Test Categories

The suite is divided into three distinct layers, providing a balanced coverage (The Testing Trophy):

### Unit Tests (`tests/unit/`)

Focus on pure functions and isolated logic.

- **Scope:** Configuration parsing, HTML transformations, path calculations, data processing.
- **Goal:** 100% coverage of "clean" utility functions.
- **Command:** `npm run test:unit`

### Integration Tests (`tests/integration/`)

Validate the interaction between multiple modules or the file system.

- **Scope:** Data pipeline (Markdown to JSON), Asset pipeline (Revisioning, SRI), Image optimization.
- **Goal:** Ensure that transformations produce the expected file structure and content.
- **Command:** `npm run test:integration`

### Smoke Tests (`tests/smoke/`)

High-level end-to-end tests that run the actual Gulp build in a controlled environment.

- **Scope:** Full Build and Export pipelines.
- **Mechanism:** Uses `createTestSandbox()` from `test-helpers.js` to create a temporary workspace, symlink dependencies, and run a real `gulp build`.
- **Goal:** Verify that the entire stack can produce a valid, production-ready website.
- **Command:** `npm run test:smoke`

## 3. Running Tests

| Command                    | Description                                      |
| :------------------------- | :----------------------------------------------- |
| `npm test`                 | Runs the entire test suite.                      |
| `npm run test:unit`        | Runs only unit tests.                            |
| `npm run test:integration` | Runs only integration tests.                     |
| `npm run test:smoke`       | Runs smoke (E2E) tests.                          |
| `npm run test:coverage`    | Generates a coverage report (requires Node 20+). |

## 4. Test Helpers & Sandboxing

The `tests/test-helpers.js` file provides essential utilities for pipeline testing:

- `createTestSandbox()`: Creates a unique temporary directory for the test.
- `cleanupSandbox()`: Safely removes the temporary directory.
- `writeFixtures()`: Programmatically creates source files for testing.

## 5. Adding New Tests

When adding features, follow these naming conventions:

- **File:** `[feature-name].test.js`
- **Description:** Use `should [expected behavior] when [condition]`.

Example:

```javascript
import assert from 'node:assert/strict';
import { it, describe } from 'node:test';
import { someUtility } from '../../gulp/utils/helpers.js';

describe('Some Utility', () => {
  it('should return capitalized string when input is lowercase', () => {
    // Arrange
    const input = 'hello';
    // Act
    const result = someUtility(input);
    // Assert
    assert.strictEqual(result, 'Hello');
  });
});
```
