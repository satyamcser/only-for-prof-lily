// ⚠️ DEVELOPMENT-ONLY MOCK BACKEND ⚠️
// In-memory, two fake players, nothing is shared or persisted (a refresh wipes it).
// It mirrors the database rules in supabase/migrations so the UI can be tested
// without Supabase. It is only bundled when import.meta.env.DEV is true or
// VITE_DEMO_MODE=true (see lib/backend.ts).
import type { DataApi } from './api'
import type {
  ActivityDef,
  ActivityId,
  CompletionResult,
  Emoji,
  ExamResult,
  Note,
  Role,
  SessionUser,
  Sticker,
  VoteChoice,
  WorldState,
} from './types'

export const MOCK_IDS = {
  lily: '00000000-0000-4000-8000-00000000011a',
  satyam: '00000000-0000-4000-8000-0000000005a7',
  stranger: '00000000-0000-4000-8000-0000000000ff',
} as const

/** Mirror of app_private.exam_answer_key (a test keeps them in sync). */
export const MOCK_EXAM_KEY: Record<string, { correct: number; optional: boolean }> = {
  q_sugohaesseoyo: { correct: 0, optional: false },
  q_forbidden: { correct: 2, optional: false },
  q_sock_thief: { correct: 1, optional: false },
  q_hard_day: { correct: 1, optional: false },
  q_neural: { correct: 3, optional: false },
  q_budget: { correct: 0, optional: false },
  q_regulation: { correct: 2, optional: false },
  q_kaist: { correct: 1, optional: false },
  q_two_seas: { correct: 0, optional: false },
  q_thank_you: { correct: 2, optional: false },
  q_delicious: { correct: 3, optional: false },
  q_fansipan: { correct: 1, optional: false },
  q_observatory: { correct: 0, optional: false },
  q_defendant: { correct: 2, optional: false },
  q_cameras: { correct: 3, optional: false },
  q_fishy_soup: { correct: 1, optional: false },
  c_olfactory: { correct: 2, optional: true },
  c_optic: { correct: 0, optional: true },
  c_vagus: { correct: 3, optional: true },
  c_hypoglossal: { correct: 1, optional: true },
  c_vestibulo: { correct: 2, optional: true },
}

const ACTIVITIES: (ActivityDef & { reportable: boolean })[] = [
  { id: 'latte_rescue', title: 'Latte or Flower?', basePoints: 10, perfectBonus: 0, maxScore: 100, dailyLimit: 1, reportable: true },
  { id: 'laundry_crisis', title: 'The Great Laundry Crisis', basePoints: 10, perfectBonus: 0, maxScore: 100, dailyLimit: 1, reportable: true },
  { id: 'totally_fair_exam', title: "Professor Lily's Totally Fair Exam", basePoints: 10, perfectBonus: 5, maxScore: 100, dailyLimit: 1, reportable: false },
  { id: 'observatory', title: 'Silvermoon Observatory', basePoints: 10, perfectBonus: 0, maxScore: 5, dailyLimit: 1, reportable: true },
  { id: 'veggie_detective', title: 'Vegetarian Ingredient Detective', basePoints: 10, perfectBonus: 0, maxScore: 100, dailyLimit: 1, reportable: true },
  { id: 'cafe_escape', title: 'Tofu & Simba: The Great Café Escape', basePoints: 10, perfectBonus: 0, maxScore: 300, dailyLimit: 1, reportable: true },
  { id: 'letterbox', title: 'Letterbox note', basePoints: 3, perfectBonus: 0, maxScore: 1, dailyLimit: 1, reportable: false },
]

const PROPOSALS = [
  ['p_flower_friday', 'Allow DUBOT one (1) flower on Fridays — strictly outside the latte.'],
  ['p_tofu_dean', 'Appoint Tofu as Dean of Snacks (unpaid, but with treats).'],
  ['p_simba_amnesty', 'Grant Simba amnesty for all past sock relocations.'],
  ['p_budget', 'Raise the coffee budget from ₩0 to ₩0.5.'],
  ['p_lights_on', 'Mandatory lights-on period after any horror movie.'],
  ['p_letter_length', 'Cap letters at the length of one (1) doctoral dissertation.'],
  ['p_laundry', 'Declare laundry folding an official humanitarian research field.'],
  ['p_cv_closed', 'Keep the Computer Vision Department closed for selfies. Forever.'],
  ['p_no_spoilers', 'Ban spoilers about the ending of any space movie with a dramatic organ.'],
  ['p_nap_policy', 'A nap is a valid response to any assignment deadline.'],
] as const

