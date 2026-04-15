import fs from 'node:fs'
import path from 'node:path'
import pc from 'picocolors'
import prompts from 'prompts'

import {
  getRelativePath,
  isPrivateFile,
  toKebabCase,
} from '../utils/helpers.js'
import loggerLib from '../utils/logger.js'
import { compileAllComponentStyles } from './process-sass.js'

/**
 * @typedef {object} ComponentOptions
 * @property {string} [name] - Component name (kebab-case)
 * @property {string} [source] - Source component name (for renames)
 * @property {string} [target] - Target component name (for renames)
 * @property {string} [componentsDir] - Custom components directory path
 */

const logger = loggerLib.createLogger('Components')

export const RESERVED_COMPONENT_NAMES = [
  'con',
  'prn',
  'aux',
  'nul',
  'com1',
  'com2',
  'com3',
  'com4',
  'com5',
  'com6',
  'com7',
  'com8',
  'com9',
  'lpt1',
  'lpt2',
  'lpt3',
  'lpt4',
  'lpt5',
  'lpt6',
  'lpt7',
  'lpt8',
  'lpt9',
]

/**
 * Validates if the component name follows project standards (kebab-case).
 * @param {string} name - The name to validate
 * @returns {boolean|string} True if valid, or an error message string
 */
export function validateComponentName(name) {
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return 'Component name is required.'
  }

  if (RESERVED_COMPONENT_NAMES.includes(name.toLowerCase())) {
    return `Name '${name}' is reserved.`
  }

  const kebabRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  if (!kebabRegex.test(name)) {
    return 'Name must be kebab-case (e.g., my-component) and cannot start/end with dashes or contain special characters.'
  }

  return true
}

/**
 * Generates boilerplate content for new component files.
 * @param {string} componentName - Name of the component
 * @returns {Array<{filename: string, content: string}>} List of files to create
 */
export function getComponentTemplates(componentName) {
  return [
    {
      filename: `${componentName}.njk`,
      content: `{# Component: ${componentName} #}\n<div class="c-${componentName}">\n  {{ content | safe }}\n</div>\n`,
    },
    {
      filename: `${componentName}.scss`,
      content: `// Component: ${componentName}\n.c-${componentName} {\n  // Styles\n}\n`,
    },
    {
      filename: `${componentName}.md`,
      content: `# Component ${componentName}\n\nUsage:\n{% include "components/${componentName}/${componentName}.njk" with { content: "Hello" } %}\n`,
    },
  ]
}

/**
 * Executes selected component action.
 * @param {Function} actionHandler - Action handler function
 * @returns {Promise<void>|void|null} Action result
 */
function runAction(actionHandler) {
  if (!actionHandler) return null
  return actionHandler({})
}

/**
 * Resolves the absolute path to the components directory.
 * Ensures the directory exists.
 * @param {ComponentOptions} [options] - Options containing custom directory
 * @returns {string} Absolute path to components directory
 */
function getComponentsDir(options = {}) {
  const dir = options.componentsDir || path.resolve('./src/lib/components')
  if (fs.existsSync(dir)) return dir

  fs.mkdirSync(dir, { recursive: true })
  return dir
}

/**
 * CLI Action: Interactive or automated component creation.
 * Generates NJK, SCSS, and MD files with boilerplate.
 * @param {ComponentOptions} [options] - Creation options
 * @param {string} [options.docsPathOverride] - Override for documentation file path
 * @returns {Promise<void>}
 */
export async function createComponent(options = {}) {
  let componentName = options.name

  if (!componentName) {
    const response = await prompts({
      type: 'text',
      name: 'name',
      message: 'Enter component name:',
      validate: (value) => validateComponentName(toKebabCase(value)),
    })
    componentName = response.name
  }

  if (!componentName) return

  const validationResult = validateComponentName(toKebabCase(componentName))
  if (validationResult !== true) {
    return logger.error(validationResult)
  }

  componentName = toKebabCase(componentName)
  const componentDir = path.join(getComponentsDir(options), componentName)

  if (fs.existsSync(componentDir)) {
    return logger.error(`Component '${componentName}' already exists.`)
  }

  fs.mkdirSync(componentDir, { recursive: true })

  const componentTemplates = getComponentTemplates(componentName)

  componentTemplates.forEach((template) => {
    fs.writeFileSync(
      path.join(componentDir, template.filename),
      template.content
    )
  })

  // 2. Automated Documentation Update
  try {
    const docsPath =
      options.docsPathOverride || path.resolve('docs/COMPONENTS.md')
    if (fs.existsSync(docsPath)) {
      let docsContent = fs.readFileSync(docsPath, 'utf8')

      // Prevent duplicates
      if (
        docsContent.includes(
          `### ${componentName}\n- **Path**: \`src/lib/components/${componentName}\``
        )
      ) {
        logger.debug(
          `Component '${componentName}' already documented. Skipping update.`
        )
      } else {
        const entry = `\n### ${componentName}\n- **Path**: \`src/lib/components/${componentName}\`\n- **Status**: Boilerplate\n`

        // Try to append after "## Component List" or at the end
        if (docsContent.includes('## Component List')) {
          docsContent = docsContent.replace(
            '## Component List',
            `## Component List\n${entry}`
          )
        } else {
          docsContent += `\n## Component List\n${entry}`
        }

        fs.writeFileSync(docsPath, docsContent, 'utf8')
        logger.info(
          `Updated documentation in ${pc.yellow(getRelativePath(docsPath))}`
        )
      }
    }
  } catch {
    logger.warn('Failed to update COMPONENTS.md documentation.')
  }

  logger.info(
    `Component '${componentName}' successfully created at ${pc.yellow(getRelativePath(componentDir))}`
  )
}

