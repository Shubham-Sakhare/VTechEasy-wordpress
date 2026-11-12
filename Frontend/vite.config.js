import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env so we can read VITE_WP_API_URL inside the config
  const env = loadEnv(mode, process.cwd(), '')
  const wpBase = (env.VITE_WP_API_URL || '').replace(/\/+$/, '')

  return {
    base: '/',
    plugins: [react(), tailwindcss()],

    server: {
      port: 5173,

      proxy: wpBase
        ? {
            // Any request to /wp-proxy/* is forwarded to the live WordPress backend.
            // This solves two problems at once:
            //   1. CORS — the browser sees the request as same-origin (localhost:5173)
            //   2. InfinityFree bot-protection — the proxy sends a real browser-style
            //      User-Agent so the host doesn't serve the JS challenge page.
            '/wp-proxy': {
              target: wpBase,
              changeOrigin: true,
              secure: true,
              rewrite: (path) => path.replace(/^\/wp-proxy/, ''),
              configure: (proxy) => {
                proxy.on('proxyReq', (proxyReq) => {
                  // Mimic a real browser so InfinityFree anti-bot lets the request through
                  proxyReq.setHeader(
                    'User-Agent',
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
                  )
                  proxyReq.setHeader('Accept', 'application/json, text/plain, */*')
                  proxyReq.setHeader('Accept-Language', 'en-US,en;q=0.9')
                  proxyReq.setHeader('Origin', wpBase)
                  proxyReq.setHeader('Referer', wpBase + '/')
                })
              },
            },
          }
        : {},
    },
  }
})
