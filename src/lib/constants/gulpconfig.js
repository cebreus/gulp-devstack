import autoprefixer from 'autoprefixer';

// Paths
// --------------

export const devBase = './src';
export const buildBase = './temp';
export const tempBase = './temp';
export const contentBase = './content';
export const staticBase = './static';

// SASS
// --------------
export const sassBase = `${devBase}/scss`;
export const sassBuild = `${buildBase}/assets/css`;
export const sassAll = [`${sassBase}/*.scss`, `!${sassBase}/_*.scss`];
export const sassCustom = [
  `${sassBase}/*.scss`,
  `!${sassBase}/u-*.scss`,
  `!${sassBase}/bootstrap.scss`,
];
export const sassCore = [`${sassBase}/bootstrap.scss`];
export const sassUtils = [`${sassBase}/u-*.scss`];
export const injectCss = `${sassBuild}/*.css`;

// JavaScript
// --------------
export const jsBase = `${devBase}/js`;
export const jsFiles = `${jsBase}/*.js`;
export const jsBuild = `${buildBase}/assets/js`;
export const injectJs = `${jsBuild}/*.js`;

export const injectCdnJs = [
  '<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>',
];

// Templates
// --------------
export const tplBase = `${devBase}/templates`;
export const tplBuild = buildBase;
export const tplPagesBase = `${tplBase}/pages`;
export const tplTemplatesBase = `${tplBase}`;

// Datasets from Markdown to JSON
// --------------
export const datasetPagesSource = `${contentBase}/pages/**/*.md`;
export const datasetPagesBuild = `${tempBase}/_dataset-pages`;

// GFX
// --------------
export const gfxBase = `${devBase}/gfx`;
export const gfxBuild = `${buildBase}/assets/images`;
export const jpgBase = `${gfxBase}/**`;
export const imagesJpg = [`${jpgBase}/*.jpg`, `!${devBase}/favicon/**/*.*`];
export const pngBase = `${gfxBase}/**`;
export const imagesPng = [`${pngBase}/*.png`, `!${pngBase}/favicon/**/*.*`];
export const svgBase = `${gfxBase}/**`;
export const imagesSvg = [`${svgBase}/*.svg`, `!${devBase}/favicon/**/*.*`];

// Modules & Plugins
// --------------
export const postcssPluginsBase = [
  autoprefixer({
    grid: true,
  }),
];

export const fontloadFile = `${devBase}/lib/constants/fonts.list`;
export const fontLoadConfig = {
  fontsDir: 'assets/font/',
  cssDir: 'assets/css/',
  cssFilename: 'fonts.scss',
  relativePaths: true,
  fontDisplayType: 'swap',
};
