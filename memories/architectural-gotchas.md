## Route Styles Cannot Depend On Global Sass Imports

- **Date Discovered:** 2026-05-25 UNKNOWN
- **Category:** Architectural
- **Context/Manifestation:** Route SCSS copy mixins/tokens. Global Sass import unsafe after bundle split.
- **Rule:** Route-local SCSS must import `src/scss/_route-abstracts.scss`, not global Bootstrap/`globals.scss`.

## Navigation Asset Helpers Must Keep The Legacy Export Seam

- **Date Discovered:** 2026-05-26 UNKNOWN
- **Category:** Architectural
- **Context/Manifestation:** Route asset logic move to `navigation-assets.js`. Tests fail if `navigation.js` drop exports.
- **Rule:** `navigation.js` must re-export `clearRouteAssetCache`/`discoverRouteStyles`/`discoverRouteScripts` as public seam.

## Navigation Must Stay Split By Domain Responsibility

- **Date Discovered:** 2026-05-26 UNKNOWN
- **Category:** Architectural
- **Context/Manifestation:** `navigation.js` bloat with mixed concerns. Force API churn.
- **Rule:** No catch-all navigation module. Split to `route-data.js`, `html-output.js`, `navigation-assets.js`.

## Dev Build Export Pipelines Must Stay Separate

- **Date Discovered:** 2026-06-08 UNKNOWN
- **Category:** Architectural
- **Context/Manifestation:** `dev`, `build`, `export` are separate pipelines. Merging into one generic abstraction rejected.
- **Rule:** Keep `dev`, `build`, `export` pipelines separate. No generic orchestration abstraction.
