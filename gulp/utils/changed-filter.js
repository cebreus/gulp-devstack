import fs from 'node:fs/promises'
import path from 'node:path'
import { Transform } from 'node:stream'

function hasGlobPattern(filePath) {
  return /[*?[\]{}()!]/u.test(filePath)
}

function buildDestinationPath(file, options) {
  const { destination, extension, transformPath } = options
  const filePath = file.path

  if (transformPath) {
    return transformPath(filePath)
  }

  let relativePath = file.relative

  if (!relativePath && file.base) {
    relativePath = path.relative(file.base, filePath)
  }

  if (!relativePath) {
    throw new Error(
      `file.relative is required to build a destination path for ${filePath}`
    )
  }

  if (extension) {
    const dir = path.dirname(relativePath)
    const name = path.basename(relativePath, path.extname(relativePath))
    return path.join(destination, dir, name + extension)
  }

  return path.join(destination, relativePath)
}

async function hasChanged(sourcePath, destinationPath) {
  try {
    const [sourceStats, destinationStats] = await Promise.all([
      fs.stat(sourcePath),
      fs.stat(destinationPath),
    ])

    return sourceStats.mtime > destinationStats.mtime
  } catch {
    return true
  }
}

/**
 * Creates a Gulp-compatible transform that only passes through changed files.
 * @param {string} destination - Destination directory
 * @param {object} [options] - Change-detection options
 * @param {string} [options.extension] - Destination extension override
 * @param {(filePath: string) => string} [options.transformPath] - Absolute destination path resolver
 * @returns {Transform} Object-mode transform
 */
export default function createChangedFilter(destination, options = {}) {
  return new Transform({
    objectMode: true,
    async transform(file, _enc, cb) {
      if (!file || !file.path || hasGlobPattern(file.path)) {
        cb(null, file)
        return
      }

      try {
        const destinationPath = buildDestinationPath(file, {
          destination,
          extension: options.extension,
          transformPath: options.transformPath,
        })
        const shouldProcess = await hasChanged(file.path, destinationPath)

        cb(null, shouldProcess ? file : null)
      } catch (error) {
        cb(error)
      }
    },
  })
}
