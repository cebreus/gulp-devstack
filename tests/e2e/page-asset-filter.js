export function isCriticalPageAsset(url) {
  if (typeof url !== 'string' || url.length === 0) {
    return false
  }

  return /\.(css|js)(?:[?#]|$)/u.test(url)
}
