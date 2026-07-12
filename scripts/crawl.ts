/**
 * Run the crawler from the command line (useful for cron / CI / debugging):
 *
 *   npm run crawl            # refresh all sources
 *   npm run crawl -- nlex    # refresh a single expressway
 *
 * Writes the same data store the app reads. Exits non-zero if every source
 * failed, so it can be wired into monitoring.
 */
import { runCrawl } from '../api/_lib/crawler'

const main = async () => {
  const onlyId = process.argv[2]

  const { report } = await runCrawl(onlyId ? { onlyId } : {})

  console.log(`\nCrawl finished in ${report.durationMs}ms — ${report.updatedCount} source(s) updated\n`)
  for (const r of report.results) {
    const status = r.ok ? 'OK  ' : 'SKIP'
    console.log(`  [${status}] ${r.label.padEnd(22)} ${r.message}`)
  }

  const anyOk = report.results.some((r) => r.ok)
  if (report.results.length > 0 && !anyOk) {
    console.error('\nAll sources failed. Existing data was kept.')
    process.exit(1)
  }
}

void main()
