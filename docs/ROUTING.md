# Routing & Template Data

Gulp DevStack implements **filesystem-based routing** combined with a hybrid Markdown/Nunjucks data mapping strategy. This provides a clean separation between content (Markdown) and presentation (Nunjucks).

## 1. How Routing Works

Every folder and file within `src/routes/` directly maps to a public URL.

- `src/routes/index.md` → `/` (homepage)
- `src/routes/about/index.md` → `/about/`
- `src/routes/blog/post-1.md` → `/blog/post-1/`

### File Types

- **`.njk` files (Required)**: Serve as the primary entry point and presentation template. A routing directory *must* contain at least one `.njk` file to be rendered.
- **`.md` files (Optional)**: Serve as content and data sources (via YAML frontmatter). Using `.md` for data isolation is ideal for future **CMS integrations** (Headless CMS can easily map to these files).
- **`.scss` & `.js` (Optional)**: Isolated route assets. They are only loaded on their respective page, preventing global bundle bloat.

## 1. Directory Structure & Precedence

Gulp DevStack follows a "File-system Routing" pattern similar to modern meta-frameworks:

- **`.njk` files (Required)**: These represent your routes. A file at `src/routes/about.njk` generates `/about/`.
- **`.md` or `.json` files (Optional)**: Serve as content and data sources. Both are normalized into the `page` object in your templates.
- **`.scss` & `.js` (Optional)**: Isolated route assets. They are only loaded on their respective page.

Gulp DevStack supports an **"Override & Merge"** pattern:

1. If only `index.md` exists, it is rendered using the default layout (`layout-default.njk`).
2. If `index.njk` exists alongside `index.md`, the **`.njk` file takes precedence** as the template.
3. However, all data from the `.md` file (frontmatter and rendered content) is **automatically injected** into the `.njk` template.

> \[!TIP]
> Keep your data in `.md` files even if you use `.njk` templates. This keeps your structure "CMS-ready" and decouples content from presentation logic.

## 3. Asset Autodiscovery (Isolated Assets)

The pipeline automatically detects and injects assets based on the route name:

- If you are on the `/about/` page, the build system looks for `src/routes/about/index.scss` and `src/routes/about/index.js`.
- These assets are compiled and injected **only** into the respective page. This is the preferred way to handle page-specific styles and logic.

## 2. Output Path Mapping

The build system maps source files to output paths deterministically:

| Source File                  | Build Output        | Final URL     |
| :--------------------------- | :------------------ | :------------ |
| `src/routes/index.njk`       | `/index.html`       | `/`           |
| `src/routes/404.njk`         | `/404.html`         | `/404`        |
| `src/routes/404/index.njk`   | `/404/index.html`   | `/404/`       |
| `src/routes/about/index.njk` | `/about/index.html` | `/about/`     |
| `src/routes/docs/intro.njk`  | `/docs/intro.html`  | `/docs/intro` |

> \[!WARNING]
> While both `404.njk` and `404/index.njk` are valid, most static hosting providers (Netlify, Vercel, S3) expect a top-level **`404.html`** to act as the global error page. Stick to `src/routes/404.njk` for error pages to ensure it works as a catch-all.

## 3. Data Injections & Hydration

## 4. Layouts & Custom System Pages

- Layouts are stored in `src/routes/` with the prefix `layout-` (e.g., `layout-default.njk`).
- To change a layout for a specific page (like a 404 page), simply extend a different layout file.

**Example: Custom 404 Page**
For system pages, you might want a minimal layout without the standard header/footer:

```njk
{# src/routes/404.njk #}
{% extends "layout-minimal.njk" %}

{% block content %}
  <div class="o-404-container">
    <h1>Page Not Found</h1>
    <a href="/">Back to Home</a>
  </div>
{% endblock %}
```
