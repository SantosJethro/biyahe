import { requireAdmin } from '../_lib/auth'
import { readStore } from '../_lib/store'
import { adapters } from '../_lib/crawler/adapters'
import { methodNotAllowed, withErrorHandling, type ApiHandler } from '../_lib/http'

/**
 * GET /api/admin/status — per-source freshness summary for the admin console
 * (admin only). Does not fetch anything; just reports current dataset state.
 */
const handler: ApiHandler = async (req, res) => {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET'])
  if (!requireAdmin(req, res)) return

  const dataset = await readStore()
  const labelById = new Map(adapters.map((a) => [a.id, a.label]))

  res.status(200).json({
    generatedAt: dataset.generatedAt,
    sources: dataset.expressways.map((x) => ({
      id: x.id,
      name: x.name,
      shortName: x.shortName,
      operator: labelById.get(x.id) ?? x.operator,
      sourceUrl: x.sourceUrl,
      rfid: x.rfid,
      source: x.source,
      updatedAt: x.updatedAt,
      interchanges: x.interchanges.length,
      hasAdapter: labelById.has(x.id),
    })),
  })
}

export default withErrorHandling(handler)
