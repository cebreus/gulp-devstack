#!/usr/bin/env node

import {
  createRequire
} from 'module';
import fs from 'fs';
import path from 'path';

// Import markdown filter using require
const require = createRequire(
  import.meta.url);
const markdownFilter = require('nunjucks-markdown-filter');
const matter = require('gray-matter');

// Test funkcionalita převodu Markdown na HTML
function testMarkdownConversion() {
  console.log('=== TESTING MARKDOWN CONVERSION ===');

  try {
    // Načtení vzorového markdown souboru
    const mdContent = fs.readFileSync('./src/routes/index.md', 'utf8');
    console.log('\nSource markdown:');
    console.log('--------------------------');
    console.log(mdContent.slice(0, 300) + '...');

    // Extrakce obsahu bez front matter
    const {
      content
    } = matter(mdContent);

    // Test konverze pomocí markdownFilter
    const htmlContent = markdownFilter(content);

    console.log('\nConverted HTML:');
    console.log('--------------------------');
    console.log(htmlContent.slice(0, 500) + '...');

    // Uložení výsledku do testovacího souboru
    fs.writeFileSync('./markdown-test-result.html', htmlContent);
    console.log('\nTest HTML saved to ./markdown-test-result.html');

  } catch (error) {
    console.error('Error testing markdown conversion:', error);
  }
}

// Spuštění testu
testMarkdownConversion();

console.log('\n=== TEST COMPLETE ===');
