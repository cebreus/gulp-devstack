/**
 * Plopfile configuration for component generation.
 * @param {import('plop').NodePlopAPI} plop - The Plop instance
 */
export default function (plop) {
  plop.setGenerator('component', {
    description: 'Create a new reusable UI component',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Component name (kebab-case, e.g. "my-button"):',
        validate: (value) => {
          if (!value) {
            return 'Name is required'
          }
          if (!/^[a-z0-9-]+$/.test(value)) {
            return 'Use kebab-case'
          }
          return true
        },
      },
    ],
    actions: [
      {
        type: 'add',
        path: 'src/lib/components/{{dashCase name}}/{{dashCase name}}.njk',
        templateFile: 'gulp/templates/component/component.njk.hbs',
      },
      {
        type: 'add',
        path: 'src/lib/components/{{dashCase name}}/{{dashCase name}}.scss',
        templateFile: 'gulp/templates/component/component.scss.hbs',
      },
      {
        type: 'add',
        path: 'src/lib/components/{{dashCase name}}/{{dashCase name}}.md',
        templateFile: 'gulp/templates/component/component.md.hbs',
      },
      {
        type: 'modify',
        path: 'docs/COMPONENTS.md',
        pattern: /## Component List/,
        template:
          '## Component List\n\n### {{dashCase name}}\n- **Path**: `src/lib/components/{{dashCase name}}`\n- **Status**: Boilerplate',
      },
    ],
  })
}
