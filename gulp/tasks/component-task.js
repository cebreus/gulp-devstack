import * as config from '../config.js'
import logger from '../utils/logger.js'
import * as componentActions from './component-manager.js'
import compileAllComponentStyles from './components-sass.js'
import prompts from 'prompts'

/**
 * Handles a single component management action.
 * @param {string} action - The action to perform (create, remove, rename, list, compile).
 * @param {object} options - Options for the action.
 * @returns {Promise<void|*>} A promise that resolves when the action is complete or returns the result of the compile action.
 */
async function handleComponentAction(action, options) {
  switch (action) {
    case 'add':
    case 'create':
      await componentActions.createComponent(options)
      break
    case 'rm':
    case 'remove':
      await componentActions.removeComponent(options)
      break
    case 'mv':
    case 'rename':
      await componentActions.renameComponent(options)
      break
    case 'ls':
    case 'list':
      await componentActions.listComponents(options)
      break
    case 'compile':
      return compileAllComponentStyles()
    default:
      logger.error(`Unknown command: ${action}`)
      logger.info(
        'Available commands: add/create, rm/remove, mv/rename, ls/list, compile'
      )
      break
  }
}

/**
 * Gulp component management task handler.
 * Handles create, remove, rename, list, and compile actions for components.
 * Uses async/await, modern ESM, and project logger for all events and errors.
 * @returns {Promise<void|*>} A promise that resolves when the component management task is complete or returns the result of the compile action.
 */
export default async function componentTaskManager() {
  // Parse CLI arguments for subcommands and options
  const componentIdx = process.argv.findIndex((arg) => arg === 'component')
  const args = componentIdx >= 0 ? process.argv.slice(componentIdx + 1) : []
  const filteredArgs = args.filter((arg) => !arg.endsWith('.js'))
  const command = filteredArgs[0]
  const options = {
    componentsDir: config.componentsPath,
  }
  for (const arg of filteredArgs.slice(command ? 1 : 0)) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=')
      options[key] = value || true
    }
  }
  try {
    // Interactive mode if no command is provided
    if (!command) {
      const { action } = await prompts({
        type: 'select',
        name: 'action',
        message: 'Select an action for component management:',
        choices: [
          { title: 'Create new component', value: 'create' },
          { title: 'Remove component', value: 'remove' },
          { title: 'Rename component', value: 'rename' },
          { title: 'List components', value: 'list' },
          { title: 'Compile components', value: 'compile' },
        ],
      })
      if (!action) {
        logger.verbose('Operation cancelled.')
        return
      }
      logger.debug(`Selected action: ${action}`)
      await handleComponentAction(action, options)
      return
    }
    logger.debug(`Running command: component ${command} with options:`, options)
    await handleComponentAction(command, options)
  } catch (error) {
    logger.error('Error while working with components:', error)
    throw error
  }
}
