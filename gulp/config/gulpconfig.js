// Build mode
export const version = 'dev'; // 'dev' for development, 'prod' for production

// Build directories
export const buildBase = './build';
export const tempBase = './.tmp';

// Static files
export const staticBase = './static';

// Base source directory
export const srcBase = './src';

// Routes paths - define these early as they are used by other paths
export const routesBase = './src/routes';

// SASS paths
export const sassBase = `${srcBase}/scss`;
export const sassCore = `${sassBase}/bootstrap.scss`;
export const sassCustom = `${sassBase}/custom.scss`;
export const sassUtils = `${sassBase}/utils.scss`;
export const sassComponentsGlob = `${srcBase}/components/**/*.scss`;
export const sassBuild = `${buildBase}/css`;
export const sassWatch = [
  `${sassBase}/**/*.scss`,
  `${srcBase}/components/**/*.scss`
];

// Postcss plugins configuration
export const postcssPluginsBase = [
  // Add your PostCSS plugins here
];

// JavaScript
export const jsBase = `${srcBase}/js`;
export const jsFiles = `${jsBase}/**/*.js`;
export const jsBuild = `${buildBase}/js`;

// Source maps configuration
export const sourceMaps = {
  development: true, // Enable/disable source maps in development
  production: true, // Enable/disable source maps in production
};

// Content and datasets
export const contentBase = routesBase;
export const datasetPagesSource =
  `${contentBase}/**/*.md`; // Markdown přímo v routes
export const datasetPagesBuild = `${tempBase}/pages`;

// Templates - aktualizace cest pro .njk soubory
export const tplPagesBase = routesBase; // Změna paths pro templates
export const tplTemplatesBase =
  srcBase; // Zůstává stejné pro přístup ke všem složkám
export const tplBuild = buildBase;
export const tplExtension = '.njk'; // přidání přípony

// Template paths
export const templatesBase = srcBase;
export const templatesPath = `${templatesBase}/templates`;
export const layoutsPath = `${templatesBase}/layouts`;
export const componentsPath = `${templatesBase}/components`;
export const partialsPath = `${templatesBase}/partials`;

// Template watch paths - routesBase is now defined before this
export const templateWatchPaths = [
  `${templatesPath}/**/*.*`,
  `${layoutsPath}/**/*.*`,
  `${componentsPath}/**/*.*`,
  `${routesBase}/**/*.*`,
];

// Aktualizované cesty pro assety
export const assetsBase = `${srcBase}/assets`;
export const fontsBase = `${assetsBase}/fonts`;
export const iconsBase = `${assetsBase}/icons`;
export const imagesBase = `${assetsBase}/images`;

// Aktualizované cesty pro výstup
export const fontsBuild = `${buildBase}/assets/fonts`;
export const iconsBuild = `${buildBase}/assets/icons`;
export const imagesBuild = `${buildBase}/assets/images`;

// Aktualizované cesty pro zdroje obrázků
export const imagesJpg = `${imagesBase}/**/*.{jpg,jpeg}`;
export const imagesPng = `${imagesBase}/**/*.png`;
export const imagesSvg = `${imagesBase}/**/*.svg`;

// Aktualizovaná cesta pro seznam fontů
export const fontloadFile = `${fontsBase}/fonts.list`;
export const fontLoadConfig = {
  fontsDir: fontsBase,
  outputDir: fontsBuild,
};

// Assets to inject
export const injectCdnJs = [];
export const injectJs = [
  `${jsBuild}/**/*.js`,
];
export const injectCss = [
  `${sassBuild}/**/*.css`,
];

// Site configuration with default values
export const siteDefaults = {
  title: 'Gulp DevStack',
  description: 'Modern frontend development workflow with Gulp',
  version: '4.5.0',
  author: 'Developer',
  copyright: 'Code licensed <a href="https://github.com/twbs/bootstrap/blob/main/LICENSE" target="_blank" rel="license noopener">MIT</a>',
  baseUrl: 'https://gulp-devstack.cebre.us',
  meta: {
    lang: 'en',
    charset: 'utf-8',
    author: 'humans.txt'
  },
  seo: {
    title: '𝕊𝕚𝕥𝕖 SEO Title',
    description: '𝕊𝕚𝕥𝕖 SEO Description',
    robots: 'index,follow',
    // Odstranění výchozí canonical URL, aby nezasahovala do našich generovaných URL
    // canonical: 'https://gulp-devstack.cebre.us/',
    iclude_to_sitemap: false
  },
  open_graph: {
    use: true,
    type: 'website',
    app_id: '',
    site_name: 'Gulp DevStack',
    image: ['/assets/images/gulp-devstack-open-graph.png'],
    image_text: '𝕊𝕚𝕥𝕖 Open Graph Image Text'
  },
  twitter_cards: {
    use: false,
    type: 'summary_large_image',
    image: [],
    site: '@cebreus69',
    creator: '@cebreus69'
  }
};
