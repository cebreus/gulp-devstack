import fs from 'node:fs'
import path from 'node:path'
import { Transform } from 'node:stream'
import todoPlugin from 'gulp-todo'
import gulp from 'gulp'

import loggerLib, { getRelativePath, isPrivateFile } from '../utils/index.js'

const logger = loggerLib.createLogger('GenerateTodo')
const DEFAULT_REPORTS_DIR = './.reports'
const DEFAULT_REPORTS_FILE = 'TODO.md'

/** @type {string[]} */
const MARKDOWN_TABLE_HEADER = [
  '### Project TODO Inventory',
  '| Filename | Line | Task Description |',
  '|:---------|:----:|:-----------------|',
]

/**
 * Helper: Validates if the content represents only an empty report header.
 * @param {string} content - Markdown content to check
 * @returns {boolean} True if content is effectively empty
 */
export function isReportEmpty(content) {
  const lines = content.trim().split('\n')
  if (lines.length !== MARKDOWN_TABLE_HEADER.length) return false

  return MARKDOWN_TABLE_HEADER.every((headerLine, index) => {
    return lines[index].includes('TODO') || lines[index].includes('|')
  })
}

/**
 * Gulp Task: Scans the codebase for TODO/FIXME comments and generates a Markdown report.
 * Automatically cleans up the report file if no items are found.
 * @returns {import('node:stream').Stream} Gulp stream
 */
export default function generateTodo() {
  let hasActiveTodos = false
  let reportBufferFile = null

  return gulp
    .src([
      './src/**/*.{js,scss,html,njk,md}',
      './gulp/**/*.js',
      './tests/**/*.js',
      '!./node_modules/**/*',
    ])
    .pipe(
      new Transform({
        objectMode: true,
        transform(file, _enc, cb) {
          if (isPrivateFile(file.path)) return cb(null, null)
          cb(null, file)
        },
      })
    )
    .pipe(todoPlugin({ fileName: DEFAULT_REPORTS_FILE }))
    .pipe(
      new Transform({
        objectMode: true,
        transform(file, _enc, cb) {
          const content = file.contents ? file.contents.toString().trim() : ''

          if (content && !isReportEmpty(content)) {
            hasActiveTodos = true
            reportBufferFile = file
          }
          cb(null, file)
        },
        async flush(cb) {
          const reportPath = path.join(
            DEFAULT_REPORTS_DIR,
            DEFAULT_REPORTS_FILE
          )

          try {
            if (hasActiveTodos && reportBufferFile) {
              await fs.promises.mkdir(DEFAULT_REPORTS_DIR, { recursive: true })
              await fs.promises.writeFile(
                reportPath,
                reportBufferFile.contents.toString()
              )
              logger.debug(
                `TODO Inventory updated: ${getRelativePath(reportPath)}`
              )
            } else {
              try {
                await fs.promises.access(reportPath)
                await fs.promises.unlink(reportPath)

                const remainingFiles =
                  await fs.promises.readdir(DEFAULT_REPORTS_DIR)
                if (remainingFiles.length === 0) {
                  await fs.promises.rmdir(DEFAULT_REPORTS_DIR)
                }
                logger.verbose('No active tasks found. TODO report removed.')
              } catch {
                // Report didn't exist, nothing to do
              }
            }
            cb()
          } catch (error) {
            cb(
              new Error(`Failed to finalize TODO report: ${error.message}`, {
                cause: error,
              })
            )
          }
        },
      })
    )
}
