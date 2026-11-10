// UI preferences only (sound, motion, theme, intro seen). Never game data.
export interface Prefs {
  sound: boolean
  motion: 'system' | 'reduce' | 'full'
  theme: 'system' | 'day' | 'night'
  introSeen: boolean
}

const KEY = 'only-for-prof-lily.prefs.v1'
export const DEFAULT_PREFS: Prefs = { sound: false, motion: 'system', theme: 'day', introSeen: false }

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT_PREFS }
    const p = JSON.parse(raw) as Partial<Prefs>
    return {
      sound: p.sound === true,
      motion: p.motion === 'reduce' || p.motion === 'full' ? p.motion : 'system',
      theme: p.theme === 'night' || p.theme === 'system' ? p.theme : 'day',
      introSeen: p.introSeen === true,
    }
  } catch {
    return { ...DEFAULT_PREFS }
  }
}

export function savePrefs(p: Prefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    /* private mode: preferences just won't persist */
  }
}

function media(q: string): boolean {
  try {
    return window.matchMedia(q).matches
  } catch {
    return false
  }
}

export function reducedMotion(p: Prefs): boolean {
  if (p.motion === 'reduce') return true
  if (p.motion === 'full') return false
  return media('(prefers-reduced-motion: reduce)')
}

export function resolvedTheme(p: Prefs): 'day' | 'night' {
  if (p.theme === 'system') return media('(prefers-color-scheme: dark)') ? 'night' : 'day'
  return p.theme
}

export function applyPrefs(p: Prefs) {
  const root = document.documentElement
  const theme = resolvedTheme(p)
  root.dataset.theme = theme
  root.dataset.motion = reducedMotion(p) ? 'reduce' : 'full'
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'night' ? '#171C34' : '#FFF8ED')
}
