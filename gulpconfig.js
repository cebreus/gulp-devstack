const autoprefixer = require('autoprefixer');
const flexbugsFixes = require('postcss-flexbugs-fixes');

// Paths
// --------------

const devBase = './src';
const buildBase = './temp';
const tempBase = './temp';
const contentBase = './content';

// SASS
// --------------

const sassBase = `${devBase}/scss`;
const sassBuild = `${buildBase}/assets/css`;
const sassAll = [`${sassBase}/*.scss`, `!${sassBase}/_*.scss`];
const sassCustom = [
  `${sassBase}/*.scss`,
  `${sassBase}/_variables.scss`, // TODO: jw potřeba _variables.scss?
  `!${sassBase}/u-*.scss`,
  `!${sassBase}/bootstrap.scss`,
];
const sassCore = [`${sassBase}/bootstrap.scss`, `${sassBase}/_variables.scss`]; // TODO: je potřeba _variables.scss?
const sassUtils = [`${sassBase}/u-*.scss`, `${sassBase}/_variables.scss`]; // TODO: je potřeba _variables.scss?
const injectCss = `${sassBuild}/*.css`;

// JavaScript
// --------------

const jsBase = `${devBase}/js`;
const jsFiles = `${jsBase}/*.js`;
const jsBuild = `${buildBase}/assets/js`;
const injectJs = `${jsBuild}/*.js`;

const injectCdnJs = [
  '<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js" integrity="sha512-bLT0Qm9VnAYZDflyKcBaQ2gg0hSYNQrJ8RilYldYQ1FxQYoCLtUjuuRuZo+fjqhx/qtq/1itJ0C2ejDxltZVFg==" crossorigin="anonymous"></script>',
  '<script src="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.5.3/js/bootstrap.bundle.min.js" integrity="sha512-iceXjjbmB2rwoX93Ka6HAHP+B76IY1z0o3h+N1PeDtRSsyeetU3/0QKJqGyPJcX63zysNehggFwMC/bi7dvMig==" crossorigin="anonymous"></script>',
];

// Templates
// --------------

const tplBase = `${devBase}/templates`;
const tplBuild = buildBase;

const tplPagesBase = `${tplBase}/pages`;
const tplTemplatesBase = `${tplBase}`;

// Datasets from Markdown to JSON
// ----------------

const datasetPagesSource = `${contentBase}/pages/**/*.md`;
const datasetPagesBuild = `${tempBase}/_dataset-pages`;

// GFX
// --------------

const gfxBase = `${devBase}/gfx`;
const gfxBuild = `${buildBase}/assets/images`;

const jpgBase = `${gfxBase}/**`;
const imagesJpg = [`${jpgBase}/*.jpg`, `!${devBase}/favicon/**/*.*`];

const pngBase = `${gfxBase}/**`;
const imagesPng = [`${pngBase}/*.png`, `!${pngBase}/favicon/**/*.*`];

const svgBase = `${gfxBase}/**`;
const imagesSvg = [`${svgBase}/*.svg`, `!${devBase}/favicon/**/*.*`];

// Modules & Plugins
// --------------

const postcssPluginsBase = [
  flexbugsFixes,
  autoprefixer({
    grid: true,
  }),
];

const fontloadFile = `${devBase}/fonts.list`;
const fontLoadConfig = {
  fontsDir: 'assets/font/',
  cssDir: 'assets/css/',
  cssFilename: 'fonts.scss',
  relativePaths: true,
  fontDisplayType: 'swap',
};

// Exports
// --------------

module.exports = {
  buildBase,
  contentBase,
  datasetPagesBuild,
  datasetPagesSource,
  devBase,
  fontLoadConfig,
  fontloadFile,
  gfxBase,
  gfxBuild,
  imagesJpg,
  imagesPng,
  imagesSvg,
  injectCdnJs,
  injectCss,
  injectJs,
  jsBuild,
  jsFiles,
  postcssPluginsBase,
  sassAll,
  sassBase,
  sassBuild,
  sassCore,
  sassCustom,
  sassUtils,
  tempBase,
  tplBase,
  tplBuild,
  tplPagesBase,
  tplTemplatesBase,
};
