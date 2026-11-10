import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { friendlyError } from '../lib/api'
import type { Note, WorldState } from '../lib/types'

interface SharedValue {
  world: WorldState | null
  notes: Note[] | null
  loading: boolean
  error: string | null
  online: boolean
  refresh: () => Promise<void>
}

const SharedContext = createContext<SharedValue | null>(null)

/** Shared, server-backed state for the two members. Re-fetches on realtime events. */
export function SharedProvider({ children }: { children: ReactNode }) {
  const { api } = useAuth()
  const [world, setWorld] = useState<WorldState | null>(null)
  const [notes, setNotes] = useState<Note[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))
  const inflight = useRef<Promise<void> | null>(null)

  const refresh = useCallback(() => {
    if (inflight.current) return inflight.current
    const p = (async () => {
      try {
        const [w, n] = await Promise.all([api.getWorld(), api.listNotes()])
        setWorld(w)
        setNotes(n)
        setError(null)
      } catch (e) {
        setError(friendlyError(e))
      } finally {
        setLoading(false)
        inflight.current = null
      }
    })()
    inflight.current = p
    return p
  }, [api])

  useEffect(() => {
    void refresh()
    return api.subscribe(() => void refresh())
  }, [api, refresh])

  useEffect(() => {
    const up = () => {
      setOnline(true)
      void refresh()
    }
    const down = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => {
      window.removeEventListener('online', up)
      window.removeEventListener('offline', down)
    }
  }, [refresh])

  const value = useMemo(() => ({ world, notes, loading, error, online, refresh }), [world, notes, loading, error, online, refresh])
  return <SharedContext.Provider value={value}>{children}</SharedContext.Provider>
}

export function useShared(): SharedValue {
  const v = useContext(SharedContext)
  if (!v) throw new Error('useShared outside SharedProvider')
  return v
}
