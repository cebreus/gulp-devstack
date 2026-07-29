import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

function getDependencyManifestPath(cssPath) {
  return `${cssPath}.deps.json`
}

async function readDependencyManifest(dependencyManifestPath) {
  try {
    const manifest = JSON.parse(
      await fs.readFile(dependencyManifestPath, 'utf8')
    )
    if (
      Array.isArray(manifest.dependencies) &&
      typeof manifest.fingerprint === 'string'
    ) {
      return manifest
    }
  } catch {}

  return null
}

async function getNewestDependencyMtime(dependencyPaths) {
  const stats = await Promise.all(
    dependencyPaths.map(async function statDependency(dependencyPath) {
      return fs.stat(dependencyPath)
    })
  )

  return Math.max(...stats.map((stat) => stat.mtimeMs))
}

async function shouldSkipUnchangedFile({
  cssPath,
  mapPath,
  sourceMaps,
  fingerprint,
}) {
  try {
    const cssStats = await fs.stat(cssPath)
    const manifest = await readDependencyManifest(
      getDependencyManifestPath(cssPath)
    )
    if (!manifest || manifest.fingerprint !== fingerprint) {
      return false
    }
    const newestDependencyMtime = await getNewestDependencyMtime(
      manifest.dependencies
    )

    if (sourceMaps) {
      await fs.access(mapPath)
    }

    return cssStats.mtimeMs >= newestDependencyMtime
  } catch {
    return false
  }
}

async function writeDependencyManifest(cssPath, sassResult, fingerprint) {
  const dependencies = sassResult.loadedUrls
    .filter((url) => url.protocol === 'file:')
    .map((url) => fileURLToPath(url))

  await fs.writeFile(
    getDependencyManifestPath(cssPath),
    JSON.stringify({ dependencies, fingerprint }, null, 2)
  )
}

const sassDependencyCacheApi = {
  shouldSkipUnchangedFile,
  writeDependencyManifest,
}

export default sassDependencyCacheApi
