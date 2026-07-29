function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function renderBuildErrorPage(error) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Build failed</title>
  <style>
    :root { color-scheme: dark; font-family: ui-monospace, monospace; }
    body { margin: 0; background: #160f12; color: #fff5f7; }
    main { box-sizing: border-box; display: grid; min-height: 100vh; padding: 2rem; place-content: center; }
    section { max-width: 48rem; border-left: 0.25rem solid #ff4d6d; padding: 1rem 2rem; }
    h1 { margin: 0 0 1rem; font-family: system-ui, sans-serif; font-size: 2rem; }
    p { color: #e7c8cf; line-height: 1.5; }
    pre { overflow: auto; margin: 2rem 0 0; padding: 1rem; background: #24171c; color: #ffd6de; white-space: pre-wrap; }
  </style>
</head>
<body>
  <main>
    <section aria-labelledby="build-error-title">
      <h1 id="build-error-title">Build failed</h1>
      <p>Fix the error below. This page will reload when the build works.</p>
      <pre><code>${escapeHtml(error.message)}</code></pre>
    </section>
  </main>
  <!-- ponytail: polling keeps recovery server-agnostic; add a status endpoint only if dev traffic matters. -->
  <script>
    setTimeout(async function checkBuild() {
      try {
        var response = await fetch(window.location.href, {
          cache: 'no-store',
          headers: { Accept: 'text/html' }
        })
        if (response.status !== 503) {
          window.location.reload()
          return
        }
      } catch {}
      setTimeout(checkBuild, 1000)
    }, 1000)
  </script>
</body>
</html>`
}

function isDocumentRequest(request) {
  return (
    request.method === 'GET' &&
    String(request.headers.accept || '').includes('text/html')
  )
}

/**
 * Serves a standalone error document while a development build is invalid.
 * @param {import('node:http').IncomingMessage} request - HTTP request.
 * @param {import('node:http').ServerResponse} response - HTTP response.
 * @param {Error | undefined} error - Current development build error.
 * @returns {boolean} Whether the request was handled.
 */
export default function serveBuildError(request, response, error) {
  if (!error || !isDocumentRequest(request)) {
    return false
  }

  response.writeHead(503, {
    'Cache-Control': 'no-store',
    'Content-Type': 'text/html; charset=utf-8',
    'Retry-After': '1',
  })
  response.end(renderBuildErrorPage(error))
  return true
}
