## Route Styles Cannot Depend On Global Sass Imports

- **Date Discovered:** 2026-05-25 UNKNOWN
- **Category:** Architectural
- **Context/Manifestation:** Route styles such as `src/routes/index.scss` and `src/routes/about/index.scss` had drifted into local copies of spacing, breakpoint, and mixin definitions. The root cause was that direct dependence on the global Sass layer had become unsafe after the explicit bundle split, creating module-loop pressure and removing the old prelude-based injection path.
- **Rule:** Route-local SCSS must import `src/scss/_route-abstracts.scss` for shared tokens and mixins instead of pulling in the global Bootstrap or `globals.scss` layer directly.

## Navigation Asset Helpers Must Keep The Legacy Export Seam

- **Date Discovered:** 2026-05-26 UNKNOWN
- **Category:** Architectural
- **Context/Manifestation:** Route asset discovery was split out into `gulp/utils/navigation-assets.js` to reduce file-size pressure in `gulp/utils/navigation.js`, but `tests/unit/html-helpers.test.js` still imports `clearRouteAssetCache` and `discoverRouteStyles` from `gulp/utils/navigation.js`. When those exports were removed instead of re-exported, the unit suite failed with `SyntaxError: ... does not provide an export named 'clearRouteAssetCache'`.
- **Rule:** If route-asset internals live in `gulp/utils/navigation-assets.js`, `gulp/utils/navigation.js` must keep re-exporting `clearRouteAssetCache`, `discoverRouteStyles`, and `discoverRouteScripts` as the stable public seam.

## Navigation Must Stay Split By Domain Responsibility

- **Date Discovered:** 2026-05-26 UNKNOWN
- **Category:** Architectural
- **Context/Manifestation:** `gulp/utils/navigation.js` had accumulated three unrelated concerns at once: route/page data shaping, HTML output normalization, and route asset discovery. During refactoring, this forced repeated API-boundary churn because tests and tasks needed different subsets of behavior. The stable resolution was to delete the mixed module entirely and replace it with `gulp/utils/route-data.js`, `gulp/utils/html-output.js`, and `gulp/utils/navigation-assets.js`, with boundary tests asserting those seams separately.
- **Rule:** Do not reintroduce a catch-all navigation utility module. Route/page data belongs in `gulp/utils/route-data.js`, HTML output policy belongs in `gulp/utils/html-output.js`, and route asset discovery belongs in `gulp/utils/navigation-assets.js`.

## Dev Build Export Pipelines Must Stay Separate

- **Date Discovered:** 2026-06-08 UNKNOWN
- **Category:** Architectural
- **Context/Manifestation:** The repo's top-level orchestration in `gulpfile.js` defines distinct `servePipeline`, `buildPipeline`, and `exportPipeline` flows, and the surrounding config/tasks give them different plugins, outputs, and runtime behavior. During architecture review, treating them as variants of one generic pipeline was explicitly rejected because `dev`, `build`, and `export` are separate pipelines, not one abstract workflow with a mode flag.
- **Rule:** Do not collapse `dev`, `build`, and `export` into a generic orchestration abstraction. Keep pipeline-specific decisions close to `gulpfile.js` and task wiring.
