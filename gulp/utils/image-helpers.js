import sharp from 'sharp'

/**
 * Detects image type from buffer magic bytes.
 * @param {Buffer} buffer - The image file buffer
 * @returns {string|null} The detected type ('png', 'jpg', 'webp', 'svg') or null
 */
export function detectType(buffer) {
  if (!buffer || buffer.length < 3) return null
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  )
    return 'png'
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff)
    return 'jpg'
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  )
    return 'webp'
  const start = buffer.slice(0, 100).toString()
  if (start.includes('<svg') || start.includes('<?xml')) return 'svg'
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
      return instance.png({ compressionLevel: 9, palette: true }).toBuffer()
    default:
      return buffer
  }
}
