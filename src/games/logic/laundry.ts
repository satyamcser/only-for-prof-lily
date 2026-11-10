export type GarmentType = 'shirt' | 'sock' | 'towel'

export interface Garment {
  id: string
  type: GarmentType
  color: string
}

export const BINS: { type: GarmentType; label: string }[] = [
  { type: 'shirt', label: 'Folded shirts' },
  { type: 'sock', label: 'Matched socks' },
  { type: 'towel', label: 'Fluffy towels' },
]

export const GARMENTS: Garment[] = [
  { id: 'shirt-a', type: 'shirt', color: '#F7C9DA' },
  { id: 'towel-a', type: 'towel', color: '#A5E0D3' },
  { id: 'sock-a', type: 'sock', color: '#B9A6E8' },
  { id: 'shirt-b', type: 'shirt', color: '#BFE3F2' },
  { id: 'sock-b', type: 'sock', color: '#F5C76B' },
  { id: 'towel-b', type: 'towel', color: '#FFE9A8' },
]

export interface LaundryState {
  pile: string[]
  sorted: Record<GarmentType, string[]>
  wrong: number
  escapes: number
  catches: number
  simbaStruck: boolean
  status: 'playing' | 'won'
  last: { kind: 'good' | 'bad' | 'simba'; id: string } | null
}

export function newLaundry(order: string[] = GARMENTS.map((g) => g.id)): LaundryState {
  return {
    pile: [...order],
    sorted: { shirt: [], sock: [], towel: [] },
    wrong: 0,
    escapes: 0,
    catches: 0,
    simbaStruck: false,
    status: 'playing',
    last: null,
  }
}

export const garment = (id: string): Garment => GARMENTS.find((g) => g.id === id)!

export function drop(s: LaundryState, id: string, bin: GarmentType): LaundryState {
  if (s.status !== 'playing' || !s.pile.includes(id)) return s
  const g = garment(id)
  if (g.type !== bin) return { ...s, wrong: s.wrong + 1, last: { kind: 'bad', id } }
  const pile = s.pile.filter((x) => x !== id)
  const sorted = { ...s.sorted, [bin]: [...s.sorted[bin], id] }
  return { ...s, pile, sorted, last: { kind: 'good', id }, status: pile.length === 0 ? 'won' : 'playing' }
}

/** Simba "relocates" one folded item back to the pile, once per round. */
export function simbaStrikes(s: LaundryState): LaundryState {
  if (s.status !== 'playing' || s.simbaStruck) return s
  const victim = s.sorted.sock[0] ?? s.sorted.shirt[0] ?? s.sorted.towel[0]
  if (!victim) return s
  const type = garment(victim).type
  return {
    ...s,
    simbaStruck: true,
    pile: [...s.pile, victim],
    sorted: { ...s.sorted, [type]: s.sorted[type].filter((x) => x !== victim) },
    last: { kind: 'simba', id: victim },
  }
}

export function laundryScore(s: LaundryState): number {
  return Math.max(30, Math.min(100, 100 - 10 * s.wrong - 5 * s.escapes))
}
