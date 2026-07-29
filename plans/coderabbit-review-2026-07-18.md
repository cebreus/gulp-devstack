# CodeRabbit full-repo review — gulp-devstack (2026-07-18)

Pro tier single run, 171 files reviewed. Base: orphan empty commit (graft trick), `--type committed`.

## Summary

Total: 2 findings — major: 2.

## Findings

### \[major] .github/workflows/github-pages-deploy-pnpm.yml:116-126

*Security & Privacy*

Restrict Pages deployments to the production branch.
workflow\_dispatch can run this job from any branch, so a feature-branch
dispatch could publish to the live Pages site. Add the github-pages
environment and a ref guard for the production branch.

### \[major] gulp/tasks/process-data.js:98-106

*Functional Correctness*

Do not trim content before parsing it.

trim() removes meaningful leading Markdown whitespace, so a document
beginning with an indented code block is silently changed. Trim only for
the emptiness check.

Proposed fix

- const rawContent = file.contents.toString().trim()

* const rawContent = file.contents.toString()
  const fileName = path.basename(file.path, path.extname(file.path))

- if (!rawContent) {

* if (!rawContent.trim()) {
  logger.warn(`Skipping empty data file: ${path.basename(file.path)}`)
  return null
  }
