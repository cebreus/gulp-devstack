---
applyTo: '**/*.js'
---

JavaScript files must follow these standards (see also REFACTORING\_GUIDE.md):

- Use modern ES Modules syntax (`import`/`export`), never CommonJS
  (`require`/`module.exports`).
- Always use `async/await` for asynchronous code; avoid callbacks and
  unnecessary Promise wrapping.
- Write clear, descriptive JSDoc comments for all exported functions.
- Prefer small, pure functions and avoid deep nesting.
- Follow DRY, KISS, and SOLID principles.
- Use English for all code, variable names, comments, and documentation.
- Variable and function names must be in camelCase.
- Place reusable logic in utility modules.
- Log errors and important events using the project logger.
- Do not use the unary increment/decrement operators (`++`, `--`).
- Always run and maintain tests for all modules using `node:test` and
  `node:assert`.
- Run ESLint and Prettier to ensure code quality and formatting.
- If anything is unclear, ask for clarification.

All code must be readable, maintainable, and secure.
