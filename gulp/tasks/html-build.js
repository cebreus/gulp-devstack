import gulp from 'gulp'

import { getRelativePath } from '../utils/helpers.js'
import logger from '../utils/logger.js'
import data from 'gulp-data'
import inject from 'gulp-inject'
import jsbeautifier from 'gulp-jsbeautifier'
import nunjucksRender from 'gulp-nunjucks-render'
import plumber from 'gulp-plumber'
import replace from 'gulp-replace'
import MarkdownIt from 'markdown-it'
import fs from 'node:fs'
import path from 'node:path'
import nunjucksDateFilter from 'nunjucks-date-filter-locale'
import pc from 'picocolors'
import through2 from 'through2'

const dateFilter = nunjucksDateFilter
const markdownParser = new MarkdownIt({
  html: true,
  breaks: false,
  linkify: true,
})

/**
 * Build HTML pages from JSON data and Nunjucks templates.
 * @param {object} params - The build parameters.
 * @returns {any} - The Gulp stream.
 */
export default function htmlBuild(params) {
  // Load the menu data if it exists
  let menuData = { menu: [] }
  if (params.dataSource) {
    const menuFile = path.join(params.dataSource, 'menu.json')
    try {
      if (fs.existsSync(menuFile)) {
        const menuContent = fs.readFileSync(menuFile, 'utf8')
        menuData = JSON.parse(menuContent)
        logger.debug(
          `Loaded menu data: ${pc.dim(JSON.stringify(menuData).slice(0, 100))}`
        )
      }
    } catch (error) {
      logger.debug('No menu data found or error loading menu:', error.message)
    }
  }

  const siteWithMenu = { ...params.siteDefaults, ...menuData }
  dateFilter.setLocale(siteWithMenu.meta?.lang || undefined)

  const nunjucksOptions = {
    path: params.processPaths,
    envOptions: {
      autoescape: false,
      trimBlocks: true,
      lstripBlocks: true,
    },
  }
  const htmlBeautifyOptions = {
    indent_size: 2,
    indent_char: ' ',
    max_preserve_newlines: 1,
    preserve_newlines: true,
    indent_inner_html: false,
    end_with_newline: true,
  }

  logger.debug('Starting HTML build with JSON input files')
  logger.debug(
    `Input files: \n${params.input.map((f) => `            - ${pc.yellow(getRelativePath(f))}`).join('\n')}`
  )

  const getOutputPath = (inputPath, extFrom, extTo, baseDir, outDir) => {
    const rel = path.relative(baseDir, inputPath)
    return path.resolve(outDir, rel.replace(extFrom, extTo))
  }
  const getJsonData = (jsonPath) => {
    try {
      if (fs.existsSync(jsonPath)) {
        return JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
      }
    } catch (e) {
      logger.debug(`Error loading JSON data: ${e.message}`)
    }
    return {}
  }

  let stream = gulp
    .src(params.input)
    .pipe(plumber())
    .pipe(
      through2.obj(function (file, enc, cb) {
        const basename = path.basename(file.path)
        if (basename === 'menu.json' || basename.startsWith('layout-')) {
          logger.debug(
            `Skipping file ${getRelativePath(file.path)} - excluded from HTML generation`
          )
          return cb()
        }
        const ext = path.extname(file.path)
        let pageData = {}
        if (!file.contents) {
          logger.error(`File has no contents: ${file.path}`)
          return cb()
        }
        if (ext === '.json') {
          pageData = JSON.parse(file.contents.toString('utf8'))
          file.path = getOutputPath(
            file.path,
            '.json',
            '.html',
            params.dataSource,
            params.output
          )
          file.base = path.resolve(params.output)
          file.contents = Buffer.from(
            '{% extends "layout-default.njk" %}{% block content %}{{ content | md | safe }}{% endblock %}'
          )
          file.isFromJson = true
        } else if (ext === '.njk') {
          const routesBase =
            params.routesBase || params.processPaths?.[1] || './src/routes'
          file.path = getOutputPath(
            file.path,
            '.njk',
            '.html',
            routesBase,
            params.output
          )
          file.base = path.resolve(params.output)
          const rel = path
            .relative(routesBase, file.path)
            .replace('.html', '.json')
          if (params.dataSource && routesBase) {
            const jsonPath = path.join(params.dataSource, rel)
            pageData = getJsonData(jsonPath)
          }
          file.isFromJson = false
        } else {
          return cb()
        }
        file.data = pageData
        cb(null, file)
      })
    )
    .pipe(
      data((file) => ({
        page: file.data
          ? typeof structuredClone === 'function'
            ? structuredClone(file.data)
            : JSON.parse(JSON.stringify(file.data))
          : {},
        site: siteWithMenu,
      }))
    )
    .pipe(
      nunjucksRender({
        ...nunjucksOptions,
        manageEnv: (env) => {
          env.addFilter('md', (str) => (!str ? '' : markdownParser.render(str)))
        },
      })
    )

  // Inject the CSS files into the HTML.
  if (params.injectCss && params.injectCss.length > 0) {
    logger.debug('CSS files for injection:')
    params.injectCss.forEach((file) =>
      logger.debug(` - ${getRelativePath(file)}`)
    )
    const cssGlob = params.injectCss.map((file) => {
      const glob = file
      logger.debug(`CSS Pattern: ${getRelativePath(glob)}`)
      return glob
    })
    logger.debug(
      `Found CSS files for injection: \n${cssGlob.map((f) => `            - ${pc.yellow(getRelativePath(f))}`).join('\n')}`
    )
    stream = stream.pipe(
      inject(gulp.src(cssGlob, { read: false }), {
        starttag: '<!-- inject:css -->',
        endtag: '<!-- endinject -->',
        transform: params.transformCss,
        ignorePath: params.injectIgnorePath,
        relative: params.relative,
      })
    )
  }

  // Inject the JavaScript files into the HTML.
  if (params.injectJs && params.injectJs.length > 0) {
    logger.debug('JS files for injection:')
    params.injectJs.forEach((file) =>
      logger.debug(` - ${getRelativePath(file)}`)
    )
    const jsGlob = params.injectJs.map((file) => {
      const glob = file
      logger.debug(`JS Pattern: ${getRelativePath(glob)}`)
      return glob
    })
    logger.debug(
      `Found JS files: \n${jsGlob.map((f) => `            - ${pc.yellow(getRelativePath(f))}`).join('\n')}`
    )

    // Debug: Show transformed script tags for each JS file
    jsGlob.forEach((filepath) => {
      const tag = params.transformJs
        ? params.transformJs(filepath)
        : `<script src=\"${filepath}\"></script>`
      logger.debug(`Would inject JS: ${tag}`)
    })

    stream = stream.pipe(
      inject(gulp.src(jsGlob, { read: false }), {
        starttag: '<!-- inject:js -->',
        endtag: '<!-- endinject -->',
        transform: params.transformJs,
        ignorePath: params.injectIgnorePath,
        relative: params.relative,
      })
    )
  }

  // Inject the CDN JavaScript files into the HTML.
  if (params.injectCdnJs && params.injectCdnJs.length > 0) {
    stream = stream.pipe(
      inject(gulp.src(params.injectCdnJs), {
        starttag: '<!-- inject:cdn:js -->',
        endtag: '<!-- endinject -->',
        transform: (filepath) => `<script src=\"${filepath}\"></script>`,
      })
    )
  }

  // Remove HTML comments outside <script> and <style> tags (conservative, not perfect, but safer).
  // This regex will not remove comments inside <script> or <style> tags.
  stream = stream.pipe(
    // Remove HTML comments that are not inside <script> or <style> tags.
    // This regex attempts to match and remove HTML comments (<!-- ... -->) except for those that:
    //   - are conditional comments (e.g., <!--[if ...]-->),
    //   - are inside <script> or <style> tags (to avoid breaking inline scripts/styles).
    // Limitations: This approach is not perfect and may fail for edge cases such as nested comments or comments inside malformed HTML.
    // For complex scenarios, consider using an HTML parser instead of regex.
    replace(
      /<!--(?!\s*\[if|\s*<!|\s*\])(?![\s\S]*?(?:<script|<style)[\s\S]*?<!--)[\s\S]*?-->/g,
      ''
    )
  )

  // Beautify the HTML and write it to the output directory.
  stream = stream
    .pipe(jsbeautifier(htmlBeautifyOptions))
    .pipe(gulp.dest(params.output))
    .on('end', async () => {
      logger.debug(`HTML generated to: ${getRelativePath(params.output)}`)
      const outputFiles = []
      const walkDir = async (dir) => {
        const entries = await fs.promises.readdir(dir, { withFileTypes: true })
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name)
          if (entry.isDirectory()) {
            await walkDir(fullPath)
          } else if (entry.isFile() && fullPath.endsWith('.html')) {
            outputFiles.push(getRelativePath(fullPath))
          }
        }
      }
      await walkDir(params.output)
      logger.verbose(
        `Generated HTML files:\n${outputFiles.map((f) => `            - ${pc.yellow(f)}`).join('\n')}`
      )
    })

  return stream
}
