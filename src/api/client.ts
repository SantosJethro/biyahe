import type { TollDataset } from '../../shared/toll'
import type { AdminStatus, CrawlReport, SessionState } from './types'

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  let res: Response
  try {
    res = await fetch(path, {
      credentials: 'same-origin',
      headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
      ...init,
    })
  } catch {
    throw new ApiError('Network error — check your connection.', 0)
  }

  const isJson = res.headers.get('content-type')?.includes('application/json')
  const payload = isJson ? await res.json().catch(() => null) : null

  if (!res.ok) {
    const message =
      (payload && typeof payload.error === 'string' && payload.error) ||
      `Request failed (${res.status}).`
    throw new ApiError(message, res.status)
  }
  return payload as T
}

const post = <T>(path: string, body?: unknown): Promise<T> => {
  return request<T>(path, {
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

/** Typed wrapper over the serverless API. */
export const api = {
  session: () => request<SessionState>('/api/auth/session'),
  enterAdmin: (password: string) => post<SessionState>('/api/auth/admin', { password }),
  logout: () => post<SessionState>('/api/auth/logout'),
  tolls: () => request<TollDataset>('/api/tolls'),
  adminStatus: () => request<AdminStatus>('/api/admin/status'),
  crawl: (onlyId?: string) => post<CrawlReport>('/api/admin/crawl', onlyId ? { onlyId } : {}),
}
