const autoprefixer = require('autoprefixer');
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
const sassAll = [
  `${sassBase}/*.scss`,
  `!${sassBase}/_*.scss`,
  `!${sassBase}/u-*.scss`,
];
const sassCustom = [
  `${sassBase}/custom.scss`,
  `${sassBase}/c-*.scss`,
  `${sassBase}/_variables.scss`,
];
const sassCore = [`${sassBase}/bootstrap.scss`, `${sassBase}/_variables.scss`];
const injectCss = `${sassBuild}/*.css`;

// Data JSON
// --------------

const datasetJsonBase = `${devBase}/data/**/*.json`;
const datasetJsonFileName = 'dataset.json';
const datasetJsonBuild = tempBase;

// Templates
// --------------

const tplBase = `${devBase}/pages`;
const tplMain = `${tplBase}/**/*.html`;
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
  '<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.4.1/jquery.slim.min.js" integrity="sha256-pasqAKBDmFT4eHoN2ndd6lN370kFiGUFyTiUHWhU7k8=" crossorigin="anonymous"></script>',
  '<script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.16.1/umd/popper.min.js" integrity="sha256-/ijcOLwFf26xEYAjW75FizKVo5tnTYiQddPZoLUHHZ8=" crossorigin="anonymous"></script>',
  '<script src="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.4.1/js/bootstrap.min.js" integrity="sha256-WqU1JavFxSAMcLP2WIOI+GB2zWmShMI82mTpLDcqFUg=" crossorigin="anonymous"></script>',
];

// Modules & Plugins
// --------------

const postcssPluginsBase = [
  flexbugsFixes,
  autoprefixer({
    grid: true,
  }),
];

// Files that need to be removed
// --------------

const buildRevManifest = `${buildBase}/rev-manifest.json`;

module.exports = {
  devBase: devBase,
  buildBase: buildBase,
  tempBase: tempBase,
  sassBase: sassBase,
  sassBuild: sassBuild,
  sassAll: sassAll,
  sassCustom: sassCustom,
  sassCore: sassCore,
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
  buildRevManifest: buildRevManifest,
};
