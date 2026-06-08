import initTemplateContent from './init-template-content.js'

/**
 * Builds the list of core files that must be reset for a blank template.
 * @param {object} options - Content generation parameters.
 * @param {string} options.rawProjectName - Human-readable project name.
 * @param {string} options.author - Project author.
 * @param {string} options.siteUrl - Production site URL.
 * @returns {Array<{path: string, content: string}>} Files to rewrite.
 */
export default function buildFilesToReset({ rawProjectName, author, siteUrl }) {
  const {
    generateClean404,
    generateClean404Data,
    generateCleanComponentsScss,
    generateCleanIndex,
    generateCleanIndexData,
    generateCleanJs,
    generateCleanLayout,
    generateCleanReadme,
    generateCleanRobotsTxt,
    generateCleanScss,
    generateCleanSiteConfig,
    generateCleanTestingDoc,
  } = initTemplateContent

  return [
    {
      path: 'src/routes/layout-default.njk',
      content: generateCleanLayout(),
    },
    { path: 'src/routes/index.md', content: generateCleanIndexData() },
    { path: 'src/routes/index.njk', content: generateCleanIndex() },
    { path: 'src/routes/404.md', content: generateClean404Data() },
    { path: 'src/routes/404.njk', content: generateClean404() },
    { path: 'src/scss/custom.scss', content: generateCleanScss() },
    {
      path: 'src/scss/components.scss',
      content: generateCleanComponentsScss(),
    },
    { path: 'src/js/main.js', content: generateCleanJs() },
    { path: 'src/js/custom.js', content: '' },
    {
      path: 'README.md',
      content: generateCleanReadme({ projectName: rawProjectName }),
    },
    { path: 'docs/TESTING.md', content: generateCleanTestingDoc() },
    { path: 'public/robots.txt', content: generateCleanRobotsTxt() },
    {
      path: 'src/config/site.js',
      content: generateCleanSiteConfig({
        projectName: rawProjectName,
        author,
        siteUrl,
      }),
    },
  ]
}
