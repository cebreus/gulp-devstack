import { mkdirr, toKebabCase } from '../utils/helpers.js'
import logger from '../utils/logger.js'
import fs from 'node:fs'
import path from 'node:path'
import pc from 'picocolors'
import prompts from 'prompts'

/**
 * Helper: Get the absolute path to the components directory, create if missing
 * @param {object} options - Options for getting the components directory.
 * @returns {string} Absolute path to components directory
 */
function getComponentsDir(options = {}) {
  const dir = options.componentsDir || path.resolve('./src/lib/components')
  mkdirr(dir)
  return dir
}

/**
 * Helper: Get a list of existing component directories
 * @param {string} componentsDir - Path to the components directory.
 * @returns {string[]} List of component names
 */
function getComponentList(componentsDir) {
  return fs.readdirSync(componentsDir).filter((file) => {
    const fullPath = path.join(componentsDir, file)
    return fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()
  })
}

/**
 * Helper: Validate component name (kebab-case, no special chars, no slashes, dots, etc.)
 * @param {string} name - Name of the component to validate.
 * @returns {boolean|string} true or error message
 */
function validateComponentName(name) {
  if (!name || typeof name !== 'string') return 'Component name is required.'
  if (/[^a-z0-9-]/.test(name))
    return 'Name can only contain lowercase letters, numbers, and dashes.'
  if (/-{2,}/.test(name))
    return 'Name cannot contain multiple consecutive dashes.'
  if (/^-|-$/.test(name)) return 'Name cannot start or end with a dash.'
  if (['con', 'aux', 'nul', 'prn'].includes(name))
    return 'Name is a reserved word.'
  return true
}

/**
 * Creates a new component in the components directory.
 * @param {object} options - Options for component creation.
 * @param {string} [options.name] - Name of the component.
 * @param {string} [options.componentsDir] - Path to components directory.
 * @returns {Promise<void>}
 */
export async function createComponent(options = {}) {
  try {
    let componentName = options.name
    // Prompt for component name if not provided.
    if (!componentName) {
      const response = await prompts({
        type: 'text',
        name: 'name',
        message: 'Enter component name:',
        validate: (value) => {
          const kebab = toKebabCase(value)
          return validateComponentName(kebab)
        },
      })
      componentName = response.name
      if (!componentName) {
        logger.info('Component creation cancelled.')
        return
      }
    }
    componentName = toKebabCase(componentName)
    const valid = validateComponentName(componentName)
    if (valid !== true) {
      logger.error(valid)
      return
    }
    const componentsDir = getComponentsDir(options)
    const componentDir = path.join(componentsDir, componentName)
    // Check if the component already exists.
    if (fs.existsSync(componentDir)) {
      logger.error(`Component '${componentName}' already exists.`)
      return
    }
    // Create the component directory.
    fs.mkdirSync(componentDir, {
      recursive: true,
    })
    // Define the files to create for the new component.
    const files = [
      {
        name: `${componentName}.njk`,
        content: `{# Component: ${componentName} #}\n<div class="c-${componentName}">\n  <div class="c-${componentName}__content">\n    {{ content | safe }}\n  </div>\n</div>\n`,
      },
      {
        name: `${componentName}.scss`,
        content: `// Component: ${componentName}\n.c-${componentName} {\n  // Base styles for component\n\n  &__content {\n    // Styles for component content\n  }\n\n  // Other component parts\n}\n`,
      },
      {
        name: `${componentName}.md`,
        content: `# Component ${componentName}\n\nDescription and usage.\n\n## Usage example\n\n\`\`\`html\n{% include "components/${componentName}/${componentName}.njk" with {\n  content: "Component content"\n} %}\n\`\`\`\n`,
      },
    ]
    // Write the component files.
    for (const file of files) {
      const filePath = path.join(componentDir, file.name)
      fs.writeFileSync(filePath, file.content)
      // logger.debug(`Created file: ${filePath}`);
    }
    const writtenFiles = files
      .map((file) => {
        const relPath = path.relative(
          process.cwd(),
          path.join(componentDir, file.name)
        )
        return `           - ${relPath}`
      })
      .join('\n')

    logger.info(
      `Component '${componentName}' was created\n${writtenFiles}
      \n           You can now use the component in templates:\n` +
        pc.cyan(
          `           {% include "components/${componentName}/${componentName}.njk" with { content: "Component content" } %}`
        )
    )
  } catch (error) {
    logger.error('Error creating component:', error)
  }
}

/**
 * Removes a component from the components directory.
 * @param {object} options - Options for component removal.
 * @param {string} [options.name] - Name of the component.
 * @param {string} [options.componentsDir] - Path to components directory.
 * @returns {Promise<void>}
 */
