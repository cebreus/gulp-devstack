# Template Data Reference

This project separates data into **site** (global) and **page** (per-page)
objects for Nunjucks templates.

## Data Sources & Structure

* **Site data**: Global config from
  [`/src/config/site.js`](../src/config/site.js)
  * Example structure:
    ```js
    export const siteDefaults = {
      title: 'Gulp DevStack',
      description: 'Modern frontend development workflow with Gulp',
      meta: { lang: 'en', charset: 'utf-8' },
      seo: {
        /* ... */
      },
    }
    ```
* **Page data**: Frontmatter in Markdown files under
  [`/src/routes/`](../src/routes/) (or `/content/pages/`)
  * Example frontmatter:
    ```md
    ---
    title: Home
    description: Welcome!
    menu_main:
      name: Home
      order: 1
      show: true
    hero:
      title: ...
      description: ...
      content: ...
    ---
    ```

## Data Access in Templates

* **`site`**: Global config, always available
  * `{{ site.title }}`
  * `{{ site.menu }}`
  * `{{ site.meta.lang }}`
* **`page`**: All frontmatter fields for the current page
  * `{{ page.title }}`
  * `{{ page.hero.title }}`
  * `{{ page.features.items }}`
* **Direct variables**: Top-level frontmatter fields are also available directly
  * `{{ title }}`
  * `{{ hero.title }}`

***

## Custom Nunjucks Filters

Custom filters are defined in
[`gulp/utils/nunjucks-filters.js`](../gulp/utils/nunjucks-filters.js):

* `md` — Render Markdown to HTML
* `dump` — Pretty-print objects for debugging
* `safe` — Mark string as safe HTML
* (See the file for more filters)

Usage example:

```nunjucks
{{ page.content | md | safe }}
<pre>{{ page | dump(2) }}</pre>
```

***

## Common Patterns

For more, see the [Nunjucks blocks documentation](./NUNJUCKS-BLOCKS.md).
