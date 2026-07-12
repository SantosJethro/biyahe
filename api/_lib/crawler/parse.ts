import * as cheerio from 'cheerio'
import type { ParsedInterchange } from './types'

/**
 * Parser for the expressway.ph toll-matrix pages.
 *
 * Each page renders the fare matrix as a triangular ENTRY × EXIT grid: the first
 * `<table>` is the Class-1 matrix, its header row is `["Exit \ Entry", <entry
 * plaza>, …]`, and every subsequent row is `[<exit plaza>, <fare from entry 1>,
 * …]` with `"--"` where a pair is not tolled. To express these as the app's
 * *cumulative from a reference origin* model, we read a single column: the fare
 * from a fixed origin plaza to every reachable exit.
 *
 * `matrixColumnParser(originPlaza)` returns a parser bound to that origin. It is
 * defensive: if the origin column can't be found (page shape changed, JS shell,
 * blocked fetch) it returns `[]`, and the orchestrator keeps the existing data.
 */

const normalize = (text: string): string => {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '')
}

const clean = (text: string): string => {
  return text.replace(/\s+/g, ' ').trim()
}

const toAmount = (text: string): number | null => {
  const cleaned = text.replace(/[^\d.]/g, '')
  if (!cleaned) return null
  const value = Number(cleaned)
  return Number.isFinite(value) && value > 0 ? value : null
}

const looksLikePlace = (text: string): boolean => {
  const t = text.trim()
  return t.length >= 2 && /[a-z]/i.test(t) && toAmount(t) === null
}

export const matrixColumnParser = (originPlaza: string) => {
  const target = normalize(originPlaza)

  return (html: string): ParsedInterchange[] => {
    const $ = cheerio.load(html)

    for (const table of $('table').toArray()) {
      const trs = $(table).find('tr').toArray()
      if (trs.length < 2) continue

      const header = $(trs[0])
        .find('td,th')
        .toArray()
        .map((c) => clean($(c).text()))
      // Column 0 is the "Exit \ Entry" label; entries start at column 1.
      const col = header.findIndex((h, i) => i > 0 && normalize(h) === target)
      if (col < 1) continue

      const rows: ParsedInterchange[] = []
      for (const tr of trs.slice(1)) {
        const cells = $(tr)
          .find('td,th')
          .toArray()
          .map((c) => clean($(c).text()))
        const name = cells[0] ?? ''
        const fare = toAmount(cells[col] ?? '')
        if (fare != null && looksLikePlace(name)) {
          rows.push({ name, class1Toll: Math.round(fare) })
        }
      }
      if (rows.length > 0) return rows
    }

    return []
  }
}
