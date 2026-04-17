# Page Routing & Layouts

Gulp DevStack uses a **"File-Based Routing"** system combined with a hybrid Nunjucks/Markdown data architecture. This provides strict separation between presentation logic and content.

## 1. How Routing Works

Every file in `src/routes/` deterministically maps to a public URL. We generate "Pretty URLs" (Permalinks) by default.

| Source File                  | Build Output        | Final URL      |
| :--------------------------- | :------------------ | :------------- |
| `src/routes/index.njk`       | `/index.html`       | `/` (Homepage) |
| `src/routes/about/index.njk` | `/about/index.html` | `/about/`      |
| `src/routes/404.njk`         | `/404.html`         | `/404` (Error) |

> \[!TIP]
> Use `src/routes/404.njk` instead of `404/index.njk`. Most static hosting providers (Netlify, GitHub Pages) expect a top-level `404.html` file to act as the global error catch-all.

## 2. Hybrid Pages (The Override Pattern)

A single route can be composed of multiple files working together. Gulp DevStack supports an **"Override & Merge"** pattern:

1. **`.njk` (Template)**: The primary presentation logic. It defines the structure and layout.
2. **`.md` or `.json` (Data)**: The content source.
3. **Merge**: If both `index.njk` and `index.md` exist in the same folder, the `.njk` file takes precedence as the template, but all data from the `.md` file (YAML frontmatter and content) is **automatically injected** into the Nunjucks context.

This pattern is essential for "Headless CMS Readiness." You can keep your UI logic in `.njk` while a CMS writes data purely to `.md` files.

## 3. Layout Injection

Every page needs a layout (e.g., standard header and footer vs. a minimal error page). Layouts are stored in `src/routes/` and prefixed with `layout-` (e.g., `layout-default.njk`).

To define or change a layout, use the native Nunjucks `extends` tag at the very top of your `.njk` route file:

```jinja
{# src/routes/404.njk #}
{% extends "layout-minimal.njk" %}

{% block content %}
  <div class="o-404-container">
    <h1>Page Not Found</h1>
    <a href="/">Back to Home</a>
  </div>
{% endblock %}
```

## 4. Isolated Page Assets (Autodiscovery)

To prevent global CSS/JS bundle bloat, you can isolate assets strictly to the pages that need them. The build pipeline automatically detects, compiles, and injects these assets based on the route structure.

### File Naming Convention

The system looks for assets in the same directory as your route template, matching either the **filename** or using the **index** convention:

| Route Template    | Detected Style                        | Detected Script                   |
| :---------------- | :------------------------------------ | :-------------------------------- |
| `about/index.njk` | `about/index.scss`                    | `about/index.js`                  |
| `blog/post.njk`   | `blog/post.scss` OR `blog/index.scss` | `blog/post.js` OR `blog/index.js` |

### How it Works

1. **Detection**: During the build, Gulp scans `src/routes/` for `.scss` and `.js` files.
2. **Compilation**: These files are compiled into `build/assets/css/` and `build/assets/js/`, preserving the directory hierarchy.
3. **Injection**: The `processHtml` task identifies matching assets and injects them **only** into the specific page's `<head>` (for CSS) and at the end of the `<body>` (for JS).

> \[!NOTE]
> This is the preferred way to handle heavy, page-specific styles (like complex animations) or interactive logic that isn't needed globally. It ensures your main bundle remains lean and performant.
