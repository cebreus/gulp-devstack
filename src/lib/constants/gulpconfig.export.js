import autoprefixer from 'autoprefixer';

// Paths
// --------------
export const devBase = './src';
export const buildBase = './export';
export const tempBase = './temp';
export const contentBase = './content';
export const staticBase = './static';

// SASS
// --------------

export const sassBase = `${devBase}/scss`;
export const sassBuild = `${buildBase}/assets/css`;
export const sassAll = [
  `${sassBase}/*.scss`,
  `!${sassBase}/_*.scss`,
  `!${sassBase}/u-*.scss`,
];
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

export const faviconSourceFile = `${gfxBase}/favicon/favicons-source.png`;
export const faviconBuild = `${buildBase}/assets/favicons`;
export const faviconGenConfig = {
  appName: 'My App',
  appShortName: 'App',
  appDescription: 'This is my application',
  developerName: 'Developer name',
  developerURL: 'https://developerwebsite.com/',
  background: '#000000',
  path: '/assets/favicons/',
  url: 'https://urlofwebsite.com/',
  display: 'standalone',
  orientation: 'portrait',
  scope: '/',
  start_url: '/index.html',
  version: 1.0,
  logging: true,
  html: 'favicons.njk',
  pipeHTML: true,
  replace: false,
  icons: {
    android: false,
    appleIcon: false,
    appleStartup: false,
    coast: false,
    favicons: true,
    firefox: false,
    windows: false,
    yandex: false,
  },
};
