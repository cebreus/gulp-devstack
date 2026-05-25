## Route Styles Cannot Depend On Global Sass Imports

- **Date Discovered:** 2026-05-25 UNKNOWN
- **Category:** Architectural
- **Context/Manifestation:** Route styles such as `src/routes/index.scss` and `src/routes/about/index.scss` had drifted into local copies of spacing, breakpoint, and mixin definitions. The root cause was that direct dependence on the global Sass layer had become unsafe after the explicit bundle split, creating module-loop pressure and removing the old prelude-based injection path.
- **Rule:** Route-local SCSS must import `src/scss/_route-abstracts.scss` for shared tokens and mixins instead of pulling in the global Bootstrap or `globals.scss` layer directly.
