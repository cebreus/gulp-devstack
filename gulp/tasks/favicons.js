import favicons from 'favicons';
import {
  promises as fs
} from 'fs';
import path from 'path';

import logger from '../utils/logger.js';

/**
 * Generate favicons using the shared configuration and the favicons package.
 * Writes all generated files to the output directory and logs progress.
 * @param {string} sourcePath - Path to the source image file.
 * @param {string} outputDir - Output directory for generated favicons.
 * @param {object} faviconConfig - Favicons configuration object.
 * @async
 * @returns {Promise<void>} Resolves when favicons are generated.
 */
export async function generateFavicons(sourcePath, outputDir, faviconConfig) {
  try {
    // Check if the source image exists.
    try {
      await fs.access(sourcePath);
      logger.debug(`Source image exists: ${sourcePath}`);
    } catch {
      logger.error(`Source image not found: ${sourcePath}`);
      process.exit(2);
    }

    // Create the output directory if it doesn't exist.
    await fs.mkdir(outputDir, {
      recursive: true
    });

    logger.debug(
      `Using favicon config: ${JSON.stringify(faviconConfig, null, 2)}`);

    // Generate the favicons.
    const response = await favicons(sourcePath, faviconConfig);

    // Write the generated images to the output directory.
    for (const image of response.images) {
      const filePath = path.join(outputDir, image.name);
      await fs.writeFile(filePath, image.contents);
      logger.debug(`Image: ${filePath}`);
    }

    // Write the generated files to the output directory.
    for (const file of response.files) {
      const filePath = path.join(outputDir, file.name);
      await fs.writeFile(filePath, file.contents);
      logger.debug(`File: ${filePath}`);
    }

    // Write the generated HTML to the output directory.
    if (response.html && response.html.length > 0) {
      const htmlPath = path.join(outputDir, 'favicons.html');
      await fs.writeFile(htmlPath, response.html.join('\n'));
      logger.debug(`HTML: ${htmlPath}`);
    }

    logger.verbose(`Favicons generated in: ${outputDir}`);
    logger.verbose(
      `Generated ${response.images.length} images, ${response.files.length} files, and ${response.html ? response.html.length : 0} HTML lines`
    );
  } catch (error) {
    logger.error(`Unhandled error during favicon generation: ${error}`);
    process.exit(1);
  }
}

// If the script is executed directly, run the generateFavicons function.
if (process.argv[1] === new URL(
    import.meta.url).pathname) {
  generateFavicons();
}

export default generateFavicons;
