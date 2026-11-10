import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { EXAM_QUESTIONS } from '../src/data/exam'
import { createMockApi, MOCK_EXAM_KEY, MOCK_IDS } from '../src/lib/mockApi'
import { coins, cooperation, deriveBadges, deriveCards, headToHead } from '../src/lib/rules'
import type { Note, WorldState } from '../src/lib/types'
import { NoteCard } from '../src/scenes/Notes'

describe('exam answer key', () => {
  const sql = readFileSync(join(process.cwd(), 'supabase/migrations/20261110000000_init.sql'), 'utf8')
  const sqlKey = Object.fromEntries(
    [...sql.matchAll(/\('([qc]_[a-z_]+)',\s*(\d),\s*(true|false)\)/g)].map((m) => [m[1], { correct: Number(m[2]), optional: m[3] === 'true' }]),
  )
  it('mock key mirrors the database key exactly', () => {
    expect(sqlKey).toEqual(MOCK_EXAM_KEY)
  })
  it('every question in the app has a key, and bonus flags match', () => {
    expect(Object.keys(sqlKey).sort()).toEqual(EXAM_QUESTIONS.map((q) => q.id).sort())
    for (const q of EXAM_QUESTIONS) expect(sqlKey[q.id].optional).toBe(Boolean(q.bonus))
  })
})

describe('mock backend mirrors the database rules', () => {
  it('blocks strangers, protects authorship, limits awards', async () => {
    const api = createMockApi()
    await api.mockSignIn!('stranger')
    await expect(api.getWorld()).rejects.toThrow(/not_a_member/)

    await api.mockSignIn!('satyam')
    await api.postNote('Hello from the lab')
    const [note] = (await api.listNotes()).filter((n) => n.kind === 'note')
    expect(note.authorId).toBe(MOCK_IDS.satyam)

    await api.mockSignIn!('lily')
    await expect(api.editNote(note.id, 'hacked')).rejects.toThrow(/own notes/)
    await expect(api.deleteNote(note.id)).rejects.toThrow(/own notes/)
    await expect(api.postNote('x'.repeat(281))).rejects.toThrow()

    const first = await api.recordCompletion('latte_rescue', 100)
    const second = await api.recordCompletion('latte_rescue', 100)
    expect(first.pointsAwarded).toBe(10)
    expect(second).toMatchObject({ pointsAwarded: 0, alreadyAwarded: true })
    await expect(api.recordCompletion('latte_rescue', 101)).rejects.toThrow(/score_out_of_range/)

    const exam = await api.submitExam({ q_sugohaesseoyo: 0, q_forbidden: 2, q_sock_thief: 1, q_hard_day: 1, c_optic: null })
    expect(exam).toMatchObject({ score: 100, perfect: true, pointsAwarded: 15 })

    const w = await api.getWorld()
    expect(w.players.find((p) => p.role === 'lily')?.stars).toBe(25)
    expect(w.players.find((p) => p.role === 'satyam')?.stars).toBe(3) // letterbox note
  })

  it('shares the constellation between both players', async () => {
    const api = createMockApi()
    await api.mockSignIn!('satyam')
    expect((await api.recordCompletion('observatory', 5)).starsLit).toBe(3)
    await api.mockSignIn!('lily')
    expect((await api.recordCompletion('observatory', 2)).starsLit).toBe(2)
    const w = await api.getWorld()
    expect(w.constellations[0].lit).toHaveLength(5)
    expect(deriveCards(w).find((c) => c.id === 'freezing_wind_report')?.unlocked).toBe(true)
    expect(deriveCards(w).find((c) => c.id === 'remote_faculty_meeting')?.unlocked).toBe(true)
  })

  it('hides the other vote until you vote', async () => {
    const api = createMockApi()
    await api.mockSignIn!('lily')
    await api.castVote('approve')
    await expect(api.castVote('reject')).rejects.toThrow(/already_voted_today/)
    await api.mockSignIn!('satyam')
    expect((await api.getWorld()).vote).toMatchObject({ myChoice: null, otherChoice: null })
    await api.castVote('reject')
    expect((await api.getWorld()).vote).toMatchObject({ myChoice: 'reject', otherChoice: 'approve' })
  })
})

