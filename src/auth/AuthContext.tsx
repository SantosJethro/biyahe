import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api } from '../api/client'
import type { SessionState } from '../api/types'

interface AuthContextValue {
  loading: boolean
  session: SessionState
  enterAdmin: (password: string) => Promise<void>
  logout: () => Promise<void>
}

const LOGGED_OUT: SessionState = { admin: false }

const AuthContext = createContext<AuthContextValue | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<SessionState>(LOGGED_OUT)

  useEffect(() => {
    let active = true
    api
      .session()
      .then((s) => active && setSession(s))
      .catch(() => active && setSession(LOGGED_OUT))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  const enterAdmin = useCallback(async (password: string) => {
    setSession(await api.enterAdmin(password))
  }, [])

  const logout = useCallback(async () => {
    setSession(await api.logout())
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ loading, session, enterAdmin, logout }),
    [loading, session, enterAdmin, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
