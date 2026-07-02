---
"gulp-devstack": patch
---

- chore(deps): bump node engine requirement to >=24.10.0
- chore(deps): add pnpm-workspace.yaml with allowBuilds entries for native packages
- chore(deps): move dependency overrides to pnpm-workspace.yaml per pnpm 11+ rules
- chore(deps): upgrade eslint to v10, cssnano to v8, html-validate to v11
- chore(deps): add eslint-plugin-unused-imports and @eslint-community/eslint-plugin-eslint-comments
- chore(deps): drop npm-run-all, rimraf, gulp-newer, gulp-sass, gulp-todo, and other unused packages
- chore(deps): add svgo v4 as direct dependency for SVG optimisation
