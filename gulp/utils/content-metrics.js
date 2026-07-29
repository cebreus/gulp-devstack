/**
 * Calculates the estimated reading time for a given content string.
 * @param {string} content - The content to analyze.
 * @param {object} [options] - Configuration options.
 * @param {number} [options.wordsPerMinute] - Words read per minute.
 * @returns {{minutes: number, words: number}} An object containing minutes and word count.
 */
export function calculateReadingTime(content, { wordsPerMinute = 200 } = {}) {
  if (!Number.isFinite(wordsPerMinute) || wordsPerMinute <= 0) {
    throw new Error('wordsPerMinute must be a finite positive number.')
  }

  if (!content || typeof content !== 'string') {
    return { minutes: 0, words: 0 }
  }

  // Simple Markdown stripping
  const cleanContent = content
    .replace(/^#+\s+/gm, '') // Headers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1') // Bold/Italic
    .replace(/`{1,3}[^`]+`{1,3}/g, '') // Code blocks/inline code (usually not read aloud or at same speed)
    .trim()

  const words = cleanContent.split(/\s+/).filter(Boolean).length
  const minutes = Math.ceil(words / wordsPerMinute)

  return { minutes, words }
}
