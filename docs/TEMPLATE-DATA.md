# Template Data Reference

This document outlines the data hierarchy and naming conventions for Nunjucks templates in Gulp DevStack.

## 1. Global Data (`site`)

Global data is defined in `src/config/site.js`. It contains site-wide configuration, SEO defaults, and versioning info.

| Field              | Example Value         | Description               |
| :----------------- | :-------------------- | :------------------------ |
| `site.title`       | `"Gulp DevStack"`     | Main site name.           |
| `site.description` | `"..."`               | Default SEO description.  |
| `site.meta`        | `{ lang: "en", ... }` | Base HTML meta settings.  |
| `site.baseUrl`     | `"https://..."`       | Site URL (from `.env`).   |
| `site.author`      | `"..."`               | Author name for metadata. |
| `site.version`     | `"5.0.0"`             | Current project version.  |

### Accessing Site Data

```njk
<title>{{ site.title }} - {{ page.title }}</title>
```

---

## 2. Page-Level Data (`page`)

Page-level data is extracted from the **YAML Frontmatter** of the `.md` or `.json` file corresponding to the current route.

> \[!TIP]
> **Data Normalization**: Both **Markdown (`.md`)** and **JSON (`.json`)** files are supported as content sources. The build system normalizes them into a unified structure, meaning you access the data in your Nunjucks templates identically (via the `page` object) regardless of the source format. Use MD for content-heavy pages and JSON for purely structured data.

> \[!NOTE]
> **CMS Readiness**: This "schema-less" approach is designed for future **CMS implementations**. You can feed your templates any data structure from an external headless CMS by matching the keys, effectively decoupling content from presentation.

| Field              | Source        | Description                             |
| :----------------- | :------------ | :-------------------------------------- |
| `page.title`       | `title`       | Title defined in frontmatter.           |
| `page.description` | `description` | Description for SEO.                    |
| `page.hero`        | `hero`        | Hero section data (badge, title, etc.). |
| `page.seo`         | `seo`         | SEO overrides (robots, title, etc.).    |
| `page.content`     | Markdown Body | The rendered HTML content of the page.  |

### Accessing Page Data

```njk
<meta name="description" content="{{ page.description or site.description }}">
```

---

## 3. Direct Access

In addition to the `page` object, all top-level frontmatter keys are directly available as global variables in the template for convenience.

```njk
{# Both are valid and identical #}
<h1>{{ page.title }}</h1>
<h1>{{ title }}</h1>
```

---

## 4. Nunjucks Filters

Gulp DevStack includes custom filters to handle data transformations. For standard filters, see the [Nunjucks Documentation](https://mozilla.github.io/nunjucks/templating.html#builtin-filters).

| Filter | Usage                                    | Description                                |
| :----- | :--------------------------------------- | :----------------------------------------- |
| `md`   | `{{ data \| md \| safe }}`               | Renders a string as Markdown (Custom).     |
| `date` | `{{ now \| date({ year: 'numeric' }) }}` | Intl.DateTimeFormat wrapper (Custom).      |
| `dump` | `{{ page \| dump(2) }}`                  | Pretty-prints objects for debugging.       |
| `safe` | `{{ content \| safe }}`                  | Marks a string as safe HTML (no escaping). |

### Example: Rendering Content

```njk
<div class="page-content">
  {{ page.content | md | safe }}
</div>
```

---

## 5. Environment Variables

Environment-specific data is accessible via `.env` files and injected into the `site` object via `src/config/site.js`.

### Example

If you have `SITE_BASE_URL=https://my-site.com` in your `.env` file, it will be mapped to:

```njk
<link rel="canonical" href="{{ site.baseUrl }}{{ page.url }}">
```
