import { describe, expect, it } from 'vitest'
import { buildExamRound, EXAM_QUESTIONS } from '../src/data/exam'
import { buildVeggieRound, DISHES, veggieScore } from '../src/data/veggie'
import { escapeScore, newEscape, step, tapPet, tapThing, ESCAPE_SECONDS } from '../src/games/logic/escape'
import { addIngredient, latteScore, newLatte, timeUp, type Ingredient } from '../src/games/logic/latte'
import { drop, laundryScore, newLaundry, simbaStrikes } from '../src/games/logic/laundry'
import { collect, GROUND_Y, jumpApexHeadY, newStars, newWalker, stepWalker } from '../src/games/logic/observatory'

const seq = (vals: number[]) => {
  let i = 0
  return () => vals[i++ % vals.length]
}

describe('Latte or Flower?', () => {
  const play = (ings: Ingredient[]) => ings.reduce(addIngredient, newLatte())

  it('the correct recipe wins with 100', () => {
    const s = play(['cup', 'ice', 'espresso', 'milk', 'vanilla'])
    expect(s.status).toBe('won')
    expect(latteScore(s)).toBe(100)
  })
  it('requires the cup first', () => {
    const s = play(['ice'])
    expect(s.mistakes).toBe(1)
    expect(s.last?.kind).toBe('needCup')
    expect(s.added).toEqual([])
  })
  it('three wrong ingredients = flower water', () => {
    const s = play(['flower', 'water', 'anchovy'])
    expect(s).toMatchObject({ status: 'lost', loseReason: 'mistakes' })
    expect(latteScore(s)).toBe(0)
  })
  it('duplicates are harmless', () => {
    const s = play(['cup', 'cup'])
    expect(s.mistakes).toBe(0)
    expect(s.last?.kind).toBe('dup')
  })
  it('running out of time loses but keeps partial credit', () => {
    const s = timeUp(play(['cup', 'ice']))
    expect(s).toMatchObject({ status: 'lost', loseReason: 'time' })
    expect(latteScore(s)).toBe(16)
  })
  it('mistakes reduce a winning score but never below 55', () => {
    expect(latteScore(play(['flower', 'cup', 'ice', 'espresso', 'milk', 'vanilla']))).toBe(85)
  })
})

describe('Laundry Crisis', () => {
  it('sorting everything correctly wins', () => {
    let s = newLaundry(['shirt-a', 'sock-a', 'towel-a'])
    s = drop(s, 'shirt-a', 'shirt')
    s = drop(s, 'sock-a', 'sock')
    expect(s.status).toBe('playing')
    s = drop(s, 'towel-a', 'towel')
    expect(s.status).toBe('won')
    expect(laundryScore(s)).toBe(100)
  })
  it('wrong baskets cost points (floor 30)', () => {
    let s = newLaundry(['shirt-a'])
    for (let i = 0; i < 9; i++) s = drop(s, 'shirt-a', 'sock')
    expect(s.wrong).toBe(9)
    expect(laundryScore(s)).toBe(30)
  })
  it('Simba relocates one folded item, once', () => {
    let s = newLaundry(['sock-a', 'shirt-a'])
    s = drop(s, 'sock-a', 'sock')
    s = simbaStrikes(s)
    expect(s.pile).toContain('sock-a')
    expect(s.sorted.sock).toEqual([])
    const again = simbaStrikes(drop(s, 'sock-a', 'sock'))
    expect(again.sorted.sock).toEqual(['sock-a'])
  })
})