const CONSTELLATIONS = [
  ['flower_water_nebula', 'The Flower Water Nebula'],
  ['tofu_minor', 'Tofu Minor'],
  ['simba_major', 'Simba Major'],
  ['organ_chord_cluster', 'The Dramatic Organ Chord Cluster'],
  ['twelve_nerves', 'The Twelve-Nerve Crown'],
] as const

const CARD_IDS = [
  'flower_water_incident', 'cranial_nerves_strike_back', 'korean_homework_certificate',
  'silvermoon_zero_quests', 'tofu_snack_request', 'simba_innocence_hearing',
  'freezing_wind_report', 'emergency_coffee_funding', 'suspiciously_fishy_soup',
  'remote_faculty_meeting', 'ordinary_days',
]

interface Completion {
  userId: string
  activityId: ActivityId
  points: number
  score: number
  playedOn: string
  details: Record<string, unknown>
  createdAt: string
}

export function seoulToday(d = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}

function todaysProposal(today: string): (typeof PROPOSALS)[number] {
  const days = Math.abs(Math.round((Date.parse(today) - Date.parse('2026-01-01')) / 86_400_000))
  return PROPOSALS[days % PROPOSALS.length]
}

const wait = (ms = 120) => new Promise((r) => setTimeout(r, ms))
let seq = 0
const uuid = () => `mock-${Date.now().toString(36)}-${(seq++).toString(36)}`