/**
 * CLI Action: Interactive or automated component removal.
 * @param {ComponentOptions} [options] - Removal options
 * @returns {Promise<void>}
 */
export async function removeComponent(options = {}) {
  const componentsDir = getComponentsDir(options)
  const existingComponents = fs
    .readdirSync(componentsDir)
    .filter(
      (f) =>
        fs.statSync(path.join(componentsDir, f)).isDirectory() &&
        !isPrivateFile(f)
    )

  let componentToRemove = options.name

  if (!componentToRemove) {
    const response = await prompts({
      type: 'select',
      name: 'name',
      message: 'Select component to remove:',
      choices: existingComponents.map((comp) => ({ title: comp, value: comp })),
    })
    componentToRemove = response.name
  }

  if (!componentToRemove || !existingComponents.includes(componentToRemove)) {
    return logger.warn('No valid component selected for removal.')
  }

  const confirm = await prompts({
    type: 'confirm',
    name: 'confirmed',
    message: `${pc.red('CAUTION:')} Are you sure you want to remove '${componentToRemove}'?`,
    initial: false,
  })

  if (!confirm.confirmed) return

  fs.rmSync(path.join(componentsDir, componentToRemove), {
    recursive: true,
    force: true,
  })
  logger.info(`Component '${componentToRemove}' has been removed.`)
}

/**
 * CLI Action: Interactive or automated component renaming.
 * Handles directory moves and content search/replace.
 * @param {ComponentOptions} [options] - Rename options
 * @returns {Promise<void>}
 */
export async function renameComponent(options = {}) {
  const componentsDir = getComponentsDir(options)
  const existingComponents = fs
    .readdirSync(componentsDir)
    .filter(
      (f) =>
        fs.statSync(path.join(componentsDir, f)).isDirectory() &&
        !isPrivateFile(f)
    )

  let sourceName = options.source
  if (!sourceName) {
    const response = await prompts({
      type: 'select',
      name: 'source',
      message: 'Select component to rename:',
      choices: existingComponents.map((c) => ({ title: c, value: c })),
    })
    sourceName = response.source
  }
  if (!sourceName) return

  let targetName = options.target
  if (!targetName) {
    const response = await prompts({
      type: 'text',
      name: 'target',
      message: 'Enter new name:',
      validate: (v) => validateComponentName(toKebabCase(v)),
    })
    targetName = toKebabCase(response.target)
  }

  if (!targetName || existingComponents.includes(targetName)) {
    return logger.error('Target name is invalid or already exists.')
  }

  const sourcePath = path.join(componentsDir, sourceName)
  const targetPath = path.join(componentsDir, targetName)

  fs.mkdirSync(targetPath, { recursive: true })

  fs.readdirSync(sourcePath).forEach((file) => {
    const oldFile = path.join(sourcePath, file)
    const newFile = path.join(targetPath, file.replace(sourceName, targetName))

    let fileContent = fs.readFileSync(oldFile, 'utf8')
    fileContent = fileContent.replace(new RegExp(sourceName, 'g'), targetName)

    fs.writeFileSync(newFile, fileContent)
  })

  fs.rmSync(sourcePath, { recursive: true, force: true })
  logger.info(`Renamed component '${sourceName}' to '${targetName}'.`)
}

/**
 * CLI Action: Lists all components with metadata summary.
 * @param {ComponentOptions} [options] - Listing options
 * @returns {Promise<void>}
 */
