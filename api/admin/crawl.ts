import { z } from 'zod'
import { requireAdmin } from '../_lib/auth'
import { runCrawl } from '../_lib/crawler'
import { methodNotAllowed, withErrorHandling, type ApiHandler } from '../_lib/http'

const bodySchema = z
  .object({ onlyId: z.string().min(1).optional() })
  .optional()

/**
 * POST /api/admin/crawl — trigger a crawl of the official sources (admin only).
 * Body may include `{ onlyId }` to refresh a single expressway.
 */
const handler: ApiHandler = async (req, res) => {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST'])
  if (!requireAdmin(req, res)) return

  const parsed = bodySchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request body.' })
  }

  const { report } = await runCrawl({ onlyId: parsed.data?.onlyId })
  res.status(200).json(report)
}

export default withErrorHandling(handler)
