# Component Architecture & Strategy

Components in Gulp DevStack are reusable Nunjucks partials and macros stored in `src/lib/components/`. They provide a modular foundation for building scalable UI systems while leveraging the full power of Bootstrap.

## 1. Quick Start: Component Management CLI

The easiest way to begin your own work is via our interactive CLI. It ensures that every component you create follows our architectural standards.

```bash
pnpm component
```

This single entry point handles the entire component lifecycle:

- **Create**: Scaffolds a new component directory with `.njk` and `.scss` boilerplates.
- **Rename**: Safely renames the component and its assets without breaking dependencies.
- **Remove**: Cleans up the component and its registered styles recursively.

> \[!IMPORTANT]
> **CMS Readiness & Strategy**: Our component-based approach is deeply linked with our [Routing & Frontmatter System](docs/ROUTING.md). When you isolate UI into components, you can easily map complex data from a Headless CMS (via `.md` or `.json` frontmatter) straight into your Macros. This decoupling of data and presentation is what makes the project "Enterprise ready."

## 2. Framework-First Strategy

Gulp DevStack is built on top of **Bootstrap 5**, providing a vast library of battle-tested UI components out of the box.

- **Don't Over-Engineer**: If a piece of UI is unique to a single page and simple in logic, keep it in the page template.
- **Use Native Bootstrap**: For standard elements like buttons, cards, or navigation, simply copy-paste refined HTML from the [Bootstrap Documentation](https://getbootstrap.com/docs/5.3/components/) and use Bootstrap's utility classes.

### Choosing the Right Approach

- **Prototyping**: Stick to plain HTML, partials via `{% include %}`, and global CSS classes.
- **Advanced UI Systems**: Use the **Nunjucks Macro System** for large projects requiring strict data structures, complex conditional logic, and high reusability across multiple layouts.

## 3. Nunjucks Macro Pattern

For complex components (like our `hero`), we use macros to ensure type-safety and predictable data handling.

### Macro Import & Usage

Import the component from its directory and call it with specific parameters:

```nunjucks
{% from "components/hero/hero.njk" import hero %}

{{ hero(
  title = "Our Hero Component",
  description = "A clean example of a reusable UI block.",
  badge = "V5.0"
) }}
```

### Content Injections (`call`)

Use the `call` block to pass complex HTML structures directly into the component's body:

```nunjucks
{% call hero(title="Interactive Hero") %}
  <div class="d-flex justify-content-center gap-3">
    <a href="#" class="btn btn-primary">Get Started</a>
    <a href="#" class="btn btn-outline-light">Learn More</a>
  </div>
{% endcall %}
```

## 4. Physical Directory Structure

Each component is self-contained within its own directory in `src/lib/components/`:

```text
src/lib/components/hero/
├── hero.njk   # Macro Template (Nunjucks)
├── hero.scss  # Scoped Styles (SASS)
└── hero.md    # API Documentation (Internal Styleguide)
```

- **Clean Imports (CSS)**: You **never** need to manually import component SCSS files. Gulp automatically scans the library and bundles styles.
- **JavaScript Isolation**: Component logic (`.js`) **does not belong in this directory**. To preserve **tree-shaking** and performance, explicitly import and define your component logic in the `src/js/` entry points (e.g., `src/js/app.js`). Auto-globbing JS would pollute the global scope.
- **Internal Documentation**: The `.md` files are intended solely for developers (API reference) and never reach the production build.

## 5. Architectural Infrastructure

Some components serve as systemic infrastructure and are typically managed within the Layouts:

- `meta-rich-snippets/`: Centralized management for SEO, OG, and Twitter metadata.
- `favicons/`: Automated generation of multi-platform favicon tags.
- `header/` & `footer/`: Global structural units for the application.

## 6. Implementation Best Practices

- **Strict Defaults**: Always use Nunjucks `default` filters to prevent templates from breaking when data is missing.
- **Style Isolation**: Keep SASS rules scoped to the component's root class (e.g., `.c-hero`) to prevent global style leakage.

## Component List

### card

- **Path**: `src/lib/components/card`
- **Status**: Ready

### favicons

- **Path**: `src/lib/components/favicons`
- **Status**: System

### footer

- **Path**: `src/lib/components/footer`
- **Status**: Ready

### header

- **Path**: `src/lib/components/header`
- **Status**: Ready

### hero

- **Path**: `src/lib/components/hero`
- **Status**: Ready

### meta-rich-snippets

- **Path**: `src/lib/components/meta-rich-snippets`
- **Status**: System
