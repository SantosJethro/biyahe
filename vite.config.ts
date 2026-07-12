import { defineConfig, loadEnv, type Plugin, type Connect } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { parse as parseCookie } from 'cookie'
import type { ServerResponse } from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Runs the Vercel-style serverless functions in `./api` inside the Vite dev
 * server so the whole app works with a single `npm run dev`, with no separate
 * backend process. In production these same files are deployed as real
 * serverless functions; this plugin only affects local development.
 */
const localServerlessApi = (): Plugin => {
  const apiDir = path.resolve(__dirname, 'api')

  const resolveHandlerFile = (pathname: string): string | null => {
    // "/api/admin/crawl" -> "api/admin/crawl.ts" (or ".../index.ts")
    const rel = pathname.replace(/^\/api\/?/, '').replace(/\/+$/, '')
    const candidates = [
      path.join(apiDir, `${rel}.ts`),
      path.join(apiDir, rel, 'index.ts'),
    ]
    return candidates.find((f) => fs.existsSync(f)) ?? null
  }

  return {
    name: 'local-serverless-api',
    apply: 'serve',
    configureServer(server) {
      const handler: Connect.NextHandleFunction = async (req, res, next) => {
        const url = req.url ?? ''
        if (!url.startsWith('/api')) return next()

        const parsed = new URL(url, 'http://localhost')
        // Private helper folders (e.g. api/_lib) are never routable.
        if (parsed.pathname.split('/').some((s) => s.startsWith('_'))) {
          return sendJson(res, 404, { error: 'Not found' })
        }

        const file = resolveHandlerFile(parsed.pathname)
        if (!file) return sendJson(res, 404, { error: 'Not found' })

        try {
          const mod = await server.ssrLoadModule(file)
          const fn = mod.default
          if (typeof fn !== 'function') {
            return sendJson(res, 500, { error: 'Handler has no default export' })
          }
          const apiReq = await adaptRequest(req, parsed)
          const apiRes = adaptResponse(res)
          await fn(apiReq, apiRes)
        } catch (err) {
          server.ssrFixStacktrace(err as Error)
          // eslint-disable-next-line no-console
          console.error('[api] handler error:', err)
          if (!res.writableEnded) sendJson(res, 500, { error: 'Internal server error' })
        }
      }
      server.middlewares.use(handler)
    },
  }
}

const readBody = async (req: Connect.IncomingMessage): Promise<unknown> => {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  if (chunks.length === 0) return undefined
  const raw = Buffer.concat(chunks).toString('utf8')
  const type = req.headers['content-type'] ?? ''
  if (type.includes('application/json')) {
    try {
      return JSON.parse(raw)
    } catch {
      return undefined
    }
  }
  return raw
}

const adaptRequest = async (req: Connect.IncomingMessage, parsed: URL) => {
  const query: Record<string, string> = {}
  parsed.searchParams.forEach((value, key) => {
    query[key] = value
  })
  return {
    method: (req.method ?? 'GET').toUpperCase(),
    url: req.url ?? '',
    headers: req.headers,
    query,
    cookies: parseCookie(req.headers.cookie ?? ''),
    body: await readBody(req),
  }
}

const adaptResponse = (res: ServerResponse) => {
  const api = res as ServerResponse & {
    status: (code: number) => typeof api
    json: (data: unknown) => void
    send: (data: unknown) => void
  }
  api.status = (code: number) => {
    res.statusCode = code
    return api
  }
  api.json = (data: unknown) => {
    if (!res.headersSent) res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(data))
  }
  api.send = (data: unknown) => {
    if (typeof data === 'object' && data !== null) return api.json(data)
    res.end(String(data ?? ''))
  }
  return api
}

const sendJson = (res: ServerResponse, code: number, data: unknown) => {
  res.statusCode = code
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}

export default defineConfig(({ mode }) => {
  // Load every var from `.env*` (no prefix filter) into process.env so the
  // serverless handlers — which run in this same Node process during dev — can
  // read JWT_SECRET, SITE_PASSWORD, etc. Existing process.env wins.
  const env = loadEnv(mode, process.cwd(), '')
  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) process.env[key] = value
  }

  return {
    plugins: [
    react(),
    localServerlessApi(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt', 'icon.svg'],
      manifest: {
        name: 'Biyahe — PH Toll Cost Tracker',
        short_name: 'Biyahe',
        description:
          'Estimate toll costs for Philippine expressways and skyways.',
        theme_color: '#0b5d3b',
        background_color: '#0b5d3b',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' },
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            // Cache the last successful toll data so the calculator works offline.
            urlPattern: ({ url }) => url.pathname.startsWith('/api/tolls'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'toll-data',
              expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
    ],
    server: {
      port: 5173,
    },
  }
})
