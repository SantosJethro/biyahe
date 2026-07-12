import { matrixColumnParser } from './parse'
import type { SourceAdapter } from './types'

/**
 * Registry of source adapters, keyed by expressway id. Every source today is an
 * expressway.ph toll-matrix page, so each adapter is the same matrix parser bound
 * to the ORIGIN plaza whose column expresses that expressway's cumulative fares
 * (see `parse.ts`). The origin label must match the entry-plaza header on the
 * page exactly (case/punctuation-insensitive).
 *
 * The `sourceUrl` actually fetched comes from the dataset (`Expressway.sourceUrl`)
 * so URLs live in exactly one place. Note SCTEX reads the NLEX page's
 * "Tipo/Subic" column — expressway.ph publishes SCTEX inside the NLEX matrix.
 */
export const adapters: SourceAdapter[] = [
  { id: 'nlex', label: 'NLEX (expressway.ph)', parse: matrixColumnParser('Balintawak') },
  { id: 'slex', label: 'SLEX (expressway.ph)', parse: matrixColumnParser('Magallanes') },
  { id: 'skyway', label: 'Skyway Stage 3 (expressway.ph)', parse: matrixColumnParser('Balintawak') },
  { id: 'cavitex', label: 'CAVITEX (expressway.ph)', parse: matrixColumnParser('Parañaque') },
  { id: 'calax', label: 'CALAX (expressway.ph)', parse: matrixColumnParser('Greenfield') },
  { id: 'tplex', label: 'TPLEX (expressway.ph)', parse: matrixColumnParser('La Paz') },
  { id: 'sctex', label: 'SCTEX via NLEX (expressway.ph)', parse: matrixColumnParser('Tipo/Subic') },
  { id: 'star', label: 'STAR Tollway (expressway.ph)', parse: matrixColumnParser('Calamba') },
]

export const adapterById = new Map(adapters.map((a) => [a.id, a]))
