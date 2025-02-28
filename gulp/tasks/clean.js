import {
  deleteAsync
} from 'del';

/**
 * Clean specified directories
 * @param {string|string[]} paths - Paths to clean
 * @returns {Promise} - Promise resolving when cleaning is done
 */
export default function clean(paths) {
  return deleteAsync(paths, {
    force: true
  });
}
