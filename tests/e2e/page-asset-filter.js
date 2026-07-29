export function isCriticalPageAsset(url) {
  if (typeof url !== 'string' || url.length === 0) {
    return false
  }

  try {
    return /\.(?:css|js)$/u.test(new URL(url, 'http://localhost').pathname)
  } catch {
    return false
  }
}