describe('derived cards, badges and levels', () => {
  const base: WorldState = {
    today: '2026-11-10',
    me: 'L',
    players: [
      { userId: 'L', role: 'lily', displayName: 'Professor Lily', stars: 60, notesPosted: 3, cardsRead: 3 },
      { userId: 'S', role: 'satyam', displayName: 'Researcher Satyam', stars: 60, notesPosted: 0, cardsRead: 0 },
    ],
    activities: [],
    stats: [
      { userId: 'L', activityId: 'latte_rescue', plays: 2, bestScore: 100, points: 10, firstAt: '2026-11-01T00:00:00Z', perfectAt: null, cranialAt: null, awardedToday: true },
      { userId: 'L', activityId: 'veggie_detective', plays: 1, bestScore: 83, points: 10, firstAt: '2026-11-02T00:00:00Z', perfectAt: null, cranialAt: null, awardedToday: false },
    ],
    myCardReads: [],
    constellations: [],
    starsLitToday: 0,
    vote: { proposalId: 'p', title: 't', myChoice: null, otherChoice: null },
  }
  it('cards unlock only from real activity', () => {
    const cards = deriveCards(base)
    expect(cards.find((c) => c.id === 'flower_water_incident')).toMatchObject({ unlocked: true, unlockedAt: '2026-11-01T00:00:00Z' })
    expect(cards.find((c) => c.id === 'remote_faculty_meeting')?.unlocked).toBe(false)
    expect(cards.filter((c) => c.unlocked)).toHaveLength(2)
  })
  it('badges are per player', () => {
    const lily = deriveBadges(base, 'L')
    const satyam = deriveBadges(base, 'S')
    const earned = (l: typeof lily) => l.filter((b) => b.earned).map((b) => b.id).sort()
    expect(earned(lily)).toEqual(['cafe_funding_approved', 'flower_water_survivor', 'honorary_english_teacher', 'no_peer_review_required', 'vegetarian_detective'])
    expect(earned(satyam)).toEqual(['cafe_funding_approved'])
  })
  it('head-to-head finds the leader and per-game record holders', () => {
    const tied = headToHead(base)
    expect(tied.leader).toBeNull()
    expect(tied.gameLeaders.latte_rescue).toBe('L')
    expect(tied.gameLeaders.observatory).toBeNull()
    const w = {
      ...base,
      players: base.players.map((p) => (p.userId === 'S' ? { ...p, stars: 75 } : p)),
      stats: [...base.stats, { ...base.stats[0], userId: 'S', bestScore: 100 }],
    }
    const h = headToHead(w)
    expect(h.leader?.userId).toBe('S')
    expect(h.margin).toBe(15)
    expect(h.gameLeaders.latte_rescue).toBeNull() // 100 vs 100 = tie
    expect(h.gamesLed).toEqual({ L: 1, S: 0 })
  })
  it('coins and cooperation are derived from shared stars', () => {
    expect(coins(base)).toBe(12_000)
    expect(cooperation(120)).toMatchObject({ level: 3, nextAt: 180 })
    expect(cooperation(0)).toMatchObject({ level: 1, progress: 0 })
  })
})

describe('notes render user text safely', () => {
  it('escapes HTML/script in note bodies', () => {
    const evil: Note = {
      id: 'n1',
      authorId: 'L',
      kind: 'note',
      body: '<img src=x onerror="alert(1)"><script>alert(2)</script>',
      replyTo: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reactions: [],
    }
    const html = renderToStaticMarkup(
      <NoteCard
        note={evil}
        stickers={[]}
        players={[{ userId: 'L', role: 'lily', displayName: 'Professor Lily', stars: 0, notesPosted: 1, cardsRead: 0 }]}
        me="S"
        busy={false}
        onReact={() => {}}
        onSticker={() => {}}
        onEdit={async () => true}
        onDelete={() => {}}
      />,
    )
    expect(html).not.toContain('<img src=x')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })
})
