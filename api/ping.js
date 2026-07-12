// TEMPORARY: the most basic possible Vercel function — plain CommonJS, no
// TypeScript, no imports. Isolates whether the crash is platform-level (this
// fails too) or specific to our TS/ESM setup (this works). Remove after debug.
module.exports = (req, res) => {
  res.status(200).json({ ok: true, node: process.version, runtime: 'plain-cjs-js' })
}
