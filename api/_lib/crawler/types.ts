/** One interchange row extracted from an operator's published toll matrix. */
export interface ParsedInterchange {
  name: string
  /** Cumulative Class-1 toll (PHP) from the source's reference origin. */
  class1Toll: number
}

/**
 * A source adapter knows how to turn one operator's HTML into normalised
 * interchange fares. Fetching is done centrally; adapters are pure parsers so
 * they are trivially unit-testable against saved HTML fixtures.
 */
export interface SourceAdapter {
  /** Expressway id this adapter refreshes (matches `Expressway.id`). */
  id: string
  /** Human label for logs / admin UI. */
  label: string
  /** Parse fetched HTML into cumulative interchange fares. */
  parse(html: string): ParsedInterchange[]
}

export interface SourceResult {
  id: string
  label: string
  sourceUrl: string
  ok: boolean
  /** Human-readable outcome (why it succeeded or failed). */
  message: string
  interchangesFound: number
  durationMs: number
}

export interface CrawlReport {
  startedAt: string
  finishedAt: string
  durationMs: number
  updatedCount: number
  results: SourceResult[]
}
