import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { api } from '../api/client'
import type { TollDataset } from '../../shared/toll'

interface TollDataValue {
  loading: boolean
  error: string | null
  dataset: TollDataset | null
  reload: () => Promise<void>
}

const TollDataContext = createContext<TollDataValue | null>(null)

/** Loads the toll dataset once for the whole app; `reload` re-fetches (e.g. after a crawl). */
export const TollDataProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dataset, setDataset] = useState<TollDataset | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setDataset(await api.tolls())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load toll data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return (
    <TollDataContext.Provider value={{ loading, error, dataset, reload }}>
      {children}
    </TollDataContext.Provider>
  )
}

export const useTollData = (): TollDataValue => {
  const ctx = useContext(TollDataContext)
  if (!ctx) throw new Error('useTollData must be used within <TollDataProvider>')
  return ctx
}
