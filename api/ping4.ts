// TEMPORARY probe: TypeScript + `export default` (no imports). Mirrors our real
// handlers' export style. If this crashes while ts-module-exports works, the
// `export default` form is the problem. Remove after debug.
export default (_req: any, res: any) => {
  res.status(200).json({ ok: true, node: process.version, runtime: 'ts-export-default' })
}
