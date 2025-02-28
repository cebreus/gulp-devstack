import fs from 'fs';
import path from 'path';
import logger from '../utils/logger.js';


/**
 * Load and process fonts based on config
 * @param {string} fontListFile - Path to file with font list
 * @param {string} tempDir - Temporary directory
 * @param {Object} options - Options object
 * @returns {void}
 */
export default function fontLoad(fontListFile, tempDir, options = {}) {
  const {
    config = {}, verbose = false, cb = null
  } = options;

  if (verbose) {
    logger.debug(`Processing fonts from ${fontListFile}`);
  }

  if (!fs.existsSync(fontListFile)) {
    console.error(`Font list file not found: ${fontListFile}`);
    if (cb) cb();
    return;
  }

  // Read font list
  const fontList = fs.readFileSync(fontListFile, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map(line => line.trim());

  // Output directory
  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, {
      recursive: true
    });
  }

  // Process each font
  fontList.forEach(fontName => {
    const sourcePath = path.join(config.fontsDir, fontName);
    const destPath = path.join(config.outputDir, fontName);

    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
      if (verbose) {
        logger.debug(`Copied font: ${fontName}`);
      }
    } else {
      console.warn(`Font not found: ${sourcePath}`);
    }
  });

  if (cb) cb();
}
