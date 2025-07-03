import purgecss from 'gulp-purgecss'
import { dest, src } from 'gulp'

import loggerLib from '../utils/logger.js'

const logger = loggerLib.createLogger('PurgeCSS')

/**
 * Gulp Task: Optimizes CSS files by removing unused selectors.
 * Analyzes linked HTML files to determine which CSS rules are actually needed.
 * @param {string|string[]} inputCss - Path(s) to CSS files to purge
 * @param {string|string[]} inputHtml - Path(s) to HTML files for selector analysis
 * @param {string} outputDir - Destination directory
 * @returns {import('node:stream').Readable} Gulp stream
 */
export function purgeCss(inputCss, inputHtml, outputDir) {
  const contentSources = Array.isArray(inputHtml) ? inputHtml : [inputHtml]

  // Safelist contains selectors that should NEVER be purged,
  // typically those added dynamically by JS (Bootstrap, sliders, etc.)
  const purgingSafelist = {
    standard: [
      'active',
      'collapsing',
      'collapse',
      'collapsed',
      'fade',
      'offcanvas-backdrop',
      'open',
      'scroll',
      'show',
      'alert-dismissible',
      'carousel-item-next',
      'carousel-item-prev',
      'carousel-item-start',
      'carousel-item-end',
      'modal-backdrop',
      'modal-open',
      'header-search__result',
    ],
    greedy: [/tooltip/],
    deep: [/^data-bs-popper/, /^tns/, /^sl/],
  }

  return src(inputCss)
    .pipe(
      purgecss({
        content: contentSources,
        safelist: purgingSafelist,
      })
    )
    .pipe(dest(outputDir))
    .on('end', () => {
      logger.verbose('PurgeCSS operation completed successfully.')
    })
    .on('error', (err) => {
      logger.error('PurgeCSS failed to process files.', err)
    })
}

export default purgeCss
