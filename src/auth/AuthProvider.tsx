import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { friendlyError, type DataApi } from '../lib/api'
import type { Member, SessionUser } from '../lib/types'

export type AuthStatus = 'loading' | 'signedOut' | 'notMember' | 'member' | 'error'

interface AuthValue {
  api: DataApi
  status: AuthStatus
  user: SessionUser | null
  member: Member | null
  error: string | null
  urlError: string | null
  retry: () => void
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

/** Reads an auth error that Supabase put in the URL (e.g. an expired link). */
function takeUrlAuthError(): string | null {
  try {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, '') || window.location.search)
    const desc = params.get('error_description')
    if (!desc) return null
    window.history.replaceState(null, '', window.location.pathname)
    return desc.replace(/\+/g, ' ')
  } catch {
    return null
  }
}

const initialUrlError = takeUrlAuthError()

export function AuthProvider({ api, children }: { api: DataApi; children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<SessionUser | null>(null)
  const [member, setMember] = useState<Member | null>(null)
  const [error, setError] = useState<string | null>(null)
  const lastUid = useRef<string | null | undefined>(undefined)

  const resolve = useCallback(
    async (u: SessionUser | null) => {
      setUser(u)
      if (!u) {
        lastUid.current = null
        setMember(null)
        setStatus('signedOut')
        return
      }
      try {
        const m = await api.getMembership()
        lastUid.current = u.id
        setMember(m)
        setStatus(m ? 'member' : 'notMember')
        setError(null)
      } catch (e) {
        setError(friendlyError(e))
        setStatus('error')
      }
    },
    [api],
  )

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      await resolve(await api.getSessionUser())
    } catch (e) {
      setError(friendlyError(e))
      setStatus('error')
    }
  }, [api, resolve])

  useEffect(() => {
    void load()
    return api.onAuthChange((u) => {
      // Token refreshes fire too; only re-resolve when the user actually changes.
      if ((u?.id ?? null) !== lastUid.current) void resolve(u)
    })
  }, [api, load, resolve])

  const signOut = useCallback(async () => {
    try {
      await api.signOut()
    } finally {
      lastUid.current = null
      setUser(null)
      setMember(null)
      setStatus('signedOut')
    }
  }, [api])

  const value = useMemo<AuthValue>(
    () => ({ api, status, user, member, error, urlError: initialUrlError, retry: () => void load(), signOut }),
    [api, status, user, member, error, load, signOut],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const v = useContext(AuthContext)
  if (!v) throw new Error('useAuth outside AuthProvider')
  return v
}
