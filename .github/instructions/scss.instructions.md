---
applyTo: '**/*.scss'
---

SCSS files must follow these standards (see also REFACTORING\_GUIDE.md):

- Use BEM naming conventions for all classes: `c-` for components, `o-` for
  objects, `u-` for utilities.
- Always prefer Bootstrap utility classes for layout and spacing; create custom
  `u-` utilities only if Bootstrap does not provide the required functionality.
- Each component must have its own SCSS file, starting with its BEM class.
- Avoid deep nesting; keep selectors as flat as possible.
- Use mixins and variables for repeated logic and values.
- Write clear, descriptive comments in English.
- Do not duplicate Bootstrap utilities.
- Keep custom utilities (`u-`) single-purpose and project-specific.
- Run Stylelint and Prettier to ensure code quality and formatting.
- If anything is unclear, ask for clarification.

All styles must be readable, maintainable, and consistent with the project’s
architecture.
