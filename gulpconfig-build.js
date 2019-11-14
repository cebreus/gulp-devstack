const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const flexbugsFixes = require('postcss-flexbugs-fixes');

// Paths
// --------------

const devBase = './src';
const buildBase = './build';
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

const svgBase = `${gfxBase}/**`;
const svgImages = `${svgBase}/*.svg`;

const jpgBase = `${gfxBase}/**`;
const jpgImages = `${jpgBase}/*.jpg`;

const pngBase = `${gfxBase}/**`;
const pngImages = `${pngBase}/*.png`;

// Modules & Plugins
// --------------

const postcssPluginsBase = [
  flexbugsFixes,
  autoprefixer({
    grid: true
  }),
  cssnano()
];

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
  injectCss: injectCss,
  gfxBase: gfxBase,
  gfxBuild: gfxBuild,
  datasetJsonBase: datasetJsonBase,
  datasetJsonBuild: datasetJsonBuild,
  datasetJsonFileName: datasetJsonFileName,
  tplBase: tplBase,
  tplMain: tplMain,
  tplBuild: tplBuild,
  tplDataset: tplDataset,
  injectCdnJs: injectCdnJs,
  postcssPluginsBase: postcssPluginsBase,
  jsFiles: jsFiles,
  jsBuild: jsBuild,
  injectJs: injectJs,
  gfxBuild: gfxBuild,
  svgImages: svgImages,
  jpgImages: jpgImages,
  pngImages: pngImages
};
