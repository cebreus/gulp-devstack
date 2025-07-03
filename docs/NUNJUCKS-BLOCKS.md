# Nunjucks Template Blocks Documentation

This document lists all available blocks in the `layout-default.njk` template.
You can override these blocks in your own templates.

## Block Hierarchy

1. `head_tag` - whole `<head>`
   - `css` - styles
   - `head_custom` - custom head tags
   - `meta_seo` - SEO meta
   - `favicons` - icons
   - `meta_og` - Open Graph
   - `meta_twitter` - Twitter Cards
2. `body` - whole `<body>`
   - `header` - header
   - `hero` - hero section
   - `main` - main content
     - `content` - page content
   - `footer` - footer
   - `js` - JavaScript files
   - `scripts` - inline scripts

You can override, extend, or keep any block as needed.

## HTML Structure Blocks

### `{% block head_tag %}`

Overrides the entire `<head>` tag, all code in it.

### `{% block body %}`

Overrides the entire `<body>` tag, including all components.

## Head Section Blocks

### `{% block css %}`

CSS styles. Use `{{ super() }}` to keep default styles.

```njk
{% block css %}
  {{ super() }}
  <link rel="stylesheet" href="/custom.css">
{% endblock %}
```

### `{% block head_custom %}`

Custom tags in the head (e.g. analytics, structured data).

```njk
{% block head_custom %}
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebPage"
  }
  </script>
{% endblock %}
```

### `{% block meta_seo %}`

Basic SEO meta tags (title, description, robots, etc). By default, includes
`components/meta-rich-snippets/seo.njk`. You can override this block to use your
own meta tags.

```njk
{% block meta_seo %}
  {% include "components/meta-rich-snippets/seo.njk" %}
{% endblock %}
```

### `{% block favicons %}`

Favicon links. By default, includes `components/favicons/favicons.njk`. You can
override this block to use your own favicons.

```njk
{% block favicons %}
  {% include "components/favicons/favicons.njk" %}
{% endblock %}
```

Or use custom links:

```njk
{% block favicons %}
  <link rel="shortcut icon" href="/custom-favicon.ico">
  <link rel="icon" type="image/png" sizes="32x32" href="/custom-favicon-32x32.png">
{% endblock %}
```

### `{% block meta_og %}`

Open Graph meta tags for social media. By default, includes
`components/meta-rich-snippets/open-graph.njk`. You can override this block to
use your own Open Graph tags.

```njk
{% block meta_og %}
  {% include "components/meta-rich-snippets/open-graph.njk" %}
{% endblock %}
```

### `{% block meta_twitter %}`

Twitter Card meta tags. By default, includes
`components/meta-rich-snippets/twitter-cards.njk`. You can override this block
to use your own Twitter meta tags.

```njk
{% block meta_twitter %}
  {% include "components/meta-rich-snippets/twitter-cards.njk" %}
{% endblock %}
```

## Body Section Blocks

### `{% block header %}`

Main navigation/header component.

```njk
{% block header %}
  <header class="custom-header">
    <nav>Custom Navigation</nav>
  </header>
{% endblock %}
```

### `{% block hero %}`

Hero section (banner, intro). Leave empty to hide.

```njk
{% block hero %}
{# empty block #}
{% endblock %}
```

or

```njk
{% block hero %}
  <section class="custom-hero">
    <h1>Custom Hero Title</h1>
  </section>
{% endblock %}
```

### `{% block main %}`

Main content wrapper. Contains `{% block content %}`.

```njk
{% block main %}
  <main class="custom-main">
    <div class="custom-container">
      {% block content %}
        {{ page.content | safe }}
      {% endblock %}
    </div>
  </main>
{% endblock %}
```

### `{% block content %}`

Main page content.

```njk
{% block content %}
  <h1>Custom Content</h1>
  <p>Your custom content here.</p>
{% endblock %}
```

### `{% block footer %}`

Footer component.

```njk
{% block footer %}
  <footer class="custom-footer">
    <p>Custom Footer Content</p>
  </footer>
{% endblock %}
```

### `{% block js %}`

JavaScript files. Use `{{ super() }}` to keep default scripts.

```njk
{% block js %}
  {{ super() }}
  <script src="/custom.js"></script>
{% endblock %}
```

### `{% block scripts %}`

Inline JavaScript.

```njk
{% block scripts %}
  <script>
    console.log('Custom inline script');
  </script>
{% endblock %}
```

## Usage Examples

### Hide a component

```njk
{% block hero %}
{% endblock %}
```

### Keep default content and add your own

```njk
{% block css %}
  {{ super() }}
  <link rel="stylesheet" href="/custom.css">
{% endblock %}
```

### Fully override a component

```njk
{% block header %}
  <header class="completely-custom-header">
    <!-- completely new content -->
  </header>
{% endblock %}
```

### Conditional override

```njk
{% block hero %}
  {% if page.show_hero %}
    {{ super() }}
  {% endif %}
{% endblock %}
```
