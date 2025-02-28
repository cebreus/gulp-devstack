/**
 * Get metadata value with fallback chain:
 * 1. Page specific value
 * 2. Site default value
 * 3. Provided fallback value
 *
 * @param {Object} page - Current page data
 * @param {Object} site - Site-wide data
 * @param {string} key - Key to look for (e.g., 'title', 'description')
 * @param {string} section - Optional section like 'seo', 'open_graph'
 * @param {*} fallback - Optional fallback value if nothing found
 * @returns {*} The resolved value
 */
export function getMetaValue(page, site, key, section = null, fallback = '') {
  // Handle nested objects (section)
  if (section) {
    // Try page section->key
    if (page && page[section] && page[section][key] !== undefined) {
      return page[section][key];
    }

    // Try site section->key
    if (site && site[section] && site[section][key] !== undefined) {
      return site[section][key];
    }
  } else {
    // Try direct page key
    if (page && page[key] !== undefined) {
      return page[key];
    }

    // Try direct site key
    if (site && site[key] !== undefined) {
      return site[key];
    }
  }

  // Return fallback value if nothing found
  return fallback;
}

/**
 * Get page title with proper fallback logic
 * @param {Object} page - Page data
 * @param {Object} site - Site data
 * @returns {string} The title
 */
export function getPageTitle(page, site) {
  // Try specific SEO title
  const seoTitle = getMetaValue(page, null, 'title', 'seo');
  if (seoTitle) return seoTitle;

  // Try page title
  const pageTitle = getMetaValue(page, null, 'title');
  if (pageTitle) return pageTitle;

  // Try site title as fallback
  return getMetaValue(null, site, 'title');
}

/**
 * Generate canonical URL based on file path and output type
 * @param {Object} options - Options for URL generation
 * @param {string} options.fileName - File name without extension
 * @param {string} options.routePath - Directory path relative to routes
 * @param {string} options.baseUrl - Site base URL
 * @param {boolean} options.isSpecialPage - Whether this is a special page (like 404.html)
 * @returns {string} Canonical URL
 */
export function generateCanonicalUrl({
  fileName,
  routePath,
  baseUrl,
  isSpecialPage = false
}) {
  // Get clean base URL without trailing slash
  const cleanBaseUrl = (baseUrl || '').replace(/\/$/, '');

  console.log('CANONICAL URL GENERATION:', {
    fileName,
    routePath,
    isSpecialPage
  });

  // Special pages (like 404.html) get direct file paths
  if (isSpecialPage) {
    const url = `${cleanBaseUrl}/${fileName}.html`;
    console.log('Generated special page URL:', url);
    return url;
  }

  // For index files in subdirectories, use the directory path
  if (fileName === 'index') {
    // For root index.html (home page)
    if (!routePath || routePath === '.' || routePath === './') {
      const url = `${cleanBaseUrl}/`;
      console.log('Generated home page URL:', url);
      return url;
    }

    // For subdirectory index.html (like about/index.html)
    const url = `${cleanBaseUrl}/${routePath}/`;
    console.log('Generated directory page URL:', url);
    return url;
  }

  // For non-index files in subdirectories
  if (routePath && routePath !== '.' && routePath !== './') {
    const url = `${cleanBaseUrl}/${routePath}/${fileName}`;
    console.log('Generated nested page URL:', url);
    return url;
  }

  // For other files in root
  const url = `${cleanBaseUrl}/${fileName}`;
  console.log('Generated root-level page URL:', url);
  return url;
}

/**
 * Get full meta data object for a page with enhanced SEO handling
 * @param {Object} options - Metadata generation options
 * @param {Object} options.page - Page data
 * @param {Object} options.site - Site data
 * @param {string} options.fileName - Name of the file
 * @param {string} options.routePath - Path to the file within routes directory
 * @param {boolean} options.isSpecialPage - Whether this is a special page
 * @returns {Object} Complete metadata object
 */
export function getPageMetadata({
  page = {},
  site = {},
  fileName = '',
  routePath = '',
  isSpecialPage = false
}) {
  // Generate canonical URL with all needed params
  const canonicalUrl = generateCanonicalUrl({
    fileName,
    routePath,
    baseUrl: site.baseUrl,
    isSpecialPage
  });

  const metadata = {
    title: getPageTitle(page, site),
    description: getMetaValue(page, site, 'description', 'seo'),

    // Canonical URL is critical for SEO
    canonical: getMetaValue(page, site, 'canonical', 'seo', canonicalUrl),

    // Enhanced SEO metadata
    seo: {
      title: getMetaValue(page, site, 'title', 'seo', getPageTitle(page,
        site)),
      description: getMetaValue(page, site, 'description', 'seo', site
        .description || ''),
      robots: getMetaValue(page, site, 'robots', 'seo', 'index,follow'),
      canonical: getMetaValue(page, site, 'canonical', 'seo', canonicalUrl),
      author: getMetaValue(page, site, 'author', 'seo', site.author || ''),
      keywords: getMetaValue(page, site, 'keywords', 'seo', ''),
      includeSitemap: getMetaValue(page, site, 'include_to_sitemap', 'seo',
        true)
    },

    // Open Graph
    og: {
      use: getMetaValue(page, site, 'use', 'open_graph', false),
      type: getMetaValue(page, site, 'type', 'open_graph', 'website'),
      title: getMetaValue(page, site, 'title', 'open_graph', getPageTitle(
        page, site)),
      description: getMetaValue(page, site, 'description', 'open_graph',
        getMetaValue(page, site, 'description', 'seo')),
      image: getMetaValue(page, site, 'image', 'open_graph', []),
      app_id: getMetaValue(page, site, 'app_id', 'open_graph', ''),
      site_name: getMetaValue(page, site, 'site_name', 'open_graph', site
        .title || '')
    },

    // Twitter Cards
    twitter: {
      use: getMetaValue(page, site, 'use', 'twitter_cards', false),
      type: getMetaValue(page, site, 'type', 'twitter_cards', 'summary'),
      title: getMetaValue(page, site, 'title', 'twitter_cards', getPageTitle(
        page, site)),
      description: getMetaValue(page, site, 'description', 'twitter_cards',
        getMetaValue(page, site, 'description', 'seo')),
      site: getMetaValue(page, site, 'site', 'twitter_cards', ''),
      creator: getMetaValue(page, site, 'creator', 'twitter_cards', ''),
      image: getMetaValue(page, site, 'image', 'twitter_cards', [])
    }
  };

  return metadata;
}

/**
 * Logs metadata diagnostics to help with debugging
 * @param {Object} page - Page data
 * @param {Object} site - Site data
 * @param {Object} meta - Generated metadata
 */
export function logMetadataInfo(page, site, meta) {
  console.log('--- Metadata Generation Report ---');
  console.log('Page SEO data:', page && page.seo ? page.seo : 'None');
  console.log('Site SEO defaults:', site && site.seo ? site.seo : 'None');
  console.log('Generated metadata:', meta);
  console.log('--------------------------------');
}
