import fs from 'node:fs'
import path from 'node:path'
import { Transform } from 'node:stream'
import todoPlugin from 'gulp-todo'
import gulp from 'gulp'

import { getRelativePath, isPrivateFile } from '../utils/helpers.js'
import loggerLib from '../utils/logger.js'

const logger = loggerLib.createLogger('TODO')
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
    // Basic similarity check (ignoring slight variations in header text)
    return lines[index].includes('TODO') || lines[index].includes('|')
  })
}

/**
 * Gulp Task: Scans the codebase for TODO/FIXME comments and generates a Markdown report.
 * Automatically cleans up the report file if no items are found.
 * @returns {import('node:stream').Readable} Gulp stream
 */
export default function generateTodo() {
  let hasActiveTodos = false
  let reportBufferFile = null

  const todoStream = gulp
    .src([
      './src/**/*.{js,scss,html}',
      './gulp/**/*.js',
      '!./node_modules/**/*',
      '!./gulp/**/*.test.js',
      '!./gulp/**/*.spec.js',
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
          cb()
        },
      })
    )

  todoStream.on('end', () => {
    const reportPath = path.join(DEFAULT_REPORTS_DIR, DEFAULT_REPORTS_FILE)

    try {
      if (hasActiveTodos && reportBufferFile) {
        if (!fs.existsSync(DEFAULT_REPORTS_DIR)) {
          fs.mkdirSync(DEFAULT_REPORTS_DIR, { recursive: true })
        }
        fs.writeFileSync(reportPath, reportBufferFile.contents.toString())
        logger.debug(`TODO Inventory updated: ${getRelativePath(reportPath)}`)
      } else {
        // Clean up legacy report if no TODOs remain
        if (fs.existsSync(reportPath)) {
          fs.unlinkSync(reportPath)

          // Remove reports directory if it becomes empty
          const remainingFiles = fs.readdirSync(DEFAULT_REPORTS_DIR)
          if (remainingFiles.length === 0) {
            fs.rmdirSync(DEFAULT_REPORTS_DIR)
          }
          logger.verbose('No active tasks found. TODO report removed.')
        }
      }
    } catch (error) {
      logger.error('Failed to finalize TODO report.', error)
    }
  })

  return todoStream
}
