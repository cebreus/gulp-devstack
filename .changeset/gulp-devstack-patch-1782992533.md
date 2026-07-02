---
"gulp-devstack": patch
---

- [ae1b252] refactor(build): delete monolithic navigation.js and replace with route-data.js, html-output.js, and
- [ae1b252] refactor(build): extract sass compilation logic into sass-pipeline.js
- [ae1b252] refactor(build): add sass-dependency-cache.js for incremental mtime-based skip logic
- [ae1b252] refactor(build): extract image optimisation logic into image-pipeline.js
- [ae1b252] refactor(build): add private-streams.js and html-rendering.js as focused utilities
- [ae1b252] refactor(build): add changed-filter.js for file-change filtering
- [ae1b252] refactor(build): remove generate-todo.js task
- [ae1b252] refactor(build): refactor gulpfile to use createPipelines and selectDefaultPipeline helpers
- [ae1b252] refactor(build): add cssBootstrap, cssProject, and cssRoutes as discrete named tasks
- [ae1b252] refactor(build): add granular file-event watchers for route styles and scripts
