## Minimal Layouts Need The Shared CSS Injection Contract

- **Date Discovered:** 2026-05-25 UNKNOWN
- **Category:** Logic/Correctness
- **Context/Manifestation:** `build-prod/404.html` rendered without any stylesheet links while still using Bootstrap and component classes such as `btn`, `container`, `badge`, and `c-hero`. The root cause was that `src/routes/layout-minimal.njk` emitted only `pageInlineStyles` and skipped the same `inject:css` and `pageStyles` contract used by the default layout.
- **Rule:** Any route layout that renders shared Bootstrap or component classes must include both the global `inject:css` block and the `pageStyles` loop, not only inline styles.

## Template Date Filters Must Handle Intl Option Objects

- **Date Discovered:** 2026-05-25 UNKNOWN
- **Category:** Logic/Correctness
- **Context/Manifestation:** Visual parity between `build-prod` and `build-export` broke in the footer because `{{ site.now | date({ year: 'numeric' }) }}` was rendered differently. The root cause was that the Nunjucks `date` filter only handled the `'YYYY'` token and otherwise fell back to `toISOString()`, so object-based formats produced full ISO strings instead of a year.
- **Rule:** Keep the template `date` filter routed through the shared UTC formatter that supports both `'YYYY'` and `Intl.DateTimeFormat` option objects.
