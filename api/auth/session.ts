import { readSession } from '../_lib/auth'
import { methodNotAllowed, withErrorHandling, type ApiHandler } from '../_lib/http'

/** GET /api/auth/session — report whether the caller has an admin session. */
const handler: ApiHandler = async (req, res) => {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET'])
  res.status(200).json({ admin: Boolean(readSession(req)) })
}

export default withErrorHandling(handler)