export async function removeComponent(options = {}) {
  try {
    const componentsDir = getComponentsDir(options)
    const components = getComponentList(componentsDir)
    if (components.length === 0) {
      logger.warn('No components found to remove.')
      return
    }
    let componentName = options.name
    // Prompt for component to remove if not provided.
    if (!componentName) {
      const response = await prompts({
        type: 'select',
        name: 'name',
        message: 'Select a component to remove:',
        choices: components.map((comp) => ({
          title: comp,
          value: comp,
        })),
      })
      componentName = response.name
      if (!componentName) {
        logger.info('Component removal cancelled.')
        return
      }
    }
    // Check if the component exists.
    if (!components.includes(componentName)) {
      logger.error(`Component '${componentName}' does not exist.`)
      return
    }
    const componentDir = path.join(componentsDir, componentName)
    // Confirm removal with the user.
    const confirmResponse = await prompts({
      type: 'confirm',
      name: 'value',
      message: `${pc.yellow('Are you sure you want to remove component')} '${componentName}'? ${pc.yellow('This action is irreversible.')}`,
      initial: false,
    })
    if (!confirmResponse.value) {
      logger.info('Component removal cancelled.')
      return
    }
    // Remove the component directory.
    fs.rmSync(componentDir, {
      recursive: true,
      force: true,
    })
    logger.info(
      `${pc.green('✓')} Component '${componentName}' was removed successfully.`
    )
  } catch (error) {
    logger.error('Error removing component:', error)
  }
}

/**
 * Renames a component in the components directory.
 * @param {object} options - Options for renaming a component.
 * @param {string} [options.name] - Name of the component.
 * @param {string} [options.componentsDir] - Path to components directory.
 * @returns {Promise<void>}
 */
export async function renameComponent(options = {}) {
  try {
    const componentsDir = getComponentsDir(options)
    const components = getComponentList(componentsDir)
    if (components.length === 0) {
      logger.warn('No components found to rename.')
      return
    }
    let sourceComponentName = options.source
    // Prompt for the component to rename if not provided.
    if (!sourceComponentName) {
      const response = await prompts({
        type: 'select',
        name: 'source',
        message: 'Select a component to rename:',
        choices: components.map((comp) => ({
          title: comp,
          value: comp,
        })),
      })
      sourceComponentName = response.source
      if (!sourceComponentName) {
        logger.info('Component rename cancelled.')
        return
      }
    }
    // Check if the source component exists.
    if (!components.includes(sourceComponentName)) {
      logger.error(`Component '${sourceComponentName}' does not exist.`)
      return
    }
    let targetComponentName = options.target
    // Prompt for the new component name if not provided.
    if (!targetComponentName) {
      const response = await prompts({
        type: 'text',
        name: 'target',
        message: `Enter new name for component '${sourceComponentName}':`,
        validate: (value) => {
          const kebabValue = toKebabCase(value)
          return validateComponentName(kebabValue)
        },
      })
      targetComponentName = response.target
      if (!targetComponentName) {
        logger.info('Component rename cancelled.')
        return
      }
    }
    targetComponentName = toKebabCase(targetComponentName)
    const valid = validateComponentName(targetComponentName)
    if (valid !== true) {
      logger.error(valid)
      return
    }
    // If the target name is the same as the source, inform the user and do nothing (do not delete or move anything).
    if (targetComponentName === sourceComponentName) {
      logger.info(
        'The new component name is the same as the current name. No changes made.'
      )
      return
    }
    // Check if the target component name already exists (and is not the same as the source).
    if (components.includes(targetComponentName)) {
      logger.error(`Component '${targetComponentName}' already exists.`)
      return
    }
    const sourceDir = path.join(componentsDir, sourceComponentName)
    const targetDir = path.join(componentsDir, targetComponentName)
    // Create the new component directory.
    fs.mkdirSync(targetDir, {
      recursive: true,
    })
    const files = fs.readdirSync(sourceDir)
    // Rename files and update their content.
    for (const file of files) {
      const sourceFilePath = path.join(sourceDir, file)
      const targetFileName = file.replace(
        sourceComponentName,
        targetComponentName
      )
      const targetFilePath = path.join(targetDir, targetFileName)
      let content = fs.readFileSync(sourceFilePath, 'utf8')
      content = content
        .replace(
          new RegExp(`c-${sourceComponentName}`, 'g'),
          `c-${targetComponentName}`
        )
        .replace(
          new RegExp(`Component: ${sourceComponentName}`, 'g'),
          `Component: ${targetComponentName}`
        )
        .replace(
          new RegExp(`Component ${sourceComponentName}`, 'g'),
          `Component ${targetComponentName}`
        )
        .replace(
          new RegExp(
            `components/${sourceComponentName}/${sourceComponentName}.njk`,
            'g'
          ),
          `components/${targetComponentName}/${targetComponentName}.njk`
        )
      fs.writeFileSync(targetFilePath, content)
      logger.debug(
        `Renamed file: ${path.relative(process.cwd(), sourceFilePath)} -> ${path.relative(process.cwd(), targetFilePath)}`
      )
    }
    // Remove the old component directory.
    fs.rmSync(sourceDir, {
      recursive: true,
      force: true,
    })
    logger.info(
      `Component '${sourceComponentName}' was renamed to '${targetComponentName}'.`
    )
  } catch (error) {
    logger.error('Error renaming component:', error)
  }
}

