/**
 * Dumps variables to the page for debugging (only in development)
 * @param {Object} variables - Variables to dump
 * @param {string} title - Optional title
 * @returns {string} HTML string with variable dump
 */
export function dumpVars(variables, title = 'Debug Variables') {
  if (process.env.NODE_ENV === 'production') return '';

  return `
    <div class="debug-panel" style="margin: 20px; padding: 15px; background: #f5f5f5; border: 1px solid #ddd;">
      <h3 style="margin-top: 0; color: #333;">${title}</h3>
      <pre style="background: #fff; padding: 10px; overflow: auto; max-height: 300px;">${JSON.stringify(variables, null, 2)}</pre>
    </div>
  `;
}
