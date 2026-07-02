# Nunjucks Template Blocks

Gulp DevStack uses a modular block system in `src/routes/layout-default.njk`. This lets individual pages extend one global HTML shell while overriding only the sections they need.

## 0. Template Vocabulary

Understanding the hierarchy of Nunjucks elements is key to mastering this architecture:

- **Layout**: The top-level HTML wrapper (`layout-default.njk`). It defines the global structure and blocks.
- **Page**: The specific template (e.g., `index.njk`) or content source (`index.md`) that extends a Layout.
- **Block**: An overrideable placeholder defined in a Layout (e.g., `{% block content %}`).
- **Macro**: A reusable templating function (like a "Component function"), stored in `src/lib/components/`.
- **Component**: A modular UI element (e.g., Hero, Card) built using Nunjucks Macros for full reuse.

## 1. Block Hierarchy

### Direct Overrides (Common)

These blocks are the most frequent targets for customization in your `.njk` templates.

- `css`: External and route-specific styles.
- `content`: The primary content area.
- `js`: External and route-specific scripts.

### Full Hierarchy (Default Layout)

- `head_tag`: Entire `<head>` container.
  - `css`: Global and page styles.
  - `head_custom`: Generic hook for custom scripts/styles.
  - `meta_seo`: SEO metadata (via `seo.njk`).
  - `favicons`: Favicons (via `favicons.njk`).
- `body`: Entire `<body>` container.
  - `header`: Optional page/header component.
  - `main`: Wrapper for the central content.
    - `content`: Rendered Markdown body.
  - `footer`: Optional page/footer component.
  - `js`: Global and page scripts.
  - `scripts`: Custom inline scripts hook.

## 2. Practical Usage

### Overriding Content

In `layout-default.njk`, the `content` block is nested inside `main`. Overriding it preserves the standard page structure:

```nunjucks
{% extends "layout-default.njk" %}

{% block header %}
  <header>Custom Page Header</header>
{% endblock %}
```

```nunjucks
{% block content %}
  <div class="text-center">
    <h1>Coming Soon</h1>
    <p>Our site is under construction.</p>
  </div>
{% endblock %}
```

### Extending a Block (`super()`)

Use `{{ super() }}` to keep the original content and add more to it:

```nunjucks
{% block css %}
  {{ super() }}
  <link rel="stylesheet" href="/custom-styles.css">
{% endblock %}
```

## 5. Macros & Advanced Templating

Gulp DevStack utilizes Nunjucks `macro` calls with content blocks. For fundamental documentation, see the [Nunjucks Macro Guide](https://mozilla.github.io/nunjucks/templating.html#macro).

### The Power of `{% call %}`

The `call` tag is the equivalent of "children" or "slots" in modern frontend frameworks (React, Vue). It allows you to pass a full block of HTML into a macro:

```nunjucks
{% from "components/example/example.njk" import example %}

{% call example(title="Welcome Page", badge="Announcement") %}
  <div class="d-flex gap-2 mt-4">
    <button class="btn btn-primary">Primary Action</button>
    <button class="btn btn-outline-light">Secondary Action</button>
  </div>
{% endcall %}
```

**Why it's beneficial**: Inside the component, the content above is rendered using `{{ caller() if caller }}`. This keeps the component logic clean while allowing the page to define its own complex layouts inside the macro.

### Using `{% set %}` for Content Buffering

Sometimes you need to prepare complex data or HTML snippets before passing them into a macro:

```nunjucks
{% set custom_hero_description %}
  Our project reached <strong>v5.0.0</strong>! Check out the <a href="/docs/">documentation</a>.
{% endset %}

{{ example(description = custom_hero_description) }}
```

**Why it's beneficial**: It prevents template bloat and avoids messy string concatenations inside macro parameters. It keeps your templates readable and modular.

---

## 6. Key Conventions

- **`{{ super() }}`**: Appends content to an inherited block (common in `css` and `js` blocks).
- **Root Wrappers**: Following Nunjucks hierarchy, layouts serve as top-level wrappers. Individual pages populate pre-defined blocks without overriding the global HTML shell.
- **`layout-` Prefix**: Files with this prefix in `src/routes/` are internal templates and are excluded from the final routable HTML generation.
