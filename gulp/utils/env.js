/**
 * Environment Variable Utility.
 *
 * Note: Node.js 20+ supports --env-file directly for loading .env files.
 * This utility provides safe reading with type coercion and defaults.
 */

/**
 * Retrieves a value from an environment object with type-safe conversion.
 * @param {string} key - The environment variable name
 * @param {any} [fallback] - Value to return if the key is undefined
 * @param {object} [env] - The environment object to read from
 * @returns {string|boolean|number|any} The processed value
 */
export function getEnv(key, fallback, env = process.env) {
  const rawValue = env[key]

  if (rawValue === undefined) {
    return fallback
  }

  const value = String(rawValue)

  // Handle boolean strings
  if (value.toLowerCase() === 'true') return true
  if (value.toLowerCase() === 'false') return false

  // Handle numeric strings
  if (!isNaN(value) && value.trim() !== '') {
    return Number(value)
  }

  return rawValue
}

export default getEnv
