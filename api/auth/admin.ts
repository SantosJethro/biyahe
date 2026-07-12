import { z } from 'zod'
import { setAdminCookie, verifyAdminPassword } from '../_lib/auth'
import { methodNotAllowed, withErrorHandling, type ApiHandler } from '../_lib/http'

const bodySchema = z.object({ password: z.string().min(1) })

/** POST /api/auth/admin — exchange the admin password for an admin session. */
const handler: ApiHandler = async (req, res) => {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST'])

  const parsed = bodySchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Password is required.' })
  }

  if (!verifyAdminPassword(parsed.data.password)) {
    return res.status(401).json({ error: 'Incorrect admin password.' })
  }

  setAdminCookie(res)
  res.status(200).json({ admin: true })
}

export default withErrorHandling(handler)