/**
 * List all existing components
 * @param {object} options - Options for listing
 * @returns {Promise<void>}
 */
export async function listComponents(options = {}) {
  try {
    const componentsDir = getComponentsDir(options)
    if (!fs.existsSync(componentsDir)) {
      logger.warn(`Components directory does not exist: ${componentsDir}`)
      return
    }
    const components = getComponentList(componentsDir)
    if (components.length === 0) {
      logger.verbose('No components found.')
      return
    }

    /**
     * Gets details for a single component.
     * @param {string} name - Component name.
     * @param {string} componentsDir - Path to the components directory.
     * @returns {object} An object containing component details (name, file count, file types, SCSS size).
     */
    function getComponentDetails(name, componentsDir) {
      const componentDir = path.join(componentsDir, name)
      const files = fs.readdirSync(componentDir)
      const fileTypes = {
        template: files.filter((f) => f.endsWith('.njk')).length,
        style: files.filter((f) => f.endsWith('.scss')).length,
        doc: files.filter((f) => f.endsWith('.md')).length,
        other: files.filter(
          (f) =>
            !f.endsWith('.njk') && !f.endsWith('.scss') && !f.endsWith('.md')
        ).length,
      }
      const scssFiles = files.filter((f) => f.endsWith('.scss'))
      const scssSize = scssFiles.reduce((sum, f) => {
        const stats = fs.statSync(path.join(componentDir, f))
        return sum + stats.size
      }, 0)
      return {
        name,
        files: files.length,
        fileTypes,
        scssSize,
      }
    }

    const componentDetails = components.map((name) =>
      getComponentDetails(name, componentsDir)
    )

    let log = pc.cyan(`Found ${components.length} components:\n`)

    for (const component of componentDetails) {
      log += pc.green(`• ${component.name} `)
      const componentDir = path.join(componentsDir, component.name)
      const files = fs.readdirSync(componentDir)

      const templateFiles = files.filter((f) => f.endsWith('.njk'))
      const totalTemplateSize = templateFiles.reduce((sum, f) => {
        const stats = fs.statSync(path.join(componentDir, f))
        return sum + stats.size
      }, 0)
      log += `\n  ├─ ${component.fileTypes.template} templates ${(totalTemplateSize / 1024).toFixed(2)} kB`

      const styleFiles = files.filter((f) => f.endsWith('.scss'))
      const totalStyleSize = styleFiles.reduce((sum, f) => {
        const stats = fs.statSync(path.join(componentDir, f))
        return sum + stats.size
      }, 0)
      log += `\n  ├─ ${component.fileTypes.style} styles    ${(totalStyleSize / 1024).toFixed(2)} kB`

      const docFiles = files.filter((f) => f.endsWith('.md'))
      const totalDocSize = docFiles.reduce((sum, f) => {
        const stats = fs.statSync(path.join(componentDir, f))
        return sum + stats.size
      }, 0)
      log += `\n  ├─ ${component.fileTypes.doc} docs      ${(totalDocSize / 1024).toFixed(2)} kB`

      const otherFiles = files.filter(
        (f) => !f.endsWith('.njk') && !f.endsWith('.scss') && !f.endsWith('.md')
      )
      const totalOtherSize = otherFiles.reduce((sum, f) => {
        const stats = fs.statSync(path.join(componentDir, f))
        return sum + stats.size
      }, 0)
      log += `\n  └─ ${component.fileTypes.other} others    ${(totalOtherSize / 1024).toFixed(2)} kB`

      log += '\n'
    }

    const totalScssSize = componentDetails.reduce(
      (total, comp) => total + comp.scssSize,
      0
    )
    log += `\n${pc.cyan(`Total SCSS size: ${(totalScssSize / 1024).toFixed(2)} kB`)}`
    logger.info(log)
  } catch (error) {
    logger.error('Error listing components:', error)
  }
}

export default {
  create: createComponent,
  remove: removeComponent,
  rename: renameComponent,
  list: listComponents,
}
