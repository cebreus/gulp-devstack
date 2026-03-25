import gulp from 'gulp'

import { getRelativePath } from '../utils/helpers.js'
import logger from '../utils/logger.js'
import todo from 'gulp-todo'
import fs from 'node:fs'
import path from 'node:path'
import through2 from 'through2'

const outputDir = './.reports'
const outputFile = 'TODO.md'

const TODO_HEADER_LINES = [
  '### TODOs',
  '| Filename | line # | TODO',
  '|:------|:------:|:------',
]

/**
 * Checks if the given lines array contains only the header lines.
 * @param {string[]} lines - The lines to check.
 * @param {string[]} headerLines - The header lines to compare against.
 * @returns {boolean} Returns true if lines only contain the header, false otherwise.
 */
function isOnlyHeaderLines(lines, headerLines) {
  if (lines.length !== headerLines.length) return false
  for (let i = 0; i < headerLines.length; i++) {
    if (lines[i] !== headerLines[i]) return false
  }
  return true
}

/**
 * Gulp task to generate a TODO report from source and gulp files (sync version).
 * Writes TODO.md to .reports if TODOs are found, otherwise cleans up the report.
 * @returns {import('stream').Stream} The gulp stream for the todo task.
 */
export default function todoTask() {
  let shouldWrite = false
  let fileToWrite = null

  const stream = gulp
    .src([
      './src/**/*.{js,scss,html}',
      './gulp/**/*.js',
      '!./node_modules/**/*',
      '!./gulp/**/*.test.js',
      '!./gulp/**/*.spec.js',
    ])
    .pipe(todo({ fileName: outputFile }))
    .pipe(
      through2.obj(function (file, _, cb) {
        const content = file.contents ? file.contents.toString().trim() : ''
        const lines = content.split('\n')
        if (!isOnlyHeaderLines(lines, TODO_HEADER_LINES)) {
          shouldWrite = true
          fileToWrite = file
        } else {
          logger.debug('[TODO] No TODOs found, skipping write.')
        }
        cb()
      })
    )
    .on('end', () => {
      const dest = path.join(outputDir, outputFile)
      try {
        if (shouldWrite && fileToWrite) {
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true })
          }
          fs.writeFileSync(dest, fileToWrite.contents.toString())
          logger.debug(`[TODO] Report generated at ${getRelativePath(dest)}`)
        }
        // Clean up the TODO report if it contains only the header.
        if (fs.existsSync(dest)) {
          const content = fs.readFileSync(dest, 'utf8')
          const lines = content.trim().split('\n')
          if (isOnlyHeaderLines(lines, TODO_HEADER_LINES)) {
            fs.unlinkSync(dest)
            // Remove the reports directory if it's empty.
            const filesInOutputDir = fs.readdirSync(outputDir)
            if (filesInOutputDir.length === 0) {
              fs.rmdirSync(outputDir)
            }
            logger.debug('[TODO] Report contained only header and was removed.')
          }
        }
      } catch (error) {
        logger.error('Error during TODO report sync task:', error)
      }
    })

  return stream
}
