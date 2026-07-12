import { clearSessionCookie } from '../_lib/auth'
import { methodNotAllowed, withErrorHandling, type ApiHandler } from '../_lib/http'

/** POST /api/auth/logout — clear the admin session cookie. */
const handler: ApiHandler = async (req, res) => {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST'])
  clearSessionCookie(res)
  res.status(200).json({ admin: false })
}

export default withErrorHandling(handler)
