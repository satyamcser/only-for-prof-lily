import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { applyPrefs, loadPrefs, reducedMotion, savePrefs, type Prefs } from '../lib/prefs'
import { setSoundEnabled } from '../lib/sound'

export interface Toast {
  id: number
  text: string
  tone: 'info' | 'good' | 'error'
}

interface UiValue {
  prefs: Prefs
  setPrefs: (patch: Partial<Prefs>) => void
  reduced: boolean
  toasts: Toast[]
  toast: (text: string, tone?: Toast['tone']) => void
  dismissToast: (id: number) => void
  bubble: string | null
  say: (text: string) => void
}

const UiContext = createContext<UiValue | null>(null)

export function UiProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefsState] = useState<Prefs>(loadPrefs)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [bubble, setBubble] = useState<string | null>(null)
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const nextId = useRef(1)

  useEffect(() => {
    applyPrefs(prefs)
    setSoundEnabled(prefs.sound)
    savePrefs(prefs)
  }, [prefs])

  useEffect(() => {
    // Follow OS changes when the player chose "system".
    try {
      const mq = [window.matchMedia('(prefers-color-scheme: dark)'), window.matchMedia('(prefers-reduced-motion: reduce)')]
      const on = () => applyPrefs(prefs)
      mq.forEach((m) => m.addEventListener('change', on))
      return () => mq.forEach((m) => m.removeEventListener('change', on))
    } catch {
      return undefined
    }
  }, [prefs])

  const setPrefs = useCallback((patch: Partial<Prefs>) => setPrefsState((p) => ({ ...p, ...patch })), [])

  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), [])
  const toast = useCallback(
    (text: string, tone: Toast['tone'] = 'info') => {
      const id = nextId.current++
      setToasts((t) => [...t.slice(-2), { id, text, tone }])
      setTimeout(() => dismissToast(id), tone === 'error' ? 7000 : 4000)
    },
    [dismissToast],
  )

  const say = useCallback((text: string) => {
    setBubble(text)
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current)
    bubbleTimer.current = setTimeout(() => setBubble(null), 4200)
  }, [])

  const value = useMemo<UiValue>(
    () => ({ prefs, setPrefs, reduced: reducedMotion(prefs), toasts, toast, dismissToast, bubble, say }),
    [prefs, setPrefs, toasts, toast, dismissToast, bubble, say],
  )
  return <UiContext.Provider value={value}>{children}</UiContext.Provider>
}

export function useUi(): UiValue {
  const v = useContext(UiContext)
  if (!v) throw new Error('useUi outside UiProvider')
  return v
}
