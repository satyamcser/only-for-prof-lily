// Tiny platformer physics for the observatory star walk (a 1000×400 world).
export const WORLD_W = 1000
export const GROUND_Y = 330
export const GRAVITY = 1500
export const JUMP_V = 640
export const WALK_SPEED = 260
export const PICK_RADIUS = 46
export const BODY_H = 70

export interface Star {
  id: number
  x: number
  y: number
  got: boolean
}

export interface Walker {
  x: number
  y: number // feet position
  vy: number
  onGround: boolean
  facing: 1 | -1
}

export function newStars(): Star[] {
  return [
    { id: 0, x: 150, y: 300, got: false },
    { id: 1, x: 330, y: 190, got: false },
    { id: 2, x: 520, y: 290, got: false },
    { id: 3, x: 700, y: 180, got: false },
    { id: 4, x: 880, y: 240, got: false },
  ]
}

export function newWalker(): Walker {
  return { x: 60, y: GROUND_Y, vy: 0, onGround: true, facing: 1 }
}

export interface Input {
  left: boolean
  right: boolean
  jump: boolean
}

export function stepWalker(w: Walker, input: Input, dt: number): Walker {
  let { x, y, vy, onGround, facing } = w
  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0)
  if (dir !== 0) facing = dir > 0 ? 1 : -1
  x = Math.max(20, Math.min(WORLD_W - 20, x + dir * WALK_SPEED * dt))
  if (input.jump && onGround) {
    vy = -JUMP_V
    onGround = false
  }
  vy += GRAVITY * dt
  y += vy * dt
  if (y >= GROUND_Y) {
    y = GROUND_Y
    vy = 0
    onGround = true
  }
  return { x, y, vy, onGround, facing }
}

/** A star is collected when it is near any part of the avatar's body. */
export function collect(stars: Star[], w: Walker): Star[] {
  let changed = false
  const next = stars.map((s) => {
    if (s.got) return s
    const bodyY = Math.max(w.y - BODY_H, Math.min(w.y, s.y))
    const near = Math.hypot(s.x - w.x, s.y - bodyY) <= PICK_RADIUS
    if (near) changed = true
    return near ? { ...s, got: true } : s
  })
  return changed ? next : stars
}

/** Highest point the avatar's head reaches in a jump (y grows downwards). */
export function jumpApexHeadY(): number {
  return GROUND_Y - (JUMP_V * JUMP_V) / (2 * GRAVITY) - BODY_H
}
