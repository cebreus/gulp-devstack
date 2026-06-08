import sharp from 'sharp'

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47]
const JPG_SIGNATURE = [0xff, 0xd8, 0xff]
const WEBP_SIGNATURE = {
  riff: [0x52, 0x49, 0x46, 0x46],
  webp: [0x57, 0x45, 0x42, 0x50],
}

function matchesSignature(buffer, startIndex, signature) {
  return signature.every((byte, index) => buffer[startIndex + index] === byte)
}

function isPngBuffer(buffer) {
  return buffer.length >= 4 && matchesSignature(buffer, 0, PNG_SIGNATURE)
}

function isJpgBuffer(buffer) {
  return buffer.length >= 3 && matchesSignature(buffer, 0, JPG_SIGNATURE)
}

function isWebpBuffer(buffer) {
  return (
    buffer.length >= 12 &&
    matchesSignature(buffer, 0, WEBP_SIGNATURE.riff) &&
    matchesSignature(buffer, 8, WEBP_SIGNATURE.webp)
  )
}

function isSvgBuffer(buffer) {
  const start = buffer.slice(0, 100).toString()
  return start.includes('<svg') || start.includes('<?xml')
}

/**
 * Detects image type from buffer magic bytes.
 * @param {Buffer} buffer - The image file buffer
 * @returns {string|null} The detected type ('png', 'jpg', 'webp', 'svg') or null
 */
export function detectType(buffer) {
  if (!buffer || buffer.length < 3) {
    return null
  }

  if (isPngBuffer(buffer)) {
    return 'png'
  }

  if (isJpgBuffer(buffer)) {
    return 'jpg'
  }

  if (isWebpBuffer(buffer)) {
    return 'webp'
  }

  if (isSvgBuffer(buffer)) {
    return 'svg'
  }

  return null
}

/**
 * Generates a Low Quality Image Placeholder (Base64).
 * ~20px WebP, blurred, ultra-low quality.
 * @param {Buffer} buffer - Source image buffer
 * @returns {Promise<string>} Data URI string
 */
export async function getLqsPlaceholder(buffer) {
  const lqsBuffer = await sharp(buffer)
    .resize(20)
    .blur(1)
    .webp({ quality: 10 })
    .toBuffer()
  return `data:image/webp;base64,${lqsBuffer.toString('base64')}`
}

/**
 * Sharp-based optimization logic including AVIF.
 * @param {Buffer} buffer - The source image buffer
 * @param {'jpg'|'png'|'webp'|'avif'} targetType - Target format
 * @param {number} quality - Target quality (0-100)
 * @returns {Promise<Buffer>} The optimized image buffer
 */
export async function optimizeWithSharp(buffer, targetType, quality) {
  const instance = sharp(buffer).rotate()

  switch (targetType) {
    case 'jpg':
      return instance
        .jpeg({ quality, mozjpeg: true, progressive: true })
        .toBuffer()
    case 'webp':
      return instance.webp({ quality }).toBuffer()
    case 'avif':
      return instance
        .avif({ quality: Math.max(quality - 20, 40), speed: 5 })
        .toBuffer()
    case 'png':
      return instance.png({ compressionLevel: 9, effort: 10 }).toBuffer()
    default:
      return buffer
  }
}
