---
"gulp-devstack": patch
---

- fix(build): implement Windows-compatible path processing in gulp utilities
- fix(build): quote glob patterns in package.json to prevent shell expansion errors
- fix(build): extract inline node scripts from lefthook.yml to dedicated files
- fix(build): update test suites to accommodate Windows path formats
