/* TEMPORARY diagnostic endpoint — remove after debugging the Vercel 500s.
 * Has NO static imports so it always loads; it dynamically imports each piece
 * of the failing chain inside try/catch and reports exactly what throws. */
export default async function handler(_req: any, res: any) {
  const steps: Record<string, string> = {}
  const probe = async (name: string, fn: () => Promise<unknown>) => {
    try {
      const v = await fn()
      steps[name] = `ok (${typeof v})`
    } catch (e: any) {
      steps[name] = `ERR ${e?.code ?? ''} ${e?.message ?? e}`.trim()
    }
  }

  await probe('node-version', async () => process.version)
  await probe('import-zod', async () => (await import('zod')).z)
  await probe('import-shared-toll', async () => (await import('../shared/toll')).planRoute)
  await probe('import-seed', async () => (await import('./_lib/data/seed')).seedDataset)
  await probe('import-store', async () => (await import('./_lib/store')).readStore)
  await probe('import-http', async () => (await import('./_lib/http')).withErrorHandling)
  await probe('import-env', async () => (await import('./_lib/env')).config)
  await probe('import-auth', async () => (await import('./_lib/auth')).readSession)
  await probe('import-tolls-handler', async () => (await import('./tolls')).default)

  res.status(200).json({ ok: true, steps })
}
