import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import crypto from 'crypto'

// Build-time SW version. Inlined into src/pwa-register.ts so the
// registration URL `/app/sw.js?v=<hash>` is unique per build and
// can't be served from a stale Vercel edge cache. The hash mixes
// a timestamp with a random nonce so two builds in the same second
// still get distinct versions.
const SW_BUILD_VERSION = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`

export default defineConfig({
  // Vercel-hosted build needs `/app/` (set VITE_BASE=/app/ in Vercel env).
  // iOS WebView serves from capacitor://localhost/ with no prefix, so
  // defaulting to './' (relative) makes the same `dist/` work for Capacitor.
  base: process.env.VITE_BASE || './',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    // Replaces the `__BUILD_VERSION__` placeholder in pwa-register.ts.
    // Vite's `define` does literal string substitution; quoting twice
    // produces a valid JS string literal in the output bundle.
    __BUILD_VERSION__: JSON.stringify(SW_BUILD_VERSION),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'generateSW',
      filename: 'sw.js',
      // We register the SW manually from src/main.tsx with a cache-busting
      // query string and an explicit update check on focus, so the browser
      // never serves a stale SW from the Vercel CDN edge. See
      // src/pwa-register.ts for the registration logic.
      injectRegister: false,
      includeAssets: ['favicon.svg', 'icons/*.png', 'icons/*.svg'],
      manifest: {
        name: 'ParentScript',
        short_name: 'ParentScript',
        description: 'Therapist-guided parenting skills. Say the right thing at the right time.',
        theme_color: '#6366f1',
        background_color: '#09090b',
        display: 'standalone',
        // Capacitor WebView serves dist/ from capacitor://localhost/ with no
        // path prefix. The manifest's start_url and scope must match that
        // origin or the installed PWA boots into /app/ which 404s.
        // Vercel still works: its rewrites in vercel.json send /app/* → /index.html.
        scope: '/',
        start_url: '/',
        orientation: 'any',
        categories: ['health', 'lifestyle'],
        icons: [
          {
            src: '/icons/icon-76.png',
            sizes: '76x76',
            type: 'image/png',
          },
          {
            src: '/icons/icon-120.png',
            sizes: '120x120',
            type: 'image/png',
          },
          {
            src: '/icons/icon-152.png',
            sizes: '152x152',
            type: 'image/png',
          },
          {
            src: '/icons/icon-167.png',
            sizes: '167x167',
            type: 'image/png',
          },
          {
            src: '/icons/icon-180.png',
            sizes: '180x180',
            type: 'image/png',
          },
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              networkTimeoutSeconds: 10,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
})
