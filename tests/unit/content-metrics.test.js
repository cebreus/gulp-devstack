import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { calculateReadingTime } from '../../gulp/utils/content-metrics.js'

describe('Content Metrics Utility - calculateReadingTime', () => {
  it('should return zeros for empty or null content', () => {
    const expected = { minutes: 0, words: 0 }

    assert.deepStrictEqual(calculateReadingTime(''), expected)
    assert.deepStrictEqual(calculateReadingTime(null), expected)
    assert.deepStrictEqual(calculateReadingTime(undefined), expected)
  })

  it('should return 1 minute for short content (less than WPM threshold)', () => {
    const content = 'This is a short sentence.'
    const result = calculateReadingTime(content)

    assert.strictEqual(result.minutes, 1)
    assert.strictEqual(result.words, 5)
  })

  it('should calculate correctly for long content', () => {
    // 250 words should be 2 minutes at 200 WPM
    const words = new Array(250).fill('word').join(' ')
    const result = calculateReadingTime(words)

    assert.strictEqual(result.minutes, 2)
    assert.strictEqual(result.words, 250)
  })

  it('should respect custom wordsPerMinute option', () => {
    const words = new Array(100).fill('word').join(' ')
    // 100 words at 50 WPM should be 2 minutes
    const result = calculateReadingTime(words, { wordsPerMinute: 50 })

    assert.strictEqual(result.minutes, 2)
    assert.strictEqual(result.words, 100)
  })

  it('should ignore Markdown syntax for word count', () => {
    const markdown =
      '# Header\n\nThis is a [link](https://example.com) and some **bold text**.'
    // Expected words: "Header", "This", "is", "a", "link", "and", "some", "bold", "text" (9 words)
    const result = calculateReadingTime(markdown)

    assert.strictEqual(result.words, 9)
  })

  it('should throw or handle non-positive wordsPerMinute', () => {
    const content = 'Test'
    assert.throws(
      () => calculateReadingTime(content, { wordsPerMinute: 0 }),
      /wordsPerMinute must be positive/
    )
    assert.throws(
      () => calculateReadingTime(content, { wordsPerMinute: -1 }),
      /wordsPerMinute must be positive/
    )
  })
})
