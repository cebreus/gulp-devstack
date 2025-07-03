# Routing & Template Data

This project uses file-based routing: each file in `/src/routes` becomes a URL
on the site.

## How Routing Works

- `src/routes/index.md` → `/` (homepage)
- `src/routes/about/index.md` → `/about/`
- You can use `.md` (Markdown) for content or `.njk` (Nunjucks) for custom
  templates

If both `index.md` and `index.njk` exist in the same folder, the `.njk` file is
used as the template, but all data from the corresponding `.md` file
(frontmatter and content) is available in the template as variables. This allows
you to customize layout and logic while keeping content in Markdown.

**Example:**

```
src/routes/
├── index.md            # → /
├── index.njk           # → / (uses index.njk as template, index.md for data)
├── about/
│   ├── index.md        # → /about/
│   └── index.njk       # → /about/ (uses index.njk as template, index.md for data)
```

## Layouts

- Files named `layout-*.njk` (e.g. `layout-default.njk`) are base templates, not
  pages.
- Pages use `{% extends "layout-default.njk" %}` to inherit layout structure.
- Layouts define blocks (see
  [Nunjucks Blocks Documentation](./NUNJUCKS-BLOCKS.md)) that pages can
  override.
- Layouts are not routable URLs themselves.

**Example:**

```nunjucks
{# src/routes/about/index.njk #}
{% extends "layout-default.njk" %}
{% block content %}
  <h1>{{ page.title }}</h1>
  <p>{{ page.description }}</p>
{% endblock %}
```

## Data in Templates

- `site` — global config from [`src/config/site.js`](../src/config/site.js)
- `page` — all frontmatter fields from the current Markdown file
- Direct variables — top-level frontmatter fields (e.g. `title`, `hero`)

See [Template Data Reference](./TEMPLATE-DATA.md) for details and examples.

## Components

Reusable Nunjucks components are stored in
[`src/lib/components/`](../src/lib/components/). Include them in templates for
modular design. See [Components documentation](./COMPONENTS.md) for usage and
best practices.

## Custom Nunjucks Filters

Custom filters are defined in
[`gulp/utils/nunjucks-filters.js`](../gulp/utils/nunjucks-filters.js):

- `md` — render Markdown to HTML
- `dump` — pretty-print objects
- `safe` — mark as safe HTML

See [Template Data Reference](./TEMPLATE-DATA.md) for usage.

## Template Blocks

You can override any block from the base layout. See
[Nunjucks Blocks Documentation](./NUNJUCKS-BLOCKS.md) for a full list and usage
examples.
