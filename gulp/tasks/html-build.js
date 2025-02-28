import gulp from 'gulp';
import nunjucksRender from 'gulp-nunjucks-render';
import data from 'gulp-data';
import fs from 'fs';
import path from 'path';
import inject from 'gulp-inject';
import htmlbeautify from 'gulp-html-beautify';
import plumber from 'gulp-plumber';
import replace from 'gulp-replace';
import {
  glob
} from 'glob';
// Convert CommonJS modules to ESM imports
import nunjucksDateFilter from 'nunjucks-date-filter-locale';
import nunjucksMarkdownFilter from 'nunjucks-markdown-filter';

import logger from '../utils/logger.js';

// Rename imported functions to match previously used variables
const dateFilter = nunjucksDateFilter;
const markdownFilter = nunjucksMarkdownFilter;

// Pomocná funkce pro práci s meta daty stránky - upravena pro striktnější zacházení s daty
function generateMetadata(page = {}, options = {}) {
  const {
    fileName = '',
      routePath = '',
      baseUrl
  } = options;

  // Kontrola povinných parametrů
  if (!baseUrl) {
    throw new Error('baseUrl is required for metadata generation');
  }

  // Výchozí meta data - minimální verze bez fallbacků
  const defaultMeta = {
    title: page.title || '',
    description: page.description || '',
    robots: 'index, follow',
    canonical: `${baseUrl}/${routePath ? routePath + '/' : ''}`,
    og: {
      use: true,
      type: 'website',
      title: '',
      description: '',
      site_name: '',
      image: []
    },
    twitter: {
      use: false,
      type: 'summary_large_image',
      title: '',
      description: '',
      site: '',
      creator: '',
      image: []
    }
  };

  // Zpracování SEO metadat
  const seo = {
    ...defaultMeta,
    ...(page.seo || {})
  };

  // Zpracování Open Graph metadat
  let og = {
    ...defaultMeta.og
  };

  if (page.open_graph) {
    og = {
      ...og,
      use: page.open_graph.use !== undefined ? page.open_graph.use : og.use,
      type: page.open_graph.type || og.type,
      title: page.open_graph.title || seo.title,
      description: page.open_graph.description || seo.description,
      site_name: page.open_graph.site_name || '',
      image: page.open_graph.image || []
    };
  }

  // Zpracování Twitter Cards metadat
  let twitter = {
    ...defaultMeta.twitter
  };

  if (page.twitter_cards) {
    twitter = {
      ...twitter,
      use: page.twitter_cards.use !== undefined ? page.twitter_cards.use :
        twitter.use,
      type: page.twitter_cards.type || twitter.type,
      title: page.twitter_cards.title || seo.title,
      description: page.twitter_cards.description || seo.description,
      site: page.twitter_cards.site || twitter.site,
      creator: page.twitter_cards.creator || twitter.creator,
      image: page.twitter_cards.image || []
    };
  }

  // Vytvoření finálního objektu metadat
  return {
    title: seo.title,
    description: seo.description,
    robots: seo.robots,
    canonical: seo.canonical,
    og: og,
    twitter: twitter
  };
}

