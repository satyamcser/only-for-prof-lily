import type { DataApi } from './api'

export type Backend = { kind: 'ready'; api: DataApi } | { kind: 'unconfigured' }

const url = (import.meta.env.VITE_SUPABASE_URL ?? '').trim()
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '').trim()

export const supabaseConfigured =
  /^https?:\/\//.test(url) && key.length > 20 && !url.includes('YOUR_PROJECT') && !key.includes('YOUR_SUPABASE')

/**
 * Picks the backend once at startup.
 *  1. Supabase when configured (the real, shared game).
 *  2. Otherwise the in-memory mock — ONLY in `npm run dev` or when the build
 *     sets VITE_DEMO_MODE=true. Production builds without Supabase show a
 *     "not configured yet" screen instead of pretending to save anything.
 */
export async function loadBackend(): Promise<Backend> {
  if (supabaseConfigured) {
    const { createSupabaseApi } = await import('./supabaseApi')
    return { kind: 'ready', api: createSupabaseApi(url, key) }
  }
  if (import.meta.env.DEV || import.meta.env.VITE_DEMO_MODE === 'true') {
    const { createMockApi } = await import('./mockApi')
    return { kind: 'ready', api: createMockApi() }
  }
  return { kind: 'unconfigured' }
}
