import { useEffect, useState } from 'react'
import type { GameId } from './types'

export type Route =
  | { name: 'campus' }
  | { name: 'play'; game?: GameId }
  | { name: 'notes' }
  | { name: 'badges' }
  | { name: 'faculty' }
  | { name: 'settings' }

const GAME_IDS: GameId[] = ['latte_rescue', 'laundry_crisis', 'totally_fair_exam', 'observatory', 'veggie_detective', 'cafe_escape']

/** Hash routes (#/notes) so GitHub Pages never 404s on refresh or deep links. */
export function parseHash(hash: string): Route {
  if (!hash.startsWith('#/')) return { name: 'campus' } // also ignores Supabase auth fragments
  const [section, sub] = hash.slice(2).split('/')
  switch (section) {
    case 'play':
      return { name: 'play', game: GAME_IDS.includes(sub as GameId) ? (sub as GameId) : undefined }
    case 'notes':
    case 'badges':
    case 'faculty':
    case 'settings':
      return { name: section }
    default:
      return { name: 'campus' }
  }
}

export function routeToHash(r: Route): string {
  if (r.name === 'play') return r.game ? `#/play/${r.game}` : '#/play'
  return `#/${r.name}`
}

export function navigate(r: Route) {
  const h = routeToHash(r)
  if (window.location.hash !== h) window.location.hash = h
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash))
  useEffect(() => {
    const on = () => setRoute(parseHash(window.location.hash))
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}
