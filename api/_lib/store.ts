import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { tollDatasetSchema, type TollDataset } from '../../shared/toll'
import { seedDataset } from './data/seed'

/**
 * Persistence for the toll dataset.
 *
 * The crawler writes here; the public API reads here. Locally this is a JSON
 * file under `./data`. On a read-only serverless filesystem (Vercel) it falls
 * back to the OS temp dir — which is ephemeral, so a production deployment
 * should swap `readStore`/`writeStore` for a durable KV/DB. That boundary is
 * deliberately tiny and lives only in this file.
 */

const STORE_DIR = process.env.VERCEL ? os.tmpdir() : path.resolve(process.cwd(), 'data')
const STORE_PATH = path.join(STORE_DIR, 'tolls.store.json')

/**
 * Returns the current dataset. If no crawl has ever run (or the stored file is
 * missing/corrupt) the curated seed dataset is returned so the app always works.
 */
export const readStore = async (): Promise<TollDataset> => {
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8')
    const parsed = tollDatasetSchema.safeParse(JSON.parse(raw))
    if (parsed.success) return parsed.data
    console.warn('[store] stored dataset failed validation, using seed:', parsed.error.message)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.warn('[store] could not read dataset, using seed:', err)
    }
  }
  return seedDataset
}

/** Validates then atomically persists a dataset. Throws on invalid data. */
export const writeStore = async (dataset: TollDataset): Promise<void> => {
  const validated = tollDatasetSchema.parse(dataset)
  await fs.mkdir(STORE_DIR, { recursive: true })
  const tmp = `${STORE_PATH}.${process.pid}.tmp`
  await fs.writeFile(tmp, JSON.stringify(validated, null, 2), 'utf8')
  await fs.rename(tmp, STORE_PATH)
}

export { STORE_PATH }
