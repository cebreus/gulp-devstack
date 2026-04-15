import { dest, src } from 'gulp'

import { isPrivateFile } from '../utils/helpers.js'
import loggerLib from '../utils/logger.js'

const logger = loggerLib.createLogger('PurgeCSS')

/**
 * Gulp Task: Optimizes CSS files by removing unused selectors.
 * Analyzes linked HTML files to determine which CSS rules are actually needed.
 * @param {string|string[]} inputCss - Path(s) to CSS files to purge
 * @param {string|string[]} inputHtml - Path(s) to HTML files for selector analysis
 * @param {string} outputDir - Destination directory
 * @returns {Promise<import('node:stream').Readable>} Gulp stream
 */
export async function purgeCss(inputCss, inputHtml, outputDir) {
  if (!inputCss || !inputHtml || !outputDir) {
    logger.warn('PurgeCSS task skipped: invalid input or output parameters.')
    const { Readable } = await import('node:stream')
    return Readable.from([])
  }

  const { default: purgecss } = await import('gulp-purgecss')
  const { Transform } = await import('node:stream')

  const contentSources = (
    Array.isArray(inputHtml) ? inputHtml : [inputHtml]
  ).filter((f) => !isPrivateFile(f))

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

  const purgePipeline = src(inputCss)
    .pipe(
      new Transform({
        objectMode: true,
        transform(file, _enc, cb) {
          if (isPrivateFile(file.path)) return cb(null, null)
          cb(null, file)
        },
      })
    )
    .pipe(
      purgecss({
        content: contentSources,
        safelist: purgingSafelist,
      })
    )
    .pipe(dest(outputDir))

  purgePipeline.on('end', () => {
    logger.verbose('PurgeCSS operation completed successfully.')
  })

  purgePipeline.on('error', (err) => {
    logger.error('PurgeCSS failed to process files.', err)
  })

  return purgePipeline
}

export default purgeCss
