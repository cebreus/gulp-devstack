---
"gulp-devstack": patch
---

- refactor(build): delete monolithic navigation.js and replace with route-data.js, html-output.js, and
- refactor(build): extract sass compilation logic into sass-pipeline.js
- refactor(build): add sass-dependency-cache.js for incremental mtime-based skip logic
- refactor(build): extract image optimisation logic into image-pipeline.js
- refactor(build): add private-streams.js and html-rendering.js as focused utilities
- refactor(build): add changed-filter.js for file-change filtering
- refactor(build): remove generate-todo.js task
- refactor(build): refactor gulpfile to use createPipelines and selectDefaultPipeline helpers
- refactor(build): add cssBootstrap, cssProject, and cssRoutes as discrete named tasks
- refactor(build): add granular file-event watchers for route styles and scripts
