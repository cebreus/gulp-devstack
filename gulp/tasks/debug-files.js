import fs from 'fs';
import path from 'path';
import logger from '../utils/logger.js';

import {
  createRequire
} from 'module';

const require = createRequire(
  import.meta.url);
const glob = require('glob');

/**
 * Diagnostic function for checking file status and content
 * This helps with debugging build and template issues
 *
 * @param {Object} logger - Logger object (loglevel) for output messages
 * @returns {void}
 */
export default function debugFiles() {

  logger.debug('Starting debug files analysis task');

  // Check files in src/routes
  const routesFiles = glob.sync('./src/routes/**/*.*');
  logger.debug('\nFiles in src/routes directory:');
  routesFiles.forEach(file => {
    const exists = fs.existsSync(file);
    logger.debug(` - ${file} (${exists ? 'exists' : 'NOT FOUND!'})`);

    // Show more details for not found files
    if (!exists) {
      logger.warn(
        `   Warning: File referenced but not found at path: ${file}`);
    }
  });

  // Special check for index.njk (main template)
  const indexNjk = './src/routes/index.njk';
  const indexExists = fs.existsSync(indexNjk);
  logger.debug(
    `\nChecking index.njk: ${indexExists ? 'EXISTS' : 'NOT FOUND!'}`
  );

  // Show content preview if the file exists
  if (indexExists) {
    logger.debug('Content of index.njk (first 200 chars):');
    const content = fs.readFileSync(indexNjk, 'utf8');
    logger.debug(content.substring(0, 200) + (content.length > 200 ? '...' :
      ''));
  } else {
    logger.warn(
      'WARNING: Main index.njk template not found. This may cause build failures.'
    );
  }

  // Check generated output files
  const buildFiles = glob.sync('./build/**/*.html');
  logger.debug('\nGenerated HTML files:');
  if (buildFiles.length === 0) {
    logger.warn('No HTML files found in build directory!');
  } else {
    buildFiles.forEach(file => {
      logger.debug(` - ${file} (${path.basename(file)})`);
    });
  }

  // Check for main index.html output
  const indexHtml = './build/index.html';
  const indexHtmlExists = fs.existsSync(indexHtml);
  logger.debug(
    `\nChecking build/index.html: ${indexHtmlExists ? 'EXISTS' : 'NOT FOUND!'}`
  );

  if (!indexHtmlExists) {
    logger.warn(
      'WARNING: Main index.html not generated. Build process may have failed.'
    );
  } else {
    // Show file size for reference
    const stats = fs.statSync(indexHtml);
    logger.debug(`  File size: ${(stats.size / 1024).toFixed(2)} KB`);
  }

  // Summary
  logger.debug('\nDebug Summary:');
  logger.debug(`  - Source files found: ${routesFiles.length}`);
  logger.debug(`  - HTML files generated: ${buildFiles.length}`);
  logger.debug(`  - Main template status: ${indexExists ? 'OK' : 'MISSING'}`);
  logger.debug(`  - Main output status: ${indexHtmlExists ? 'OK' : 'MISSING'}`);

  logger.debug('Debug files analysis task completed');
}
