// TEMPORARY: a WORKING plain-JS probe that require()s the TypeScript chain and
// reports exactly what each import does (ok/type or the error), so the real
// runtime failure is visible in the response. Remove after debug.
module.exports = async (_req, res) => {
  const steps = {}
  const probe = async (name, fn) => {
    try {
      const v = await fn()
      steps[name] = 'ok:' + typeof v
    } catch (e) {
      steps[name] = 'ERR ' + ((e && e.code) || '') + ' ' + ((e && e.message) || String(e))
    }
  }
  await probe('node', async () => process.version)
  await probe('require-zod', async () => require('zod').z)
  await probe('require-shared-toll', async () => require('../shared/toll').planRoute)
  await probe('require-seed', async () => require('./_lib/data/seed').seedDataset)
  await probe('require-store', async () => require('./_lib/store').readStore)
  await probe('require-http', async () => require('./_lib/http').withErrorHandling)
  await probe('require-env', async () => require('./_lib/env').config)
  await probe('require-auth', async () => require('./_lib/auth').readSession)
  await probe('require-tolls-default', async () => require('./tolls').default)
  res.status(200).json({ ok: true, steps })
}
