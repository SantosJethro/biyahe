/**
 * Polite, bounded, resilient HTML fetch for the crawler.
 *
 * - Sends a browser-like User-Agent. The sources sit behind a CDN (Cloudflare)
 *   that challenges obvious bot agents; a normal desktop UA is served the page.
 * - Retries transient failures (network errors, timeouts, 403/429/5xx) with
 *   exponential backoff + jitter. The CDN rate-limits bursts, so a first attempt
 *   can fail even though the page is fine — a short wait usually clears it.
 * - Enforces a hard timeout per attempt so a slow source can never stall a crawl.
 * - Caps the response size so a pathological page can't exhaust memory.
 */
const DEFAULT_TIMEOUT_MS = 15_000
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
const DEFAULT_RETRIES = 3

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

export class FetchError extends Error {}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** 403/408/429 and any 5xx are worth retrying; other 4xx are not. */
const isRetryableStatus = (status: number): boolean => {
  return status === 403 || status === 408 || status === 429 || status >= 500
}

const fetchOnce = async (url: string, timeoutMs: number): Promise<string> => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-PH,en;q=0.9',
      },
    })
    if (!res.ok) {
      const err = new FetchError(`HTTP ${res.status} ${res.statusText}`)
      ;(err as FetchError & { retryable?: boolean }).retryable = isRetryableStatus(res.status)
      throw err
    }
    const contentType = res.headers.get('content-type') ?? ''
    if (!contentType.includes('html') && !contentType.includes('text')) {
      throw new FetchError(`Unexpected content-type: ${contentType || 'unknown'}`)
    }
    const buf = await res.arrayBuffer()
    if (buf.byteLength > MAX_BYTES) {
      throw new FetchError(`Response too large (${buf.byteLength} bytes)`)
    }
    return new TextDecoder('utf-8').decode(buf)
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      const e = new FetchError(`Timed out after ${timeoutMs}ms`)
      ;(e as FetchError & { retryable?: boolean }).retryable = true
      throw e
    }
    if (err instanceof FetchError) throw err
    // Undici network failures ("fetch failed") — transient, retry.
    const e = new FetchError((err as Error).message || 'Network error')
    ;(e as FetchError & { retryable?: boolean }).retryable = true
    throw e
  } finally {
    clearTimeout(timer)
  }
}

export const fetchHtml = async (
  url: string,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  retries = DEFAULT_RETRIES,
): Promise<string> => {
  let lastErr: FetchError = new FetchError('Not attempted')
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetchOnce(url, timeoutMs)
    } catch (err) {
      lastErr = err as FetchError
      const retryable = (err as FetchError & { retryable?: boolean }).retryable ?? false
      if (!retryable || attempt === retries) break
      // Exponential backoff with jitter: ~0.8s, 1.6s, 3.2s (+ up to 400ms).
      const backoff = 800 * 2 ** attempt + Math.floor(Math.random() * 400)
      await sleep(backoff)
    }
  }
  throw lastErr
}
