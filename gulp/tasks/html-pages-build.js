import fs from 'fs';
import path from 'path';
import htmlBuildFnc from './html-build.js';
import logger from '../utils/logger.js';


import {
  glob
} from 'glob';

/**
 * Build HTML pages from templates
 * @param {Object} config - Configuration object
 * @param {Function} cb - Callback function
 * @returns {*} - Result of htmlBuildFnc
 */
export default function buildHtmlPages(config, cb) {
  const isDev = config.version === 'dev';
  const cssPath = isDev ? config.sassBuild : `${config.sassBuild}/min`;
  const jsPath = isDev ? config.jsBuild : `${config.jsBuild}/min`;

  // Create paths if they don't exist
  [cssPath, jsPath].forEach(dir => {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, {
          recursive: true
        });
      }
    } catch (error) {
      logger.error(`Error creating directory ${dir}:`, error);
    }
  });

  // Paths to search for templates
  const templatePaths = [
    path.resolve(config.tplTemplatesBase),
    path.resolve(config.layoutsPath),
    path.resolve(config.componentsPath),
    path.resolve(config.partialsPath)
  ];

  // Standard pages use index.njk pattern in directories
  const indexPages = `${config.routesBase}/**/index${config.tplExtension}`;

  // Special pages: any direct file in the routes directory that isn't an index file
  const specialPages = `${config.routesBase}/*[!index]${config.tplExtension}`;

  // Define CSS files for injection based on environment
  let cssFiles;
  cssFiles = glob.sync(`${cssPath}/**/*.css`).filter(file => !file.includes(
    '.min.css'));


  // Define JS files for injection based on environment
  let jsFiles;
  jsFiles = glob.sync(`${jsPath}/**/*.js`).filter(file => !file.includes(
    '.min.js'));



  logger.debug(
    `Looking for CSS files in: ${cssPath}`
  );
  logger.debug(`Found ${cssFiles.length} CSS files:`, cssFiles);

  logger.debug(
    `Looking for JS files in: ${jsPath})`
  );
  logger.debug(`Found ${jsFiles.length} JS files:`, jsFiles);

  // Find template files
  logger.debug('Looking for template files:');
  const foundIndexPages = glob.sync(indexPages);
  logger.debug(`Found ${foundIndexPages.length} index pages:`,
    foundIndexPages);

  const foundSpecialPages = glob.sync(specialPages);
  logger.debug(`Found ${foundSpecialPages.length} special pages:`,
    foundSpecialPages);

  // Generic path transformation function for both CSS and JS
  const transformPath = function (filepath, tagType) {
    // Extract build folder name from config.tplBuild path
    const buildDirName = path.basename(config.tplBuild);
    // Create a dynamic regex using the extracted build folder name
    const buildRegex = new RegExp(`.*${buildDirName}[/\\\\]`, '');

    let cleanPath = filepath.replace(buildRegex, '');
    if (!cleanPath.startsWith('/')) {
      cleanPath = '/' + cleanPath;
    }
    logger.debug(
      `Transforming ${tagType} path: ${filepath} -> ${cleanPath}`);

    return tagType === 'css' ?
      `<link rel="stylesheet" href="${cleanPath}">` :
      `<script src="${cleanPath}"></script>`;
  };

  const params = {
    input: [...foundIndexPages, ...foundSpecialPages],
    output: config.tplBuild,
    processPaths: templatePaths,
    dataSource: config.datasetPagesBuild,
    injectCdnJs: config.injectCdnJs,
    injectJs: jsFiles,
    injectCss: cssFiles,
    injectIgnorePath: config.buildBase,
    relative: false,
    transformCss: (filepath) => transformPath(filepath, 'css'),
    transformJs: (filepath) => transformPath(filepath, 'js'),
    preserveStructure: true,
    specialPages: foundSpecialPages.map(file => path.basename(file)),
    cb,
    siteDefaults: config.siteDefaults,
  };

  return htmlBuildFnc(params);
}
