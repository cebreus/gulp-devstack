import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import pc from 'picocolors'

import { ensureDirectoryExists, isPrivateFile } from './index.js'
import sassDependencyCache from './sass-dependency-cache.js'

function buildPostcssPlugins(autoprefixer, cssnano, postcssPlugins, minify) {
  const finalPostcssPlugins = [autoprefixer(), ...postcssPlugins]
  if (minify) {
    finalPostcssPlugins.push(cssnano())
  }
  return finalPostcssPlugins
}

function createMinifiedCssPath(cssPath) {
  if (cssPath.includes('.min.css')) {
    return cssPath
  }

  return cssPath.replace(/\.css$/u, '.min.css')
}

function resolveOutputCssPath({
  sourceFile,
  dest,
  base,
  outputFilename,
  minify,
}) {
  const rawCssPath = outputFilename
    ? path.join(dest, outputFilename)
    : path
        .join(dest, path.relative(base || path.dirname(sourceFile), sourceFile))
        .replace(/\.scss$/u, '.css')

  return minify ? createMinifiedCssPath(rawCssPath) : rawCssPath
}

function shouldSkipSourceFile(sourceFile) {
  return isPrivateFile(sourceFile) || path.basename(sourceFile).startsWith('_')
}

function normalizeSassOptions(sassCompilerOptions, sourceMaps, cssPath) {
  const { includePaths, outputStyle, ...rest } = sassCompilerOptions

  return {
    ...rest,
    loadPaths: includePaths,
    style: outputStyle,
    sourceMap: sourceMaps,
    sourceMapIncludeSources: sourceMaps,
    url: pathToFileURL(cssPath),
  }
}

function buildSourceMapComment(mapPath) {
  return `/*# sourceMappingURL=${path.basename(mapPath)} */`
}

function buildCacheFingerprint(options) {
  const { sourceMaps, minify, sassCompilerOptions, postcssPlugins, cacheKey } =
    options
  return JSON.stringify({
    sourceMaps,
    minify,
    sassCompilerOptions,
    postcssPlugins: postcssPlugins.map((plugin) => plugin.postcssPlugin || ''),
    cacheKey,
  })
}

async function writeCompiledCssArtifact({
  cssPath,
  cssContent,
  sourceMap,
  sourceMaps,
}) {
  const mapPath = `${cssPath}.map`
  const finalCss = sourceMaps
    ? `${cssContent}\n${buildSourceMapComment(mapPath)}\n`
    : cssContent

  await ensureDirectoryExists(path.dirname(cssPath))
  await fs.writeFile(cssPath, finalCss)

  if (sourceMaps && sourceMap) {
    await fs.writeFile(mapPath, JSON.stringify(sourceMap, null, 2))
  }
}

async function renderCssOutput(options) {
  const {
    sourceFile,
    cssPath,
    postcssPlugins,
    sourceMaps,
    minify,
    sassCompilerOptions,
    autoprefixer,
    cssnano,
    postcss,
    sass,
  } = options
  const fingerprint = buildCacheFingerprint(options)
  const sassResult = await sass.compileAsync(
    sourceFile,
    normalizeSassOptions(sassCompilerOptions, sourceMaps, cssPath)
  )
  const processor = postcss(
    buildPostcssPlugins(autoprefixer, cssnano, postcssPlugins, minify)
  )
  const postcssResult = await processor.process(sassResult.css, {
    from: sourceFile,
    to: cssPath,
    map: sourceMaps
      ? {
          prev: sassResult.sourceMap,
          inline: false,
          annotation: false,
          sourcesContent: true,
        }
      : false,
  })

  await writeCompiledCssArtifact({
    cssPath,
    cssContent: postcssResult.css,
    sourceMap: postcssResult.map ? postcssResult.map.toJSON() : null,
    sourceMaps,
  })
  await sassDependencyCache.writeDependencyManifest(
    cssPath,
    sassResult,
    fingerprint
  )
}

async function verifyCssIntegrity(cssPath, skipIntegrity) {
  if (skipIntegrity) {
    return
  }

  const buffer = await fs.readFile(cssPath)
  if (buffer.length === 0) {
    throw new Error(
      `[Sass] Integrity check failed: ${path.basename(cssPath)} is empty (${buffer.length} bytes).`
    )
  }
}

async function compileSourceFile(options) {
  const {
    sourceFile,
    dest,
    base,
    outputFilename,
    postcssPlugins,
    sourceMaps,
    minify,
    skipNewer,
    skipIntegrity,
    sassCompilerOptions,
    logger,
    markCompilationError,
    autoprefixer,
    cssnano,
    postcss,
    sass,
  } = options

  if (shouldSkipSourceFile(sourceFile)) {
    return null
  }

  const cssPath = resolveOutputCssPath({
    sourceFile,
    dest,
    base,
    outputFilename,
    minify,
  })
  const mapPath = `${cssPath}.map`
  const fingerprint = buildCacheFingerprint(options)

  if (
    skipNewer &&
    (await sassDependencyCache.shouldSkipUnchangedFile({
      cssPath,
      mapPath,
      sourceMaps,
      fingerprint,
    }))
  ) {
    return null
  }

  try {
    await renderCssOutput({
      sourceFile,
      cssPath,
      postcssPlugins,
      sourceMaps,
      minify,
      cacheKey: options.cacheKey,
      sassCompilerOptions,
      autoprefixer,
      cssnano,
      postcss,
      sass,
    })
    await verifyCssIntegrity(cssPath, skipIntegrity)

    logger.info(
      `Saved: ${pc.yellow(path.basename(cssPath))} to ${pc.dim(dest)}`
    )
    return cssPath
  } catch (error) {
    logger.error(
      `Sass compilation failed in ${sourceFile}. Cause: ${error.message}`
    )
    markCompilationError()
    return null
  }
}

async function createSassPipeline(options) {
  const sourceFiles = Array.isArray(options.src) ? options.src : [options.src]
  if (options.outputFilename && sourceFiles.length > 1) {
    throw new Error(
      'outputFilename cannot be used with multiple Sass source files'
    )
  }

  const writtenFiles = await Promise.all(
    sourceFiles.map(function compileCurrentSourceFile(sourceFile) {
      return compileSourceFile({
        ...options,
        sourceFile,
      })
    })
  )

  return writtenFiles.filter(Boolean)
}

const sassPipelineApi = {
  createSassPipeline,
}

export default sassPipelineApi
