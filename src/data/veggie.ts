import { shuffle } from './exam'

export interface Dish {
  id: string
  name: string
  description: string
  safe: boolean
  reason: string
  colors: [string, string] // bowl contents, garnish
}

// A playful game — NOT dietary advice. Restaurants vary; always ask.
export const DISHES: Dish[] = [
  {
    id: 'temple_pancake',
    name: 'Temple-style vegan pancake',
    description: 'Buckwheat batter, scallions and mushrooms. The monks approve.',
    safe: true,
    reason: 'Temple-style food skips meat, fish and eggs entirely.',
    colors: ['#E9C77B', '#7DBB6E'],
  },
  {
    id: 'veg_bibimbap',
    name: 'Vegetarian bibimbap',
    description: 'No egg, no meat, sauce double-checked by the detective.',
    safe: true,
    reason: 'Rice, vegetables and gochujang. Still worth asking — some sauces hide beef stock.',
    colors: ['#F2E6D0', '#E4572E'],
  },
  {
    id: 'tofu_tomato',
    name: 'Tofu in tomato gravy',
    description: 'The researcher’s comfort classic.',
    safe: true,
    reason: 'Tofu, tomatoes and spices. A detective’s dream.',
    colors: ['#E06C4C', '#FFF3D6'],
  },
  {
    id: 'goguma',
    name: 'Grilled sweet potato',
    description: 'Street-cart classic, wrapped in paper.',
    safe: true,
    reason: 'Just sweet potato and fire. Perfectly innocent.',
    colors: ['#B5654A', '#F6C25B'],
  },
  {
    id: 'vanilla_latte',
    name: 'Iced vanilla latte (no flowers)',
    description: 'Espresso, milk, vanilla, ice.',
    safe: true,
    reason: 'Dairy is fine for this detective. The flower was removed by Regulation #001.',
    colors: ['#C89F7A', '#FFFFFF'],
  },
  {
    id: 'spinach_namul',
    name: 'Spinach namul (soy & sesame)',
    description: 'Menu says: seasoned with soy sauce and sesame oil only.',
    safe: true,
    reason: 'Soy and sesame, no fish sauce listed. Detective satisfied.',
    colors: ['#4E9A51', '#F3E3B4'],
  },
  {
    id: 'egg_bibimbap',
    name: 'Classic bibimbap',
    description: 'Topped with a sunny fried egg and a little beef.',
    safe: false,
    reason: 'A fried egg AND beef. Ask for it without — or pick the veggie version.',
    colors: ['#F2E6D0', '#FFD23F'],
  },
  {
    id: 'doenjang',
    name: 'Doenjang-jjigae (soybean stew)',
    description: 'Cozy and bubbling… broth unconfirmed.',
    safe: false,
    reason: 'Often simmered in anchovy broth, sometimes with clams or beef.',
    colors: ['#A8743F', '#6FB36B'],
  },
  {
    id: 'kimchi_jeon',
    name: 'Kimchi pancake',
    description: 'Crispy, red and very tempting.',
    safe: false,
    reason: 'Kimchi is often made with fish sauce or salted shrimp, and the batter may contain egg.',
    colors: ['#E4572E', '#F2C14E'],
  },
  {
    id: 'clear_soup',
    name: '“Vegetable” clear soup',
    description: 'Mostly radish. Suspiciously savory.',
    safe: false,
    reason: 'This vegetable soup is acting suspiciously fishy: anchovy broth is a common base.',
    colors: ['#EFE6C8', '#FFFFFF'],
  },
  {
    id: 'gimbap',
    name: 'Classic gimbap',
    description: 'Bright yellow strips peek out from inside…',
    safe: false,
    reason: 'Usually has egg strips plus ham, fish cake or tuna. Veggie gimbap exists — ask!',
    colors: ['#2F3B2F', '#FFD23F'],
  },
  {
    id: 'tteokbokki',
    name: 'Tteokbokki',
    description: 'Chewy rice cakes in glossy red sauce.',
    safe: false,
    reason: 'Often cooked with fish cakes and anchovy stock.',
    colors: ['#D7263D', '#FBE3C3'],
  },
  {
    id: 'japchae',
    name: 'Restaurant japchae',
    description: 'Glass noodles, sesame, very shiny.',
    safe: false,
    reason: 'The default version often includes beef and egg garnish. Ask for a veggie one.',
    colors: ['#9C6B3A', '#F2C14E'],
  },
]

export function buildVeggieRound(rand: () => number = Math.random): Dish[] {
  const safe = shuffle(
    DISHES.filter((d) => d.safe),
    rand,
  ).slice(0, 3)
  const sus = shuffle(
    DISHES.filter((d) => !d.safe),
    rand,
  ).slice(0, 3)
  return shuffle([...safe, ...sus], rand)
}

export function veggieScore(correct: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((100 * correct) / total)
}
