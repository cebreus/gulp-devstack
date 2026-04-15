import { Transform } from 'node:stream'
import { HtmlValidate } from 'html-validate'
import { src } from 'gulp'

import { getRelativePath, isPrivateFile } from '../utils/helpers.js'
import loggerLib from '../utils/logger.js'

const logger = loggerLib.createLogger('Validate')

/**
 * Gulp Task: Validates HTML files against WCAG and HTML standards using html-validate.
 * Reports accessibility issues, broken structures, and invalid attributes.
 * @param {string|string[]} input - Glob pattern(s) for HTML files to validate
 * @returns {import('node:stream').Readable} Gulp stream
 */
export function validateHtml(input) {
  const validator = new HtmlValidate({
    extends: ['html-validate:recommended'],
    rules: {
      'no-raw-characters': ['warn', { relaxed: true }],
      'no-inline-style': 'warn',
    },
  })
  const validationResults = []

  return src(input)
    .pipe(
      new Transform({
        objectMode: true,
        transform: async function (file, _enc, cb) {
          if (isPrivateFile(file.path)) return cb(null, null)
          if (file.isNull()) return cb(null, file)
          if (file.isStream())
            return cb(new Error('Streaming is not supported for validation.'))

          try {
            const report = await validator.validateString(
              file.contents.toString(),
              file.path
            )
            if (report.results[0]) {
              validationResults.push(report.results[0])
            }
            cb(null, file)
          } catch (error) {
            logger.error(`Failed to validate file: ${file.path}`, error)
            cb(error)
          }
        },
      })
    )
    .on('end', () => {
      let errorCount = 0
      let warningCount = 0

      validationResults.forEach((result) => {
        result.messages.forEach((msg) => {
          const isError = msg.severity === 2
          const logMethod = isError ? 'error' : 'warn'

          if (isError) errorCount++
          else warningCount++

          logger[logMethod](
            `${getRelativePath(result.filePath)}:${msg.line}:${msg.column} - ${msg.message} (${msg.ruleId})`
          )
        })
      })

      if (errorCount > 0 || warningCount > 0) {
        const summaryMessage = `HTML validation finished: ${errorCount} errors, ${warningCount} warnings.`
        if (errorCount > 0) {
          logger.error(summaryMessage)
          return
        }
        logger.warn(summaryMessage)
        return
      }

      logger.verbose('HTML validation passed successfully (0 issues).')
    })
}

export default validateHtml
