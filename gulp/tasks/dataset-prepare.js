import gulp from 'gulp';
import through2 from 'through2';
import path from 'path';
import fs from 'fs';
import logger from '../utils/logger.js';




import matter from 'gray-matter';

/**
 * Prepares dataset from Markdown files
 * @param {string|string[]} src - Source path(s)
 * @param {string} dest - Destination directory
 * @param {Object} options - Options
 * @returns {NodeJS.ReadWriteStream} - Gulp stream
 */
export default function datasetPrepare(src, dest, options = {}) {
  const {
    cb = null,
  } = options;

  logger.debug(`Preparing dataset from ${src}`);

  // Create destination directory if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, {
      recursive: true
    });
  }

  let filesCount = 0;

  return gulp
    .src(src)
    .pipe(through2.obj(function (file, enc, callback) {
      try {
        // Get file info
        const filePath = file.path;
        const fileContent = file.contents.toString();
        const fileName = path.basename(filePath, path.extname(filePath));

        // Debug info
        logger.debug(`Processing Markdown file: ${filePath}`);

        // Extract front matter using gray-matter
        const parsed = matter(fileContent);

        // Calculate relative path keeping directory structure
        const relativePath = path.relative('./src/routes', path.dirname(
          filePath));

        // Create output directory
        const outputDir = path.join(dest, relativePath);
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, {
            recursive: true
          });
        }

        // Create the complete JSON structure
        const jsonData = {
          // Front matter data at root level
          ...parsed.data,
          // Content from markdown file
          content: parsed.content,
          // Preserve metadata path info
          path: relativePath === '' ? '/' : '/' + relativePath,
          fileName: fileName
        };

        // Debug output
        logger.debug(
          `Extracted data from ${relativePath}/${fileName}.md:`);
        logger.debug(JSON.stringify(jsonData, null, 2));

        // Write JSON file - pro debugging vypíšeme absolutní cestu k souboru
        const outputFile = path.join(outputDir, `${fileName}.json`);
        logger.debug(
          `Writing JSON data to: ${outputFile} (absolute: ${path.resolve(outputFile)})`
        );

        fs.writeFileSync(outputFile, JSON.stringify(jsonData, null, 2));

        filesCount++;
        callback(null, file);
      } catch (error) {
        logger.error(`Error processing Markdown file ${file.path}:`,
          error);
        callback(error, file);
      }
    }))
    .on('end', () => {
      logger.debug(
        `Dataset preparation complete: ${filesCount} files processed`);
      if (cb) cb();
    });
}
