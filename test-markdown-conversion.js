#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs'
import matter from 'gray-matter'
import markdownFilter from 'nunjucks-markdown-filter'

/**
 * Tests the conversion of a markdown file to HTML using the markdownFilter.
 */
function testMarkdownConversion() {
  console.log('=== TESTING MARKDOWN CONVERSION ===')

  try {
    // Read the source markdown file.
    const mdContent = readFileSync('./src/routes/index.md', 'utf8')
    console.log('\nSource markdown:')
    console.log('--------------------------')
    console.log(mdContent.slice(0, 300) + '...')

    // Extract content, excluding front matter.
    const { content } = matter(mdContent)

    // Convert markdown to HTML.
    const htmlContent = markdownFilter(content)

    console.log('\nConverted HTML:')
    console.log('--------------------------')
    console.log(htmlContent.slice(0, 500) + '...')

    // Save the result to a test file.
    writeFileSync('./markdown-test-result.html', htmlContent)
    console.log('\nTest HTML saved to ./markdown-test-result.html')
  } catch (error) {
    console.error('Error testing markdown conversion:', error)
  }
}

// Execute the markdown conversion test.
testMarkdownConversion()

console.log('\n=== TEST COMPLETE ===')
