// The Great Café Escape: a 25-second tap game. Pure simulation for testability.
export const ARENA_W = 400
export const ARENA_H = 300
export const ESCAPE_SECONDS = 25
export const TRAY_RADIUS = 36
export const DUBOT_Y = 150

export type PetId = 'tofu' | 'simba'

export interface Pet {
  id: PetId
  x: number
  y: number
  vx: number
  vy: number
  speed: number
  mischief: boolean // heading for DUBOT's tray
  cooldown: number // seconds until it gets ideas again
}

export interface Thing {
  id: number
  kind: 'toy' | 'sock' | 'cup'
  x: number
  y: number
  vx: number
  ttl: number
}

export interface EscapeState {
  time: number
  score: number
  dubotX: number
  dubotDir: 1 | -1
  pets: Pet[]
  things: Thing[]
  nextSpawn: number
  nextId: number
  toys: number
  saves: number
  incidents: number
  oops: number
  tofuSnackPlots: number
  simbaSockPlots: number
  shake: number
  status: 'playing' | 'done'
}

export function newEscape(): EscapeState {
  return {
    time: 0,
    score: 0,
    dubotX: 200,
    dubotDir: 1,
    pets: [
      { id: 'tofu', x: 60, y: 240, vx: 30, vy: -10, speed: 45, mischief: false, cooldown: 3 },
      { id: 'simba', x: 340, y: 70, vx: -110, vy: 40, speed: 120, mischief: false, cooldown: 1.5 },
    ],
    things: [],
    nextSpawn: 0.6,
    nextId: 1,
    toys: 0,
    saves: 0,
    incidents: 0,
    oops: 0,
    tofuSnackPlots: 0,
    simbaSockPlots: 0,
    shake: 0,
    status: 'playing',
  }
}

function aim(p: Pet, tx: number, ty: number): Pet {
  const d = Math.hypot(tx - p.x, ty - p.y) || 1
  return { ...p, vx: ((tx - p.x) / d) * p.speed, vy: ((ty - p.y) / d) * p.speed }
}

export function step(s: EscapeState, dt: number, rand: () => number = Math.random): EscapeState {
  if (s.status !== 'playing') return s
  let st: EscapeState = { ...s, time: s.time + dt, shake: Math.max(0, s.shake - dt) }
  if (st.time >= ESCAPE_SECONDS) return { ...st, time: ESCAPE_SECONDS, status: 'done' }

  // DUBOT strolls with his tray.
  let dubotDir = st.dubotDir
  let dubotX = st.dubotX + dubotDir * 40 * dt
  if (dubotX > 330) dubotDir = -1
  if (dubotX < 70) dubotDir = 1
  dubotX = Math.max(70, Math.min(330, dubotX))
  st = { ...st, dubotX, dubotDir }

  // Pets wander; sometimes they get ideas about the tray.
  const pets = st.pets.map((p0) => {
    let p: Pet = { ...p0, cooldown: p0.cooldown - dt }
    if (!p.mischief && p.cooldown <= 0) {
      p = { ...p, mischief: true }
      if (p.id === 'tofu') st = { ...st, tofuSnackPlots: st.tofuSnackPlots + 1 }
      else st = { ...st, simbaSockPlots: st.simbaSockPlots + 1 }
    }
    if (p.mischief) p = aim(p, dubotX, DUBOT_Y)
    let vx = p.vx
    let vy = p.vy
    let x = p.x + vx * dt
    let y = p.y + vy * dt
    if (x < 20 || x > ARENA_W - 20) vx = -vx
    if (y < 30 || y > ARENA_H - 20) vy = -vy
    x = Math.max(20, Math.min(ARENA_W - 20, x))
    y = Math.max(30, Math.min(ARENA_H - 20, y))
    p = { ...p, x, y, vx, vy }
    if (p.mischief && Math.hypot(p.x - dubotX, p.y - DUBOT_Y) < TRAY_RADIUS) {
      st = { ...st, incidents: st.incidents + 1, score: st.score - 15, shake: 0.6 }
      const fromLeft = p.x < dubotX
      p = { ...p, mischief: false, cooldown: 2 + rand() * 2, x: fromLeft ? 30 : ARENA_W - 30, vx: fromLeft ? p.speed : -p.speed, vy: 0 }
    }
    return p
  })
  st = { ...st, pets }

  // Things drift and expire.
  let things = st.things
    .map((t) => ({ ...t, x: t.x + t.vx * dt, ttl: t.ttl - dt }))
    .filter((t) => t.ttl > 0 && t.x > -30 && t.x < ARENA_W + 30)
  let nextSpawn = st.nextSpawn - dt
  let nextId = st.nextId
  if (nextSpawn <= 0) {
    const r = rand()
    const kind: Thing['kind'] = r < 0.6 ? 'toy' : r < 0.8 ? 'sock' : 'cup'
    const fromLeft = rand() < 0.5
    things = [
      ...things,
      {
        id: nextId++,
        kind,
        x: kind === 'toy' ? 40 + rand() * (ARENA_W - 80) : fromLeft ? -20 : ARENA_W + 20,
        y: 50 + rand() * (ARENA_H - 90),
        vx: kind === 'toy' ? 0 : (fromLeft ? 1 : -1) * (60 + rand() * 40),
        ttl: kind === 'toy' ? 3.2 : 8,
      },
    ]
    nextSpawn = 0.75 + rand() * 0.5
  }
  return { ...st, things, nextSpawn, nextId }
}

export type TapResult = 'toy' | 'oops' | 'save' | 'pat' | 'none'

export function tapThing(s: EscapeState, id: number): [EscapeState, TapResult] {
  const t = s.things.find((x) => x.id === id)
  if (!t || s.status !== 'playing') return [s, 'none']
  const things = s.things.filter((x) => x.id !== id)
  if (t.kind === 'toy') return [{ ...s, things, toys: s.toys + 1, score: s.score + 10 }, 'toy']
  return [{ ...s, things, oops: s.oops + 1, score: s.score - 5 }, 'oops']
}

export function tapPet(s: EscapeState, id: PetId, rand: () => number = Math.random): [EscapeState, TapResult] {
  if (s.status !== 'playing') return [s, 'none']
  const pet = s.pets.find((p) => p.id === id)
  if (!pet || !pet.mischief) return [s, 'pat']
  const away = pet.x < s.dubotX ? -1 : 1
  const pets = s.pets.map((p) =>
    p.id !== id ? p : { ...p, mischief: false, cooldown: (p.id === 'tofu' ? 3 : 1.8) + rand() * 2, vx: away * p.speed, vy: (rand() - 0.5) * p.speed },
  )
  return [{ ...s, pets, saves: s.saves + 1, score: s.score + 10 }, 'save']
}

export function escapeScore(s: EscapeState): number {
  return Math.max(0, Math.min(300, Math.round(s.score)))
}
