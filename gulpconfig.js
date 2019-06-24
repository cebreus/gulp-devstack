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

// Modules & Plugins
// --------------

const postcssPluginsBase = [
    flexbugsFixes,
    autoprefixer({
        grid: true
    })
];

module.exports = {
    devBase: devBase,
    buildBase: buildBase,
    sassBase: sassBase,
    sassBuild: sassBuild,
    sassAll: sassAll,
    sassCustom: sassCustom,
    sassCore: sassCore,
    sassUtils: sassUtils,
    datasetJsonBase: datasetJsonBase,
    datasetJsonBuild: datasetJsonBuild,
    datasetJsonFileName: datasetJsonFileName,
    tplBase: tplBase,
    tplMain: tplMain,
    tplBuild: tplBuild,
    tplDataset: tplDataset,
    postcssPluginsBase: postcssPluginsBase
};
