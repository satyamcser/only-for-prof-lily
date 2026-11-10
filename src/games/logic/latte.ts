export type Ingredient = 'cup' | 'ice' | 'espresso' | 'milk' | 'vanilla' | 'flower' | 'water' | 'anchovy' | 'sock'

export const REAL_INGREDIENTS: Ingredient[] = ['cup', 'ice', 'espresso', 'milk', 'vanilla']
export const ALL_INGREDIENTS: Ingredient[] = [...REAL_INGREDIENTS, 'flower', 'water', 'anchovy', 'sock']
export const LATTE_SECONDS = 18
export const MAX_MISTAKES = 3

export const INGREDIENT_LABEL: Record<Ingredient, string> = {
  cup: 'Clear cup',
  ice: 'Ice',
  espresso: 'Espresso',
  milk: 'Milk (or oat milk)',
  vanilla: 'Vanilla syrup',
  flower: 'A flower',
  water: 'Plain water',
  anchovy: 'Anchovy broth',
  sock: 'Simba’s sock',
}

export const WRONG_QUIP: Record<string, string> = {
  flower: 'DUBOT: “Excellent choice. Botanical innovation.”',
  water: 'DUBOT: “Hydration is a kind of coffee, emotionally.”',
  anchovy: 'Suspicious broth detected. The Vegetarian Detective is on the way.',
  sock: 'Simba donated this. Simba is innocent. The sock moved by itself.',
  needCup: 'Ice on the bare counter. Tofu approves. The professor does not.',
}

export type LatteEvent =
  | { kind: 'good'; ingredient: Ingredient }
  | { kind: 'bad'; ingredient: Ingredient }
  | { kind: 'needCup'; ingredient: Ingredient }
  | { kind: 'dup'; ingredient: Ingredient }

export interface LatteState {
  added: Ingredient[]
  mistakes: number
  status: 'playing' | 'won' | 'lost'
  loseReason: 'mistakes' | 'time' | null
  last: LatteEvent | null
}

export function newLatte(): LatteState {
  return { added: [], mistakes: 0, status: 'playing', loseReason: null, last: null }
}

function mistake(s: LatteState, ev: LatteEvent): LatteState {
  const mistakes = s.mistakes + 1
  const lost = mistakes >= MAX_MISTAKES
  return { ...s, mistakes, last: ev, status: lost ? 'lost' : 'playing', loseReason: lost ? 'mistakes' : null }
}

export function addIngredient(s: LatteState, ing: Ingredient): LatteState {
  if (s.status !== 'playing') return s
  if (!REAL_INGREDIENTS.includes(ing)) return mistake(s, { kind: 'bad', ingredient: ing })
  if (ing !== 'cup' && !s.added.includes('cup')) return mistake(s, { kind: 'needCup', ingredient: ing })
  if (s.added.includes(ing)) return { ...s, last: { kind: 'dup', ingredient: ing } }
  const added = [...s.added, ing]
  const won = REAL_INGREDIENTS.every((r) => added.includes(r))
  return { ...s, added, last: { kind: 'good', ingredient: ing }, status: won ? 'won' : 'playing' }
}

export function timeUp(s: LatteState): LatteState {
  return s.status === 'playing' ? { ...s, status: 'lost', loseReason: 'time' } : s
}

export function latteScore(s: LatteState): number {
  if (s.status === 'won') return Math.max(55, 100 - 15 * s.mistakes)
  return Math.min(40, s.added.length * 8)
}
