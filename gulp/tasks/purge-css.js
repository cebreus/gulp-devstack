import gulp from 'gulp'

import loggerLib, {
  attachPipelineLogging,
  getRelativePath,
  isPrivateFile,
  streamToPromise,
} from '../utils/index.js'

const logger = loggerLib.createLogger('PurgeCss')

/**
 * Gulp Task: Optimizes CSS files by removing unused selectors.
 * Analyzes linked HTML files to determine which CSS rules are actually needed.
 * @param {string|string[]} inputCss - Path(s) to CSS files to purge
 * @param {string|string[]} inputHtml - Path(s) to HTML files for selector analysis
 * @param {string} outputDir - Destination directory
 * @returns {Promise<void>} Resolves when purging is complete
 */
export async function purgeCss(inputCss, inputHtml, outputDir) {
  if (!inputCss || !inputHtml || !outputDir) {
    logger.warn(
      'PurgeCSS task skipped: invalid input/output parameters. Provide CSS input, HTML content sources, and an output directory.'
    )
    const { Readable } = await import('node:stream')
    return Readable.from([])
  }

  const mod = await import('gulp-purgecss')
  const { Transform } = await import('node:stream')
  const purgecss = mod.default || mod

  const contentSources = (
    Array.isArray(inputHtml) ? inputHtml : [inputHtml]
  ).filter((f) => !isPrivateFile(f))

  const processedFiles = []

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
      'showing',
      'hiding',
      'alert-dismissible',
      'modal-backdrop',
      'modal-open',
      'modal-static',
      'header-search__result',
    ],
    greedy: [
      /tooltip/,
      /popover/,
      /^bs-/,
      /^modal-/,
      /^dropdown-/,
      /^navbar-/,
      /^offcanvas-/,
      /^accordion-/,
      /^collapse/,
      /^carousel-/,
      /^active/,
      /^show/,
      /^is-/,
      /^was-/,
      /^sticky-/,
      /^fixed-/,
    ],
    deep: [/^data-bs-popper/, /^tns/, /^sl/],
  }

  const purgePipeline = gulp
    .src(inputCss)
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
    .pipe(gulp.dest(outputDir))

  purgePipeline.on('data', (file) => {
    processedFiles.push(getRelativePath(file.path))
  })

  attachPipelineLogging({
    stream: purgePipeline,
    loggerInstance: logger,
    trackedFiles: processedFiles,
    successLabel: 'PurgeCSS optimized',
    emptyMessage: 'No CSS files were optimized by PurgeCSS.',
    errorMessage: 'PurgeCSS processing failed!',
  })

  try {
    await streamToPromise(purgePipeline)
    logger.verbose('PurgeCSS operation completed successfully.')
  } catch (error) {
    throw new Error('PurgeCSS operation failed.', { cause: error })
  }
}

export default purgeCss
