// Node.js v20+ supports --env-file, so .env/.env.local can be loaded at runtime by the CLI.
// This utility just reads from process.env, which is already populated.

/**
 * Get an environment variable with optional fallback and type conversion.
 * @param {string} key - The environment variable name.
 * @param {any} fallback - Fallback value if not set.
 * @returns {string|boolean|number} The value of the environment variable, converted to boolean or number if applicable, or the fallback.
 */
export function getEnv(key, fallback = undefined) {
  const val = process.env[key]
  if (val === undefined) return fallback
  if (val === 'true') return true
  if (val === 'false') return false
  if (!isNaN(val) && val.trim() !== '') return Number(val)
  return val
}
