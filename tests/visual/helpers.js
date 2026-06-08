import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createServer } from 'node:http'
import path from 'node:path'
import sharp from 'sharp'

const DEFAULT_HTML_EXTENSIONS = ['.html']
const CONTENT_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}
const PIXEL_CHANNELS = 4
const PIXEL_DIFF_THRESHOLD = 16

function normalizeRequestPath(pathname) {
  if (!pathname || pathname === '/') {
    return '/index.html'
  }

  if (pathname.endsWith('/')) {
    return `${pathname}index.html`
  }

  return pathname
}

function resolveStaticFile(rootDir, requestPath) {
  const normalizedPath = normalizeRequestPath(requestPath)
  const decodedPath = decodeURIComponent(normalizedPath)
  const unsafePath = path.join(rootDir, decodedPath)
  const resolvedPath = path.resolve(unsafePath)
  const resolvedRoot = path.resolve(rootDir)

  if (!resolvedPath.startsWith(resolvedRoot)) {
    return null
  }

  if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isFile()) {
    return resolvedPath
  }

  const parsedPath = path.parse(resolvedPath)
  if (parsedPath.ext) {
    return null
  }

  for (const extension of DEFAULT_HTML_EXTENSIONS) {
    const extensionCandidate = `${resolvedPath}${extension}`
    if (
      fs.existsSync(extensionCandidate) &&
      fs.statSync(extensionCandidate).isFile()
    ) {
      return extensionCandidate
    }
  }

  return null
}

function getContentType(filePath) {
  const extension = path.extname(filePath).toLowerCase()
  return CONTENT_TYPES[extension] || 'application/octet-stream'
}

export async function startStaticServer(rootDir) {
  const server = createServer(async (req, res) => {
    try {
      const origin = `http://${req.headers.host || '127.0.0.1'}`
      const url = new URL(req.url || '/', origin)
      const filePath = resolveStaticFile(rootDir, url.pathname)

      if (!filePath) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
        res.end('Not found')
        return
      }

      const content = await fs.promises.readFile(filePath)
      res.writeHead(200, { 'Content-Type': getContentType(filePath) })
      res.end(content)
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end(`Server error: ${error.message}`)
    }
  })

  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })

  const address = server.address()
  assert.ok(address && typeof address === 'object', 'Server did not bind')

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: async () => {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            return reject(error)
          }
          resolve()
        })
      })
    },
  }
}

async function readRawImage(imageBuffer) {
  const { data, info } = await sharp(imageBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  return { data, width: info.width, height: info.height }
}

function getChannelDifference(channelA, channelB) {
  return Math.abs(channelA - channelB)
}

function compareRawPixels(leftData, rightData) {
  let diffPixels = 0
  const totalPixels = leftData.length / PIXEL_CHANNELS

  for (let index = 0; index < leftData.length; index += PIXEL_CHANNELS) {
    const redDiff = getChannelDifference(leftData[index], rightData[index])
    const greenDiff = getChannelDifference(
      leftData[index + 1],
      rightData[index + 1]
    )
    const blueDiff = getChannelDifference(
      leftData[index + 2],
      rightData[index + 2]
    )
    const alphaDiff = getChannelDifference(
      leftData[index + 3],
      rightData[index + 3]
    )

    if (
      redDiff > PIXEL_DIFF_THRESHOLD ||
      greenDiff > PIXEL_DIFF_THRESHOLD ||
      blueDiff > PIXEL_DIFF_THRESHOLD ||
      alphaDiff > PIXEL_DIFF_THRESHOLD
    ) {
      diffPixels += 1
    }
  }

  return {
    diffPixels,
    totalPixels,
    diffRatio: totalPixels === 0 ? 0 : diffPixels / totalPixels,
  }
}

export async function compareScreenshots(leftImage, rightImage) {
  const [left, right] = await Promise.all([
    readRawImage(leftImage),
    readRawImage(rightImage),
  ])

  assert.strictEqual(left.width, right.width, 'Screenshot widths differ')
  assert.strictEqual(left.height, right.height, 'Screenshot heights differ')

  return compareRawPixels(left.data, right.data)
}