describe('Silvermoon Observatory physics', () => {
  it('walking reaches low stars, jumping reaches high ones', () => {
    const stars = newStars()
    const high = Math.min(...stars.map((s) => s.y))
    expect(jumpApexHeadY()).toBeLessThan(high) // apex head is above the highest star
    let w = newWalker()
    let got = stars
    // 1) walk right across the sky without jumping: picks up the low stars
    for (let i = 0; i < 300; i++) {
      w = stepWalker(w, { left: false, right: true, jump: false }, 1 / 60)
      got = collect(got, w)
    }
    expect(got.filter((s) => s.got).length).toBeGreaterThanOrEqual(3)
    // 2) stand under each remaining star and jump
    for (const s of got.filter((x) => !x.got)) {
      w = { ...newWalker(), x: s.x }
      for (let i = 0; i < 60; i++) {
        w = stepWalker(w, { left: false, right: false, jump: i === 0 }, 1 / 60)
        got = collect(got, w)
      }
    }
    expect(got.every((s) => s.got)).toBe(true)
  })
  it('lands back on the ground', () => {
    let w = stepWalker(newWalker(), { left: false, right: false, jump: true }, 1 / 60)
    for (let i = 0; i < 200; i++) w = stepWalker(w, { left: false, right: false, jump: false }, 1 / 60)
    expect(w).toMatchObject({ y: GROUND_Y, onGround: true })
  })
})

describe('Great Café Escape', () => {
  it('ends after the timer and clamps the score', () => {
    let s = newEscape()
    const rand = seq([0.1, 0.9, 0.5, 0.3])
    for (let i = 0; i < (ESCAPE_SECONDS + 1) * 20; i++) s = step(s, 0.05, rand)
    expect(s.status).toBe('done')
    expect(escapeScore(s)).toBeGreaterThanOrEqual(0)
    expect(escapeScore(s)).toBeLessThanOrEqual(300)
  })
  it('toys give points, socks take a few', () => {
    let s = newEscape()
    s = { ...s, things: [{ id: 1, kind: 'toy', x: 10, y: 10, vx: 0, ttl: 3 }, { id: 2, kind: 'sock', x: 10, y: 10, vx: 0, ttl: 3 }] }
    ;[s] = tapThing(s, 1)
    ;[s] = tapThing(s, 2)
    expect(s).toMatchObject({ toys: 1, oops: 1, score: 5 })
  })
  it('tapping a plotting pet averts the crisis', () => {
    let s = newEscape()
    s = { ...s, pets: s.pets.map((p) => (p.id === 'simba' ? { ...p, mischief: true } : p)) }
    const [after, r] = tapPet(s, 'simba', () => 0.5)
    expect(r).toBe('save')
    expect(after.pets.find((p) => p.id === 'simba')?.mischief).toBe(false)
    expect(tapPet(after, 'tofu')[1]).toBe('pat')
  })
  it('a pet reaching the tray causes an incident', () => {
    let s = newEscape()
    s = { ...s, pets: s.pets.map((p) => (p.id === 'tofu' ? { ...p, x: s.dubotX, y: 150, mischief: true } : p)) }
    s = step(s, 0.01, () => 0.5)
    expect(s.incidents).toBe(1)
    expect(s.score).toBe(-15)
    expect(escapeScore(s)).toBe(0)
  })
})

describe('content rounds', () => {
  it('exam rounds have 4 regular + 1 skippable bonus question', () => {
    const r = buildExamRound()
    expect(r).toHaveLength(5)
    expect(r.filter((q) => q.bonus)).toHaveLength(1)
    expect(new Set(r.map((q) => q.id)).size).toBe(5)
  })
  it('the exam bundle contains no answer key', () => {
    for (const q of EXAM_QUESTIONS) expect(Object.keys(q).sort()).toEqual(q.bonus ? ['bonus', 'id', 'options', 'prompt'] : ['id', 'options', 'prompt'])
  })
  it('veggie rounds mix 3 safe and 3 suspicious dishes', () => {
    const r = buildVeggieRound()
    expect(r.filter((d) => d.safe)).toHaveLength(3)
    expect(r.filter((d) => !d.safe)).toHaveLength(3)
    expect(veggieScore(5, 6)).toBe(83)
    expect(DISHES.every((d) => d.reason.length > 10)).toBe(true)
  })
})
