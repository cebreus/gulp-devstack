const autoprefixer = require('autoprefixer');
const flexbugsFixes = require('postcss-flexbugs-fixes');

// Paths
// --------------

const devBase = './src';
const buildBase = './dist';
const tempBase = './temp';

// SASS
// --------------

const sassBase = `${devBase}/scss`;
const sassBuild = `${buildBase}/css`;
const sassAll = [`${sassBase}/*.scss`, `!${sassBase}/_*.scss`];
const sassCustom = [
  `${sassBase}/custom.scss`,
  `${sassBase}/c-*.scss`,
  `${sassBase}/_variables.scss`
];
const sassCore = [`${sassBase}/bootstrap.scss`, `${sassBase}/_variables.scss`];
const sassUtils = [`${sassBase}/u-*.scss`, `${sassBase}/_variables.scss`];
const injectCss = `${sassBuild}/*.css`;

// Data JSON
// --------------

const datasetJsonBase = `${devBase}/data/**/*.json`;
const datasetJsonFileName = 'dataset.json';
const datasetJsonBuild = tempBase;

// Templates
// --------------

const tplBase = `${devBase}/pages`;
// const tplMain = `${tplBase}/**/*.html`;
const tplMain = `${tplBase}/index.html`;
const tplBuild = `${buildBase}`;
const tplDataset = `${tempBase}/dataset.json`;

// GFX
// --------------

const gfxBase = `${devBase}/gfx`;
const gfxBuild = `${buildBase}/images`;

const svgBase = `${gfxBase}/**`;
const svgImages = `${svgBase}/*.svg`;

const jpgBase = `${gfxBase}/**`;
const jpgImages = `${jpgBase}/*.jpg`;

const pngBase = `${gfxBase}/**`;
const pngImages = `${pngBase}/*.png`;

// JavaScript
// --------------

const jsBase = `${devBase}/js`;
const jsFiles = `${jsBase}/*.js`;
const jsBuild = `${buildBase}/js`;
const injectJs = `${jsBuild}/*.js`;

const injectCdnJs = [
  '<script src="https://code.jquery.com/jquery-3.3.1.slim.min.js"></script>',
  '<script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.7/umd/popper.min.js"></script>',
  '<script src="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js"></script>'
];

// Modules & Plugins
// --------------

const postcssPluginsBase = [
  flexbugsFixes,
  autoprefixer({
    grid: true
  })
];

const fontloadFile = `${devBase}/fonts.list`;
const fontLoadConfig = {
  fontsDir: 'font/',
  cssDir: 'css/',
  cssFilename: 'fonts.css',
  relativePaths: true
};

const faviconSourceFile = `${gfxBase}/favicon/favicons-source.png`;
const faviconBuild = `${gfxBuild}/favicons`;
const faviconGenConfig = {
  appName: 'My App',
  appShortName: 'App',
  appDescription: 'This is my application',
  developerName: 'Developer name',
  developerURL: 'https://developerwebsite.com/',
  background: '#000000',
  path: '/images/favicons/',
  url: 'https://urlofwebsite.com/',
  display: 'standalone',
  orientation: 'portrait',
  scope: '/',
  start_url: '/?homescreen=1',
  version: 1.0,
  logging: false,
  html: 'index.html',
  pipeHTML: true,
  replace: true
};

module.exports = {
  devBase: devBase,
  buildBase: buildBase,
  tempBase: tempBase,
  sassBase: sassBase,
  sassBuild: sassBuild,
  sassAll: sassAll,
  sassCustom: sassCustom,
  sassCore: sassCore,
  sassUtils: sassUtils,
  postcssPluginsBase: postcssPluginsBase,
  injectCss: injectCss,
  datasetJsonBase: datasetJsonBase,
  datasetJsonBuild: datasetJsonBuild,
  datasetJsonFileName: datasetJsonFileName,
  tplBase: tplBase,
  tplMain: tplMain,
  tplBuild: tplBuild,
  tplDataset: tplDataset,
  injectCdnJs: injectCdnJs,
  jsFiles: jsFiles,
  jsBuild: jsBuild,
  injectJs: injectJs,
  gfxBase: gfxBase,
  gfxBuild: gfxBuild,
  svgImages: svgImages,
  jpgImages: jpgImages,
  pngImages: pngImages,
  fontloadFile: fontloadFile,
  fontLoadConfig: fontLoadConfig,
  faviconSourceFile: faviconSourceFile,
  faviconBuild: faviconBuild,
  faviconGenConfig: faviconGenConfig
};
