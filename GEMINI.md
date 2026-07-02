# GEMINI

## Project

Gulp DevStack is a static-site build system for Nunjucks, Markdown, SCSS, and JS.
This file is the canonical instruction set for AI agents in this repository.

## Stack

- Node.js `>=24.10.0`
- pnpm
- ESM-first JavaScript
- Gulp 5, Nunjucks, Markdown, Dart Sass, PostCSS, esbuild, Sharp
- Tests: `node:test` + `node:assert`
- Types: JSDoc only
- No TypeScript

## Commands

```bash
pnpm install
pnpm dev
pnpm build
pnpm export
pnpm test
pnpm test:e2e
pnpm lint
pnpm format
pnpm verify:pipeline
pnpm run component
```

## Architecture

- Keep side-effects at boundaries: file system, build pipelines, streams, external tools.
- Keep core logic pure, deterministic, and directly unit-testable.
- Prefer domain modules over mixed utilities.
- Preserve public seams unless all callers and tests are updated.

## Rules

- IMPORTANT: Treat `package.json`, `eslint.config.js`, and relevant lint/test configs as executable project policy; inspect them before coding.
- IMPORTANT: TDD first. Write or update a failing test before implementation, then make it pass, then refactor.
- IMPORTANT: Code must stay strictly testable. Isolate side-effects at boundaries.
- IMPORTANT: If a fix expands into multi-file refactoring or architecture change, stop and ask for approval.
- IMPORTANT: Do not guess. If context is missing, say "I don't know" and inspect code, config, or command output.
- IMPORTANT: Never claim success unless the relevant tests or commands were run and verified in the current turn.
- IMPORTANT: Commits are forbidden by default.
- IMPORTANT: Exception: commit only to safeguard a fully verified, atomic chunk before a risky change.
- Lint covers only part of repository policy.
- Prefer named functions in production JS.
- Avoid classes for app logic.
- Use `node:` stdlib imports.
- Fail fast.
- Preserve `Error.cause` when rethrowing.
- Keep `validate*` return shape `{ isValid: boolean, error: string | null }`.
- Use libraries instead of custom reinventions when a standard package already fits.
- Passing tests must not emit expected `warn`/`error` noise that looks like a real failure.

## Workflow

1. Read the touched files, `package.json`, and the relevant project config first.
2. If the task touches JS, inspect `eslint.config.js`.
3. If the task touches styles, templates, or docs, inspect the matching linter/formatter config and scripts.
4. If `graphify` CLI is available and `graphify-out/graph.json` exists, try using it before manual spelunking.
5. Refresh the graph only if it is stale and the task warrants it.
6. If the task touches architecture, build pipeline, dependencies, or tricky logic, read the relevant file in `memories/`.
   - For Build Pipeline-related constraints, read memories/build-pipeline-gotchas.md
   - For Dependency-related constraints, read memories/dependency-gotchas.md
   - For Logic/Correctness-related constraints, read memories/logic-correctness-gotchas.md
   - For Architectural-related constraints, read memories/architectural-gotchas.md
7. Add or update the failing test first.
8. Implement the smallest possible change.
9. Refactor only with tests green and only inside the approved scope.
10. Run the narrowest relevant verification, then broader checks if needed.
11. Report only facts verified from files, tests, config, or command output in the current turn.

## Out of scope

- Do not perform broad refactors without approval.
- Do not reduce testability by hiding logic inside gulp glue, streams, or orchestration.
- Do not regenerate whole files when a surgical edit preserves context better.
- Do not invent tool results, architecture facts, or bug causes.
- Do not commit, rewrite history, or make destructive repo changes unless explicitly allowed above.