export function createMockApi(): DataApi {
  const players: { userId: string; role: Role; displayName: string }[] = [
    { userId: MOCK_IDS.lily, role: 'lily', displayName: 'Professor Lily' },
    { userId: MOCK_IDS.satyam, role: 'satyam', displayName: 'Researcher Satyam' },
  ]
  const now = () => new Date().toISOString()
  const notes: Note[] = [
    'Professor Lily, DUBOT has been caught watering the coffee machine again. — Faculty notice',
    "Reminder: 오늘도 수고했어요. Even when the assignment isn't finished. 🤍",
    'Emergency budget hearing: 2 iced vanilla lattes, 0 approved funds.',
    'Tofu and Simba deny all allegations.',
  ].map((body, i) => ({
    id: uuid(),
    authorId: null,
    kind: 'faculty' as const,
    body,
    replyTo: null,
    createdAt: new Date(Date.now() - (i + 1) * 60_000).toISOString(),
    updatedAt: new Date(Date.now() - (i + 1) * 60_000).toISOString(),
    reactions: [],
  }))
  const completions: Completion[] = []
  const votes: { proposalId: string; voterId: string; choice: VoteChoice; votedOn: string }[] = []
  const stars: { constellationId: string; starIndex: number; litBy: string; litOn: string }[] = []
  const cardReads: { userId: string; cardId: string }[] = []

  let session: SessionUser | null = null
  const authListeners = new Set<(u: SessionUser | null) => void>()
  const changeListeners = new Set<() => void>()
  const changed = () => changeListeners.forEach((l) => setTimeout(l, 50))

  function requireMember(): string {
    if (!session) throw new Error('Your session expired. Please sign in again.')
    if (!players.some((p) => p.userId === session!.id)) throw new Error('not_a_member')
    return session.id
  }

  function award(userId: string, activityId: ActivityId, score: number, details: Record<string, unknown>, recordReplay: boolean): CompletionResult {
    const act = ACTIVITIES.find((a) => a.id === activityId)
    if (!act) throw new Error('unknown_activity')
    if (!Number.isInteger(score) || score < 0 || score > act.maxScore) throw new Error('score_out_of_range')
    const today = seoulToday()
    if (recordReplay) {
      const recent = completions.filter((c) => c.userId === userId && Date.now() - Date.parse(c.createdAt) < 60_000).length
      if (recent >= 12) throw new Error('slow_down')
    }
    const already = completions.some((c) => c.userId === userId && c.activityId === activityId && c.playedOn === today && c.points > 0)
    const points = already || act.dailyLimit === 0 ? 0 : act.basePoints + (details.perfect ? act.perfectBonus : 0)
    if (points > 0 || recordReplay) {
      completions.push({ userId, activityId, points, score, playedOn: today, details, createdAt: now() })
    }
    return { pointsAwarded: points, alreadyAwarded: already, score }
  }

  function lightStars(userId: string, requested: number): number {
    const today = seoulToday()
    const allowance = Math.max(0, Math.min(requested, 3 - stars.filter((s) => s.litBy === userId && s.litOn === today).length))
    let lit = 0
    while (lit < allowance) {
      const c = CONSTELLATIONS.find(([id]) => stars.filter((s) => s.constellationId === id).length < 5)
      if (!c) break
      const taken = new Set(stars.filter((s) => s.constellationId === c[0]).map((s) => s.starIndex))
      const idx = [0, 1, 2, 3, 4].find((i) => !taken.has(i))!
      stars.push({ constellationId: c[0], starIndex: idx, litBy: userId, litOn: today })
      lit++
    }
    return lit
  }

  function addNote(authorId: string, body: string, kind: Note['kind'], replyTo: string | null) {
    const trimmed = body.trim()
    if (trimmed.length < 1 || body.length > 280) throw new Error('Notes must be 1–280 characters.')
    const recent = notes.filter((n) => n.authorId === authorId && Date.now() - Date.parse(n.createdAt) < 86_400_000).length
    if (recent >= 40) throw new Error('note_rate_limited')
    notes.unshift({ id: uuid(), authorId, kind, body: trimmed, replyTo, createdAt: now(), updatedAt: now(), reactions: [] })
    if (kind === 'note' || kind === 'encouragement') award(authorId, 'letterbox', 1, {}, false)
  }

  const api: DataApi = {
    mode: 'mock',

    async getSessionUser() {
      await wait(60)
      return session
    },
    onAuthChange(cb) {
      authListeners.add(cb)
      return () => authListeners.delete(cb)
    },
    async sendMagicLink() {
      await wait()
      throw new Error('Mock mode has no email. Use the mock sign-in buttons below.')
    },
    async verifyCode() {
      await wait()
      throw new Error('Mock mode has no email codes. Use the mock sign-in buttons below.')
    },
    async signInWithPassword() {
      await wait()
      throw new Error('Use the quick-entry buttons in local preview.')
    },
    async updatePassword() {
      await wait()
    },
    async mockSignIn(who) {
      await wait()
      session = { id: MOCK_IDS[who], email: `${who}@mock.invalid` }
      authListeners.forEach((l) => l(session))
    },
    async signOut() {
      await wait(60)
      session = null
      authListeners.forEach((l) => l(null))
    },
    async getMembership() {
      await wait(60)
      const p = players.find((x) => x.userId === session?.id)
      return p ? { ...p } : null
    },

    async getWorld(): Promise<WorldState> {
      await wait(80)
      const uid = requireMember()
      const today = seoulToday()
      const [pid, title] = todaysProposal(today)
      const my = votes.find((v) => v.proposalId === pid && v.voterId === uid && v.votedOn === today)
      const other = my ? votes.find((v) => v.proposalId === pid && v.voterId !== uid && v.votedOn === today) : undefined
      const groups = new Map<string, Completion[]>()
      for (const c of completions) {
        const k = `${c.userId}|${c.activityId}`
        groups.set(k, [...(groups.get(k) ?? []), c])
      }
      return {
        today,
        me: uid,
        players: players.map((p) => ({
          ...p,
          stars: completions.filter((c) => c.userId === p.userId).reduce((s, c) => s + c.points, 0),
          notesPosted: notes.filter((n) => n.authorId === p.userId && (n.kind === 'note' || n.kind === 'encouragement')).length,
          cardsRead: cardReads.filter((r) => r.userId === p.userId).length,
        })),
        activities: ACTIVITIES.map(({ reportable: _r, ...a }) => a),
        stats: [...groups.values()].map((list) => ({
          userId: list[0].userId,
          activityId: list[0].activityId,
          plays: list.length,
          bestScore: Math.max(...list.map((c) => c.score)),
          points: list.reduce((s, c) => s + c.points, 0),
          firstAt: list.map((c) => c.createdAt).sort()[0],
          perfectAt: list.filter((c) => c.details.perfect === true).map((c) => c.createdAt).sort()[0] ?? null,
          cranialAt: list.filter((c) => c.details.cranial === 'correct').map((c) => c.createdAt).sort()[0] ?? null,
          awardedToday: list.some((c) => c.points > 0 && c.playedOn === today),
        })),
        myCardReads: cardReads.filter((r) => r.userId === uid).map((r) => r.cardId),
        constellations: CONSTELLATIONS.map(([id, t]) => ({
          id,
          title: t,
          starCount: 5,
          lit: stars
            .filter((s) => s.constellationId === id)
            .sort((a, b) => a.starIndex - b.starIndex)
            .map((s) => ({ starIndex: s.starIndex, litBy: s.litBy, litOn: s.litOn })),
        })),
        starsLitToday: stars.filter((s) => s.litBy === uid && s.litOn === today).length,
        vote: { proposalId: pid, title, myChoice: my?.choice ?? null, otherChoice: other?.choice ?? null },
      }
    },

    async listNotes() {
      await wait(80)
      requireMember()
      return notes.map((n) => ({ ...n, reactions: [...n.reactions] }))
    },
    async postNote(body, kind = 'note') {
      await wait()
      addNote(requireMember(), body, kind, null)
      changed()
    },
    async postSticker(replyTo, sticker: Sticker) {
      await wait()
      const uid = requireMember()
      const parent = notes.find((n) => n.id === replyTo)
      if (!parent || parent.kind === 'sticker') throw new Error('sticker_needs_a_note')
      addNote(uid, sticker, 'sticker', replyTo)
      changed()
    },
    async editNote(id, body) {
      await wait()
      const uid = requireMember()
      const n = notes.find((x) => x.id === id)
      if (!n || n.authorId !== uid) throw new Error('You can only edit your own notes.')
      if (body.trim().length < 1 || body.length > 280) throw new Error('Notes must be 1–280 characters.')
      n.body = body.trim()
      n.updatedAt = now()
      changed()
    },
    async deleteNote(id) {
      await wait()
      const uid = requireMember()
      const n = notes.find((x) => x.id === id)
      if (!n || n.authorId !== uid) throw new Error('You can only remove your own notes.')
      for (let i = notes.length - 1; i >= 0; i--) {
        if (notes[i].id === id || notes[i].replyTo === id) notes.splice(i, 1)
      }
      changed()
    },
    async deleteAllMyNotes() {
      await wait()
      const uid = requireMember()
      const mine = new Set(notes.filter((n) => n.authorId === uid).map((n) => n.id))
      for (let i = notes.length - 1; i >= 0; i--) {
        if (mine.has(notes[i].id) || (notes[i].replyTo && mine.has(notes[i].replyTo!))) notes.splice(i, 1)
      }
      changed()
      return mine.size
    },
    async setReaction(noteId, emoji: Emoji, on) {
      await wait(60)
      const uid = requireMember()
      const n = notes.find((x) => x.id === noteId)
      if (!n) throw new Error('Note not found.')
      n.reactions = n.reactions.filter((r) => !(r.userId === uid && r.emoji === emoji))
      if (on) n.reactions.push({ userId: uid, emoji })
      changed()
    },

    async recordCompletion(activity, score) {
      await wait()
      const uid = requireMember()
      const act = ACTIVITIES.find((a) => a.id === activity)
      if (!act?.reportable) throw new Error('activity_not_reportable')
      const res = award(uid, activity, Math.round(score), {}, true)
      if (activity === 'observatory') res.starsLit = lightStars(uid, Math.round(score))
      changed()
      return res
    },

    async submitExam(answers): Promise<ExamResult> {
      await wait(400)
      const uid = requireMember()
      const entries = Object.entries(answers)
      if (entries.length < 3 || entries.length > 8) throw new Error('bad_answers')
      let answered = 0
      let correct = 0
      let cranial = 'none'
      const results = entries.map(([questionId, chosen]) => {
        const key = MOCK_EXAM_KEY[questionId]
        if (!key) throw new Error('unknown_question')
        if (chosen === null) {
          if (!key.optional) throw new Error('only_bonus_questions_can_be_skipped')
          if (cranial === 'none') cranial = 'skipped'
          return { questionId, chosen: null, correctIndex: key.correct, correct: null }
        }
        answered++
        const ok = chosen === key.correct
        if (ok) correct++
        if (key.optional) cranial = ok ? 'correct' : 'wrong'
        return { questionId, chosen, correctIndex: key.correct, correct: ok }
      })
      if (answered < 3) throw new Error('answer_at_least_three')
      const score = Math.round((100 * correct) / answered)
      const perfect = correct === answered && answered >= 4
      const res = award(uid, 'totally_fair_exam', score, { answered, correct, cranial, perfect }, true)
      changed()
      return { ...res, results, answered, correct, perfect }
    },

    async castVote(choice) {
      await wait()
      const uid = requireMember()
      const today = seoulToday()
      const [pid] = todaysProposal(today)
      if (votes.some((v) => v.proposalId === pid && v.voterId === uid && v.votedOn === today)) throw new Error('already_voted_today')
      votes.push({ proposalId: pid, voterId: uid, choice, votedOn: today })
      changed()
    },

    async markCardRead(cardId) {
      await wait(60)
      const uid = requireMember()
      if (!CARD_IDS.includes(cardId)) throw new Error('unknown_card')
      if (!cardReads.some((r) => r.userId === uid && r.cardId === cardId)) cardReads.push({ userId: uid, cardId })
      changed()
    },

    async exportMyData() {
      await wait()
      const uid = requireMember()
      return {
        exported_at: now(),
        mock_mode: true,
        notes: notes.filter((n) => n.authorId === uid),
        game_history: completions.filter((c) => c.userId === uid),
        faculty_votes: votes.filter((v) => v.voterId === uid),
        story_cards_read: cardReads.filter((r) => r.userId === uid),
      }
    },

    subscribe(onChange) {
      changeListeners.add(onChange)
      return () => changeListeners.delete(onChange)
    },
  }
  return api
}
