import type { Expressway, TollDataset } from '../../../shared/toll'
import { readStore, writeStore } from '../store'
import { adapterById } from './adapters'
import { fetchHtml } from './fetch'
import type { CrawlReport, ParsedInterchange, SourceResult } from './types'

export type { CrawlReport, SourceResult } from './types'

const normalize = (name: string): string => {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/**
 * Apply parsed fares onto an expressway's KNOWN interchanges only. Rows that
 * don't match a known interchange are ignored — this keeps a mis-parsed table
 * (ads, unrelated tables, JS shells) from injecting garbage.
 *
 * Returns how many known interchanges the parsed data *matched* (our confidence
 * the page parsed correctly) and, of those, how many actually *changed*. A crawl
 * that matches many interchanges but changes none simply means prices are already
 * current — that is a success, not a failure.
 */
const applyParsed = (
  expressway: Expressway,
  parsed: ParsedInterchange[],
): { matched: number; changed: number } => {
  const byNorm = new Map<string, number>()
  for (const row of parsed) byNorm.set(normalize(row.name), row.class1Toll)

  let matched = 0
  let changed = 0
  for (const ic of expressway.interchanges) {
    const key = normalize(ic.name)
    // Exact match, or a known interchange whose name contains / is contained.
    let fare = byNorm.get(key)
    if (fare == null) {
      for (const [pk, pv] of byNorm) {
        if (pk.includes(key) || key.includes(pk)) {
          fare = pv
          break
        }
      }
    }
    if (fare == null) continue
    matched++
    if (fare !== ic.class1Toll) {
      ic.class1Toll = fare
      changed++
    }
  }
  return { matched, changed }
}

export interface RunCrawlOptions {
  /** Restrict the crawl to a single expressway id. */
  onlyId?: string
}

/**
 * Fetches each source, parses it, and merges the result into the dataset.
 * Failures are isolated per-source and never lose existing data (seed or prior
 * crawl). Returns both the machine-readable report and the resulting dataset.
 */
export const runCrawl = async (
  options: RunCrawlOptions = {},
): Promise<{ report: CrawlReport; dataset: TollDataset }> => {
  const startedAt = new Date()
  const dataset: TollDataset = structuredClone(await readStore())
  const results: SourceResult[] = []
  let updatedCount = 0

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
  let first = true

  for (const expressway of dataset.expressways) {
    const adapter = adapterById.get(expressway.id)
    if (!adapter) continue
    if (options.onlyId && options.onlyId !== expressway.id) continue

    // Space out requests: the shared CDN rate-limits bursts. (No wait before the
    // first source, or when refreshing a single one.)
    if (!first) await sleep(600)
    first = false

    const t0 = Date.now()
    const base = {
      id: expressway.id,
      label: adapter.label,
      sourceUrl: expressway.sourceUrl,
    }
    try {
      const html = await fetchHtml(expressway.sourceUrl)
      const parsed = adapter.parse(html)
      const { matched, changed } = applyParsed(expressway, parsed)

      // Require ≥2 matched interchanges as proof the page parsed correctly,
      // guarding against ad tables, JS shells, or challenge pages.
      if (matched >= 2) {
        expressway.source = 'crawl'
        expressway.updatedAt = new Date().toISOString()
        if (changed > 0) updatedCount++
        results.push({
          ...base,
          ok: true,
          message:
            changed > 0
              ? `Updated ${changed} of ${matched} matched fare(s).`
              : `Confirmed ${matched} fare(s) — already current.`,
          interchangesFound: parsed.length,
          durationMs: Date.now() - t0,
        })
      } else {
        results.push({
          ...base,
          ok: false,
          message: `Parsed ${parsed.length} row(s) but matched only ${matched} known interchange(s); kept existing data.`,
          interchangesFound: parsed.length,
          durationMs: Date.now() - t0,
        })
      }
    } catch (err) {
      results.push({
        ...base,
        ok: false,
        message: `Fetch/parse failed: ${(err as Error).message}. Kept existing data.`,
        interchangesFound: 0,
        durationMs: Date.now() - t0,
      })
    }
  }

  dataset.generatedAt = new Date().toISOString()
  await writeStore(dataset)

  const finishedAt = new Date()
  return {
    report: {
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      updatedCount,
      results,
    },
    dataset,
  }
}
