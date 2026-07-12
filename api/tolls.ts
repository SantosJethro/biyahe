import { readStore } from './_lib/store'
import { methodNotAllowed, withErrorHandling, type ApiHandler } from './_lib/http'

/** GET /api/tolls — the full toll dataset. Public (no site password). */
const handler: ApiHandler = async (req, res) => {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET'])

  const dataset = await readStore()
  // Allow the service worker / browser to cache briefly; data changes rarely.
  res.setHeader('Cache-Control', 'public, max-age=300')
  res.status(200).json(dataset)
}

export default withErrorHandling(handler)
