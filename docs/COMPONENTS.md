# Components in Nunjucks

Components are reusable Nunjucks partials stored in `src/lib/components/`. Use
them to keep templates modular and maintainable.

## Usage

Include a component in your template with:

```nunjucks
{% include "components/card/card.njk" %}
```

You can pass data to components as variables:

```nunjucks
{% include "components/card/card.njk" with { title: "Card Title", content: "Text here." } %}
```

Or set the data in a variable and then include the component:

```nunjucks
{% set cardData = {
  title: "Developing",
  text: "Landing pages or prototypes (npm run dev)."
} %}
{% include "components/card/card.njk" with cardData %}
```

This approach is useful when you want to reuse the same data or pass more
complex objects to the component.

## Structure

- Each component is a folder in `src/lib/components/` (e.g. `card/`, `header/`)
- The main file is usually `component-name.njk`
- Components can have their own assets (images, styles, docs)
- Typical files:
  - `component-name.njk` – Nunjucks template
  - `component-name.scss` – SCSS styles for the component
  - `component-name.md` – Documentation and usage

## Creating Components

You can create components **manually** or using the CLI utility:

### CLI Utility

The project provides a CLI for component management (see
`gulp/tasks/component-manager.js`).

- **Create:**

  ```sh
  pnpm component:create
  # or
  npm run component:create
  ```

  You will be prompted for the component name. The CLI will create a folder with
  starter files (`.njk`, `.scss`, `.md`).

- **Remove:**

  ```sh
  pnpm component:remove
  ```

  Select a component to delete (irreversible).

- **Rename:**

  ```sh
  pnpm component:rename
  ```

  Select a component and enter a new name. All files and references in the
  component will be renamed.

- **List:**
  ```sh
  pnpm component:list
  ```
  Lists all components and their files.

### Manual Creation

1. Create a folder in `src/lib/components/` (e.g. `my-component/`).
2. Add a `.njk` template, `.scss` style, and optionally a `.md` doc file.
3. Follow naming conventions: **kebab-case** for folder and file names.

## SCSS Manifest Generation

All component SCSS files are automatically imported via a generated manifest
(`_components.scss`). This is handled by the build system
(`gulp/tasks/sass-components.js`). You do not need to manually import each
component's SCSS.

## Special/Non-standard Components

Some components are not classic UI blocks, but are used for inserting metadata
or favicons:

- **favicons**: `favicons/favicons.njk` – contains `<link rel="icon">` tags for
  favicons. Included in the page `<head>`.
- **meta-rich-snippets**: contains templates for SEO and social networks:
  - `open-graph.njk` – Open Graph meta tags
  - `seo.njk` – basic SEO meta tags
  - `twitter-cards.njk` – Twitter Cards meta tags

Usage:

```nunjucks
{% include "components/favicons/favicons.njk" %}
{% include "components/meta-rich-snippets/seo.njk" %}
{% include "components/meta-rich-snippets/open-graph.njk" %}
{% include "components/meta-rich-snippets/twitter-cards.njk" %}
```

## Best Practices

- Keep components small and focused
- Use variables for dynamic content
- Document expected input in the component file (in `.md` or as a comment in
  `.njk`)
- Prefer kebab-case for names
- Avoid special characters, spaces, or uppercase in names

See [Nunjucks Blocks Documentation](./NUNJUCKS-BLOCKS.md) for block usage in
layouts.