// Hlavní funkce pro build HTML
export default function htmlBuild(params) {
  // Nastavení jazyka pro nunjucks date filter
  dateFilter.setLocale('cs');

  // Nastavení pro Nunjucks
  const nunjucksOptions = {
    path: params.processPaths,
    envOptions: {
      autoescape: false,
      trimBlocks: true,
      lstripBlocks: true,
    }
  };

  // Konfigurace pro zkrášlovač HTML
  const htmlBeautifyOptions = {
    indent_size: 2,
    indent_char: ' ',
    max_preserve_newlines: 1,
    preserve_newlines: true,
    indent_inner_html: false,
    end_with_newline: true,
  };

  // Načtení dat pro každou stránku
  const loadData = function (file) {
    const filePath = file.path;
    const fileDir = path.dirname(filePath);
    const fileName = path.basename(filePath, path.extname(filePath));

    // Pro debug - vypíšeme přesně, jaký soubor zpracováváme
    logger.debug('Processing file:', filePath);

    // Relativní cesta ke stránce pro zjištění adresářové struktury - oprava relativní cesty
    const relativePath = path.relative(
      path.resolve('./src/routes'),
      fileDir
    );

    // Určení typu stránky
    const isSpecialPage = params.specialPages && params.specialPages.includes(
      fileName + path.extname(filePath));
    const isRootPage = relativePath === '';

    // Debug informace
    logger.debug('File info:', {
      filePath,
      fileDir,
      fileName,
      relativePath,
      isSpecialPage,
      isRootPage
    });

    // Cesta k JSON souborům s daty - oprava cest k JSON datům
    let jsonFilePath;
    if (isSpecialPage) {
      // Speciální stránky (např. 404.njk) jsou v kořenu
      jsonFilePath = path.join(params.dataSource, `${fileName}.json`);
    } else {
      // Ostatní stránky respektují adresářovou strukturu
      if (isRootPage) {
        jsonFilePath = path.join(params.dataSource, `${fileName}.json`);
      } else {
        jsonFilePath = path.join(params.dataSource, relativePath,
          `${fileName}.json`);
      }
    }

    logger.debug('Looking for JSON data at:', jsonFilePath);

    // Base page data without fallbacks
    let pageData = {
      title: '',
      description: '',
      content: '',
      // Site defaults from gulpconfig.js
      site: params.siteDefaults || {}
    };

    // Require site configuration to be provided
    if (!pageData.site || !pageData.site.baseUrl) {
      logger.error(
        'Site configuration is missing or invalid. Check siteDefaults in config.'
      );
    }

    // Pokus o načtení dat z JSON souboru
    if (fs.existsSync(jsonFilePath)) {
      try {
        const fileData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));

        logger.debug('Found JSON data:', JSON.stringify(fileData, null, 2));

        // Konvertujeme Markdown obsah do HTML - oprava konverze markdown
        let htmlContent = '';

        try {
          if (fileData.content && typeof fileData.content === 'string') {
            // Zkusíme použít markdownFilter ze závislostí
            htmlContent = markdownFilter(fileData.content);
            logger.debug('Markdown successfully converted to HTML');

            // Pro debug - ukázka části HTML obsahu
            logger.debug('HTML preview:', htmlContent.substring(0, 150) +
              '...');
          } else {
            logger.warn('Content is not a valid string:', fileData.content);
          }
        } catch (mdError) {
          logger.error('Error converting Markdown to HTML:', mdError);
        }

        // Sloučit data s výchozími hodnotami
        pageData = {
          ...pageData,
          ...fileData,
          // Zajistit, že správně strukturujeme data pro šablonu
          page: {
            ...fileData,
            content: htmlContent,
            features: fileData.features || []
          }
        };

        // Pro jistotu přiřadíme obsah i na úrovni kořene objektu
        pageData.content = htmlContent;

        try {
          // Generate metadata using the helper function
          const routePath = isRootPage ? '' : relativePath;

          // Use strict baseUrl from site config
          if (!pageData.site || !pageData.site.baseUrl) {
            throw new Error(
              'Site baseUrl is required for metadata generation');
          }

          const meta = generateMetadata(pageData, {
            fileName,
            routePath,
            baseUrl: pageData.site.baseUrl
          });

          // Assign metadata to page data
          pageData.meta = meta;
        } catch (metaError) {
          logger.error(`Error generating metadata for ${fileName}:`,
            metaError);
          // Set empty metadata object rather than using fallbacks
          pageData.meta = {
            title: pageData.title || '',
            description: pageData.description || ''
          };
        }

        if (params.verbose) {
          logger.debug('Final page data:', JSON.stringify(pageData, null, 2));
        }
      } catch (err) {
        logger.error(`Error parsing JSON data for ${jsonFilePath}:`, err);
      }
    } else {
      logger.warn(`No JSON data found for ${fileName} at ${jsonFilePath}`);

      // Don't generate metadata if no JSON data exists - page should fail properly
      pageData.meta = {
        title: '',
        description: ''
      };
    }

    return pageData;
  };

  // Stream pro zpracování HTML
  let stream = gulp.src(params.input, {
      base: './src/routes'
    }) // Přidáme base pro zachování struktury adresářů
    .pipe(plumber())
    .pipe(data(loadData))
    .pipe(nunjucksRender({
      ...nunjucksOptions,
      manageEnv: (env) => {
        // Přidání filtrů do Nunjucks prostředí
        env.addFilter('date', dateFilter);
        // Markdown filtr s možnostmi
        env.addFilter('md', (content) => {
          if (typeof content !== 'string') {
            return '';
          }
          return markdownFilter(content);
        });

        // Přidáme další užitečné filtry
        env.addFilter('json', (obj) => {
          return JSON.stringify(obj, null, 2);
        });

        env.addFilter('dump', (obj) => {
          return `<pre>${JSON.stringify(obj, null, 2)}</pre>`;
        });

        // Filtr pro jedinečné hodnoty v poli
        env.addFilter('unique', (arr) => {
          if (Array.isArray(arr)) {
            return arr.filter((e, i, a) => a.indexOf(e) === i);
          }
          return arr;
        });

        // Globální funkce pro převod na datum
        env.addGlobal('toDate', (date) => {
          return date ? new Date(date) : new Date();
        });
      }
    }));

  // Injektování CSS souborů
  if (params.injectCss && params.injectCss.length > 0) {
    logger.debug('CSS files for injection:', params.injectCss);

    // Najít všechny odpovídající CSS soubory
    const cssFilePatterns = Array.isArray(params.injectCss) ?
      params.injectCss : [params.injectCss];
    let cssFiles = [];
    cssFilePatterns.forEach(pattern => {
      const files = glob.sync(pattern);
      logger.debug(`Pattern ${pattern} matched ${files.length} files`);
      files.forEach(file => cssFiles.push(file));
    });

    // Ruční kontrola existence bootstrap.css
    const bootstrapCss = path.join(params.injectIgnorePath, 'css',
      'bootstrap.css');
    if (fs.existsSync(bootstrapCss) && !cssFiles.includes(bootstrapCss)) {
      logger.debug('Manually adding missing bootstrap.css:', bootstrapCss);
      cssFiles.push(bootstrapCss);
    }

    if (cssFiles.length > 0) {
      logger.debug('Found CSS files for injection:', cssFiles);

      stream = stream.pipe(inject(
        gulp.src(cssFiles, {
          read: false
        }), {
          starttag: '<!-- inject:css -->',
          endtag: '<!-- endinject -->',
          transform: params.transformCss || ((filepath) => {
            logger.debug(`Transforming path: ${filepath}`);
            // Odstranění build/ z cesty a přidání lomítka na začátek
            const cleanPath = filepath.replace(/.*build[\/\\]/, '');
            const absolutePath = cleanPath.startsWith('/') ? cleanPath :
              `/${cleanPath}`;
            logger.debug(`Transformed to: ${absolutePath}`);
            return `<link rel="stylesheet" href="${absolutePath}">`;
          }),
          relative: false
        }
      ));
    } else {
      console.warn(
        'No CSS files found for injection! Check compilation steps.');
      // Odstranit placeholder, pokud nejsou CSS soubory
      stream = stream.pipe(replace(
        /<!-- inject:css -->[\s\S]*?<!-- endinject -->/,
        '<!-- No CSS files found for injection -->'
      ));
    }
  }

  // Injektování JS souborů
  if (params.injectJs && params.injectJs.length > 0) {
    logger.debug('JS files for injection:', params.injectJs);

    // Najít všechny odpovídající JS soubory
    const jsFilePatterns = Array.isArray(params.injectJs) ?
      params.injectJs : [params.injectJs];

    const jsFiles = jsFilePatterns
      .flatMap(pattern => glob.sync(pattern))
      .filter(Boolean);

    if (jsFiles.length > 0) {
      logger.debug('Found JS files:', jsFiles);

      stream = stream.pipe(inject(
        gulp.src(jsFiles, {
          read: false
        }), {
          starttag: '<!-- inject:js -->',
          endtag: '<!-- endinject -->',
          transform: params.transformJs || ((filepath) => {
            // Odstranění build/ z cesty a přidání lomítka na začátek
            const cleanPath = filepath.replace(/.*build[\/\\]/, '');
            const absolutePath = cleanPath.startsWith('/') ? cleanPath :
              `/${cleanPath}`;
            return `<script src="${absolutePath}"></script>`;
          }),
          relative: false
        }
      ));
    } else {
      console.warn('No JS files found for injection!');
      // Odstranit placeholder, pokud nejsou JS soubory
      stream = stream.pipe(replace(
        /<!-- inject:js -->[\s\S]*?<!-- endinject -->/,
        '<!-- No JS files found for injection -->'
      ));
    }
  }

  // Injektování CDN JS
  if (params.injectCdnJs && params.injectCdnJs.length > 0) {
    stream = stream.pipe(replace(
      '<!-- inject:cdn:js -->\n<!-- endinject -->',
      params.injectCdnJs.join('\n')
    ));
  } else {
    // Odstranit placeholder, pokud nejsou CDN JS
    stream = stream.pipe(replace(
      /<!-- inject:cdn:js -->[\s\S]*?<!-- endinject -->/,
      ''
    ));
  }

  // Nahrazení bootstrap js placeholderu
  stream = stream.pipe(replace(
    '<!-- inject: bootstrap js -->',
    '<!-- Bootstrap JS injected via CDN -->'
  ));

  // Vylepšení přístupnosti tabulek - přidání scope="col" k TH elementům
  stream = stream.pipe(replace(/<th>/g, '<th scope="col">'));

  // Odstranění komentářů z HTML pro lepší optimalizaci
  stream = stream.pipe(replace(
    /( )*<!--((.*)|[^<]*|[^!]*|[^-]*|[^>]*)-->\n*/g,
    ''
  ));

  // Zkrášlení HTML a zápis do výstupní složky
  stream = stream
    .pipe(htmlbeautify(htmlBeautifyOptions))
    .pipe(gulp.dest(params.output))
    .on('end', () => {
      if (params.verbose) {
        logger.debug(`HTML vygenerováno do: ${params.output}`);
        // Pro debugging: výpis všech generovaných souborů
        const generatedFiles = glob.sync(`${params.output}/**/*.html`);
        logger.debug(`Vygenerované soubory (${generatedFiles.length}):`);
        generatedFiles.forEach(file => logger.debug(` - ${file}`));
      }
      if (params.cb) {
        params.cb();
      }
    });

  return stream;
}
