/** Response shapes returned by the serverless API (mirrors `api/`). */

import type { RfidSystem } from '../../shared/toll'

export interface SessionState {
  admin: boolean
}

export interface CrawlSourceResult {
  id: string
  label: string
  sourceUrl: string
  ok: boolean
  message: string
  interchangesFound: number
  durationMs: number
}

export interface CrawlReport {
  startedAt: string
  finishedAt: string
  durationMs: number
  updatedCount: number
  results: CrawlSourceResult[]
}

export interface AdminSourceStatus {
  id: string
  name: string
  shortName: string
  operator: string
  sourceUrl: string
  rfid: RfidSystem
  source: 'seed' | 'crawl'
  updatedAt: string
  interchanges: number
  hasAdapter: boolean
}

export interface AdminStatus {
  generatedAt: string
  sources: AdminSourceStatus[]
}
