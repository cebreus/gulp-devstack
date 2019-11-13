const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const flexbugsFixes = require('postcss-flexbugs-fixes');

// Paths
// --------------

const devBase = './src';
const buildBase = './build';
const templateFolder = './temp';

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

// GFX
// --------------

const gfxBase = `${devBase}/gfx`;
const gfxBuild = `${buildBase}/images`;

const svgBase = `${gfxBase}/svg`;
const svgImages = `${svgBase}/*.svg`;

const jpgBase = `${gfxBase}/jpg`;
const jpgImages = `${jpgBase}/*.jpg`;

const pngBase = `${gfxBase}/png`;
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
  templateFolder: templateFolder,
  sassBase: sassBase,
  sassBuild: sassBuild,
  sassAll: sassAll,
  sassCustom: sassCustom,
  sassCore: sassCore,
  sassUtils: sassUtils,
  gfxBase: gfxBase,
  gfxBuild: gfxBuild,
  postcssPluginsBase: postcssPluginsBase,
  gfxBuild: gfxBuild,
  svgImages: svgImages,
  jpgImages: jpgImages,
  pngImages: pngImages
};
