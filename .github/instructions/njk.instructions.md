---
applyTo: '**/*.njk'
---

Nunjucks templates must follow these standards (see also REFACTORING\_GUIDE.md):

- Always use Bootstrap utility classes for layout and spacing first; only create
  custom `u-` utilities if Bootstrap does not provide the required
  functionality.
- Use BEM naming conventions for all CSS classes (e.g., `c-card__title`,
  `u-text-glow`).
- Each reusable component must have its own folder and `.njk`, `.scss`, and
  `.md` files.
- Pass data to components using `{% set %}`; avoid the `with` syntax unless
  absolutely necessary.
- Always validate the existence of data before rendering (e.g.,
  `{% if variable %}`).
- Prefer simple, flat data structures for component inputs.
- Extract repeated blocks into partials for reuse.
- Write clear, descriptive comments in English.
- Ensure all template logic is readable and maintainable.
- Avoid deep nesting and complex inline logic.
- All code, comments, and documentation must be in English.
- Document each component’s data schema in its `.md` file.

If you encounter unclear requirements, ask for clarification.