export async function listComponents(options = {}) {
  const componentsDir = getComponentsDir(options)
  const components = fs
    .readdirSync(componentsDir)
    .filter(
      (f) =>
        fs.statSync(path.join(componentsDir, f)).isDirectory() &&
        !isPrivateFile(f)
    )

  if (components.length === 0) {
    return logger.info('No components found in project.')
  }

  let output = pc.cyan(`Current Components (${components.length}):\n`)
  components.forEach((name) => {
    const componentPath = path.join(componentsDir, name)
    const fileCount = fs.readdirSync(componentPath).length
    output += `${pc.green('•')} ${name} ${pc.dim(`(${fileCount} files)`)}\n`
  })
  logger.info(output)
}

/**
 * CLI Action: Clones an existing component to a new one.
 * @param {ComponentOptions} [options] - Clone options
 * @returns {Promise<void>}
 */
export async function cloneComponent(options = {}) {
  const componentsDir = getComponentsDir(options)
  const existingComponents = fs
    .readdirSync(componentsDir)
    .filter(
      (f) =>
        fs.statSync(path.join(componentsDir, f)).isDirectory() &&
        !isPrivateFile(f)
    )

  if (existingComponents.length === 0) {
    return logger.warn('No components available to clone.')
  }

  let sourceName = options.source
  if (!sourceName) {
    const response = await prompts({
      type: 'select',
      name: 'source',
      message: 'Select component to clone:',
      choices: existingComponents.map((c) => ({ title: c, value: c })),
    })
    sourceName = response.source
  }
  if (!sourceName) return

  let targetName = options.target
  if (!targetName) {
    const response = await prompts({
      type: 'text',
      name: 'target',
      message: `Enter new name for clone of '${sourceName}':`,
      validate: (v) => {
        const name = toKebabCase(v)
        if (name === sourceName) return 'Target must be different from source.'
        return validateComponentName(name)
      },
    })
    targetName = toKebabCase(response.target)
  }

  if (!targetName || existingComponents.includes(targetName)) {
    return logger.error('Target component already exists.')
  }

  const sourcePath = path.join(componentsDir, sourceName)
  const targetPath = path.join(componentsDir, targetName)

  fs.mkdirSync(targetPath, { recursive: true })

  fs.readdirSync(sourcePath).forEach((file) => {
    const oldFile = path.join(sourcePath, file)
    const newFile = path.join(targetPath, file.replace(sourceName, targetName))

    let content = fs.readFileSync(oldFile, 'utf8')
    // Smart rename: replace class names, macro names and imports
    content = content.replace(
      new RegExp(`c-${sourceName}`, 'g'),
      `c-${targetName}`
    )
    content = content.replace(
      new RegExp(`macro ${sourceName}`, 'g'),
      `macro ${targetName}`
    )
    content = content.replace(
      new RegExp(`import ${sourceName}`, 'g'),
      `import ${targetName}`
    )
    content = content.replace(
      new RegExp(`${sourceName}\\(`, 'g'),
      `${targetName}(`
    )

    fs.writeFileSync(newFile, content)
  })

  // Update documentation
  await createComponent({
    name: targetName,
    componentsDir,
    docsPathOverride: options.docsPathOverride,
  })

  logger.info(
    `Component '${sourceName}' successfully cloned to '${targetName}'.`
  )
}

/**
 * Gulp Task: Main entry point for CLI component management.
 * Dispatches commands based on process.argv or interactive prompt.
 * @returns {Promise<void|any>} Task result
 */
export default async function manageComponents() {
  const componentArgIndex = process.argv.findIndex((arg) => arg === 'component')
  const taskArgs =
    componentArgIndex >= 0 ? process.argv.slice(componentArgIndex + 1) : []
  const command = taskArgs.filter((a) => !a.endsWith('.js'))[0]

  const actionHandlers = {
    add: createComponent,
    create: createComponent,
    clone: cloneComponent,
    cp: cloneComponent,
    rm: removeComponent,
    remove: removeComponent,
    mv: renameComponent,
    rename: renameComponent,
    ls: listComponents,
    list: listComponents,
    compile: compileAllComponentStyles,
  }

  const commandHandler = actionHandlers[command]
  if (commandHandler) return runAction(commandHandler)

  const interactiveResponse = await prompts({
    type: 'select',
    name: 'action',
    message: 'What component action do you want to perform?',
    choices: [
      { title: 'Create new', value: 'create' },
      { title: 'Clone existing', value: 'clone' },
      { title: 'Remove existing', value: 'remove' },
      { title: 'Rename component', value: 'rename' },
      { title: 'List all', value: 'list' },
      { title: 'Compile styles', value: 'compile' },
    ],
  })

  const interactiveHandler = actionHandlers[interactiveResponse.action]
  return runAction(interactiveHandler)
}
