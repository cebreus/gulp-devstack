export function formatBrokenLinksReport(brokenLinks) {
  if (brokenLinks.length === 0) {
    return 'Found 0 broken links/anchors.'
  }

  const details = brokenLinks
    .map((link) => {
      return `- ${link.url} (Status: ${link.status}) found on ${link.parent}`
    })
    .join('\n')

  return `Found ${brokenLinks.length} broken links/anchors.\n${details}`
}
