# Template Data & Frontmatter

Gulp DevStack uses a **"JSON-First"** data pipeline. Markdown content and YAML frontmatter are processed, enriched, and converted into structured JSON artifacts before being injected into your Nunjucks templates.

## 1. The Data Pipeline

The build system handles data in the following deterministic sequence (see `gulp/tasks/process-data.js`):

1. **Extract**: Reads the Markdown content and YAML Frontmatter.
2. **Process (Dynamic Injection)**: Nunjucks expressions *inside* the Frontmatter are evaluated.
3. **Enrich**: SEO defaults (OpenGraph, Twitter Cards, `pageId`) are automatically generated and merged.
4. **Artifact Generation**: The final compiled dataset is saved as JSON artifacts in `.temp/pages/`, with shared site metadata in `.temp/site.json`.
5. **Template Hydration**: The JSON artifact is passed into the Nunjucks template under the `page` object.

## 1.1 Pipeline Scope

The data-processing logic is shared by all three pipelines:

| Pipeline | Data Artifacts       | Purpose                                     |
| :------- | :------------------- | :------------------------------------------ |
| `dev`    | `.temp/pages/*.json` | Feeds local HTML rendering and live reload  |
| `build`  | `.temp/pages/*.json` | Feeds production HTML before revision + SRI |
| `export` | `.temp/pages/*.json` | Feeds clean handoff HTML without hashing    |

The `.temp/` directory is an internal build artifact workspace, not a deploy target.

## 2. Global Site Config (`site`)

Global data is defined in `src/config/site.js` and is available in **every template** via the `site` object. This configuration acts as the single source of truth for the project.

- **Environment Variables**: `site.js` automatically consumes `.env` variables (e.g., `SITE_BASE_URL` becomes `site.baseUrl`).
- **Usage**: `{{ site.title }}`, `{{ site.author }}`, `{{ site.version }}`.

## 3. Page Metadata (`page`)

Each Markdown file starts with a YAML Frontmatter block. This defines the "Contract" for the template.

```markdown
---
title: Welcome to DevStack
hero:
  badge: "v4.5.0"
  text: "Modern Gulp 5 Stack"
---
```

In your Nunjucks template (`.njk`), you access this data via the `page` object:

```jinja
<h1>{{ page.title }}</h1>
<p>{{ page.hero.text }}</p>
```

## 4. Dynamic Data Injection

Because the pipeline resolves Nunjucks expressions *during* the data processing phase, you can use the `site` object directly inside your Markdown YAML frontmatter!

```markdown
---
title: "Release Notes"
badge: "Version {{ site.version }}"
---
```

*This is incredibly powerful for automated releases where the version number updates programmatically.*

## 5. Custom Nunjucks Filters

DevStack extends Nunjucks with custom filters to handle data transformations effortlessly:

| Filter | Usage                                    | Description                                           |
| :----- | :--------------------------------------- | :---------------------------------------------------- |
| `md`   | `{{ data \| md \| safe }}`               | Renders a raw string as parsed HTML Markdown.         |
| `date` | `{{ now \| date({ year: 'numeric' }) }}` | A native wrapper for `Intl.DateTimeFormat`.           |
| `dump` | `{{ page \| dump(2) }}`                  | Pretty-prints JSON objects (essential for debugging). |
| `safe` | `{{ content \| safe }}`                  | Native filter to render HTML without escaping it.     |
