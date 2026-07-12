// TEMPORARY probe: TypeScript + CommonJS `module.exports` (no `export default`).
// If this works but the `export default` ones crash, the handler export form is
// the culprit. Remove after debug.
module.exports = (_req: any, res: any) => {
  res.status(200).json({ ok: true, node: process.version, runtime: 'ts-module-exports' })
}
