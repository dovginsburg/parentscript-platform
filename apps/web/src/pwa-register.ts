// ============================================================
// pwa-register.ts — manual service-worker registration
// ============================================================
//
// Why this exists: vite-plugin-pwa's auto-generated registerSW.js
// uses `navigator.serviceWorker.register('/app/sw.js')` with no
// cache-busting and no focus-based update check. That means:
//
//   1. If Vercel's CDN edge serves a cached sw.js (it does, even
//      with max-age=0 in some regions), the browser sees the same
//      bytes and never prompts an update.
//   2. The user stays on the old app shell even though a new
//      build is deployed.
//
// Fix:
//   - Append a build-time `?v=<hash>` query string so each build
//     gets a fresh URL — the SW spec allows query strings on the
//     script URL without invalidating the SW scope.
//   - On `controllerchange`, force-reload so the new SW takes
//     over the page (skipWaiting + clientsClaim are set in sw.js).
//   - On visibilitychange/focus, call `update()` so background
//     tabs that get a new build pick it up the next time the user
//     looks at them.
//
// Reference: https://web.dev/articles/service-worker-lifecycle
// ============================================================

// Build-time stamp injected by Vite. Every `npm run build` produces a
// fresh value, so the SW URL is unique per build and can never be
// served from a stale edge cache.
const BUILD_VERSION = '__BUILD_VERSION__'
// Capacitor WebView serves from capacitor://localhost/ with no prefix,
// so the SW URL/scope must be root-relative. The cache-busting ?v= query
// still defeats Vercel's CDN edge cache on the web build.
const SW_URL = `/sw.js?v=${BUILD_VERSION}`
const SW_SCOPE = '/'

export function registerSW(): void {
  if (typeof window === 'undefined') return
  if (!('serviceWorker' in navigator)) return

  // Defer registration until after first paint so the SW install
  // doesn't compete with the main JS bundle for bandwidth.
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(SW_URL, { scope: SW_SCOPE, updateViaCache: 'none' })
      .then((reg) => {
        // Check for updates every time the page becomes visible.
        // Cheap (HEAD-equivalent against sw.js) and catches builds
        // that shipped while the tab was in the background.
        const checkForUpdate = () => reg.update().catch(() => {})
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') checkForUpdate()
        })
        window.addEventListener('focus', checkForUpdate)
      })
      .catch((err) => {
        // Don't crash the app on SW registration failure (e.g. Safari
        // private mode). Log so it shows up in Vercel runtime logs.
        console.warn('[pwa] service worker registration failed:', err)
      })

    // When the new SW takes over, reload the page so the user sees
    // the fresh app shell. The old SW's cache is already replaced
    // by the new one at this point (skipWaiting ran before claiming).
    let reloading = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloading) return
      reloading = true
      window.location.reload()
    })
  })
}