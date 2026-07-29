# Page Routing & Layouts

Gulp DevStack uses a **"File-Based Routing"** system combined with a hybrid Nunjucks/Markdown data architecture. This provides strict separation between presentation logic and content.

## 1. How Routing Works

Every routable `.njk` template in `src/routes/` deterministically maps to a public URL. Files named `layout-*.njk` are internal layout templates and are excluded from output. Markdown files provide page data and content; they do not produce HTML by themselves unless a matching `.njk` template renders them.

| Source Files                                       | Build Output        | Final URL      |
| :------------------------------------------------- | :------------------ | :------------- |
| `src/routes/index.njk` + optional `index.md`       | `/index.html`       | `/` (Homepage) |
| `src/routes/about/index.njk` + optional `index.md` | `/about/index.html` | `/about/`      |
| `src/routes/404.njk` + optional `404.md`           | `/404.html`         | `/404.html`    |

> \[!TIP]
> Use `src/routes/404.njk` instead of `404/index.njk`. Most static hosting providers (Netlify, GitHub Pages) expect a top-level `404.html` file to act as the global error catch-all.

## 2. Hybrid Pages (The Override Pattern)

A single route can be composed of multiple files working together. Gulp DevStack supports an **"Override & Merge"** pattern:

1. **`.njk` (Template)**: The primary presentation logic. It defines the structure and layout.
2. **`.md` (Data)**: The content source.
3. **Merge**: If both `index.njk` and `index.md` exist in the same folder, the `.njk` file is the routable template, and all data from the `.md` file (YAML frontmatter and content) is **automatically injected** into the Nunjucks context as `page`.

This pattern is essential for "Headless CMS Readiness." You can keep your UI logic in `.njk` while a CMS writes data purely to `.md` files.

## 3. Layout Injection

Every page needs a layout (e.g., standard header and footer vs. a minimal error page). Layouts are stored in `src/routes/` and prefixed with `layout-` (e.g., `layout-default.njk`).

To define or change a layout, use the native Nunjucks `extends` tag at the very top of your `.njk` route file:

```jinja
{# src/routes/404.njk #}
{% extends "layout-default.njk" %}

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
| `404.njk`         | `404.scss`                            | `404.js`                          |
| `blog/post.njk`   | `blog/post.scss` OR `blog/index.scss` | `blog/post.js` OR `blog/index.js` |

### How it Works

1. **Detection**: During the build, Gulp scans `src/routes/` for `.scss` and `.js` files.
2. **Compilation**: These files are compiled into `build-*/assets/css/` and `build-*/assets/js/`, preserving the directory hierarchy in all pipelines.
3. **Injection**: The `processHtml` task identifies matching assets and injects them **only** into the specific page's `<head>` (for CSS) and at the end of the `<body>` (for JS).
4. **Linking Model**: Assets are linked as external `<link>` and `<script type="module">` tags. They are not inlined into the HTML by default.

## 5. Pipeline Behavior (`dev`, `build`, `export`)

The routing rules stay the same across all pipelines. What changes is how the discovered assets are emitted:

| Pipeline | HTML Output     | CSS / JS Output                       | Route Asset Behavior                                                   |
| :------- | :-------------- | :------------------------------------ | :--------------------------------------------------------------------- |
| `dev`    | `build-dev/`    | External files with source maps       | Route assets are linked and live-reloaded                              |
| `build`  | `build-prod/`   | External minified files, hashed + SRI | Route assets are linked, fingerprinted, and referenced from final HTML |
| `export` | `build-export/` | External readable files, no hashes    | Route assets are linked for clean handoff output                       |

### Development Loop

- Editing `src/routes/**/*.njk` or `src/routes/**/*.md` rebuilds dataset + HTML and triggers a full reload.
- Editing route SCSS rebuilds route CSS. A file change injects CSS; add/remove also rerenders HTML because the linked asset list changed.
- Editing route JS rebuilds route JS. A file change triggers reload; add/remove also rerenders HTML because the linked script list changed.

> \[!NOTE]
> This is the preferred way to handle heavy, page-specific styles (like complex animations) or interactive logic that isn't needed globally. It ensures your main bundle remains lean and performant.
