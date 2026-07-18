import { Transform } from 'node:stream'

/**
 * @param {(filePath: string) => boolean} isPrivateFile - Predicate for ignoring private files.
 * @returns {Transform} Object-mode filter that removes private files from a stream.
 */
export function createPrivateFileFilter(isPrivateFile) {
  return new Transform({
    objectMode: true,
    transform(file, _enc, cb) {
      try {
        if (isPrivateFile(file.path)) {
          return cb(null, null)
        }
        cb(null, file)
      } catch (error) {
        cb(error)
      }
    },
  })
}

/**
 * @param {string[]} trackedFiles - Mutable array used for logging output files.
 * @param {(targetPath: string) => string} getRelativePath - Relative path formatter.
 * @returns {Transform} Object-mode tracker that records emitted file paths.
 */
export function createTrackedFileCollector(trackedFiles, getRelativePath) {
  return new Transform({
    objectMode: true,
    transform(file, _enc, cb) {
      try {
        if (file?.path) {
          trackedFiles.push(getRelativePath(file.path))
        }
        cb(null, file)
      } catch (error) {
        cb(error)
      }
    },
  })
}

const privateStreamsApi = {
  createPrivateFileFilter,
  createTrackedFileCollector,
}

export default privateStreamsApi
