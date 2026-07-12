/**
 * Minimal, framework-agnostic request/response contracts.
 *
 * These are structurally satisfied by BOTH Vercel's `VercelRequest`/
 * `VercelResponse` (in production) and the adapter in `vite.config.ts` (in local
 * dev), so handlers never import a platform-specific type.
 */
export interface ApiRequest {
  method?: string
  url?: string
  headers: Record<string, string | string[] | undefined>
  query: Record<string, string | string[] | undefined>
  cookies: Record<string, string | undefined>
  body?: unknown
}

export interface ApiResponse {
  status(code: number): ApiResponse
  json(data: unknown): void
  send(data: unknown): void
  setHeader(name: string, value: string | string[]): void
  end(): void
}

export type ApiHandler = (req: ApiRequest, res: ApiResponse) => void | Promise<void>

/** Reject any method not in `allowed`, returning 405 with an `Allow` header. */
export const methodNotAllowed = (res: ApiResponse, allowed: string[]): void => {
  res.setHeader('Allow', allowed.join(', '))
  res.status(405).json({ error: `Method not allowed. Use ${allowed.join(', ')}.` })
}

/** Wraps a handler so any thrown error becomes a clean 500 instead of a crash. */
export const withErrorHandling = (handler: ApiHandler): ApiHandler => {
  return async (req, res) => {
    try {
      await handler(req, res)
    } catch (err) {
      console.error('[api] unhandled error:', err)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
}
