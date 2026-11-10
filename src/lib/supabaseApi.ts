import { createClient, type RealtimeChannel } from '@supabase/supabase-js'
import type { DataApi } from './api'
import type {
  ActivityId,
  CompletionResult,
  Emoji,
  ExamResult,
  Member,
  Note,
  NoteKind,
  Role,
  SessionUser,
  VoteChoice,
  WorldState,
} from './types'

type Json = Record<string, unknown>

function redirectUrl(): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}`
}

function num(v: unknown): number {
  return typeof v === 'number' ? v : Number(v ?? 0)
}

export function mapWorld(w: Json): WorldState {
  const arr = (v: unknown) => (Array.isArray(v) ? (v as Json[]) : [])
  const vote = (w.vote ?? {}) as Json
  return {
    today: String(w.today),
    me: String(w.me),
    players: arr(w.players).map((p) => ({
      userId: String(p.user_id),
      role: p.role as Role,
      displayName: String(p.display_name),
      stars: num(p.stars),
      notesPosted: num(p.notes_posted),
      cardsRead: num(p.cards_read),
    })),
    activities: arr(w.activities).map((a) => ({
      id: a.id as ActivityId,
      title: String(a.title),
      basePoints: num(a.base_points),
      perfectBonus: num(a.perfect_bonus),
      maxScore: num(a.max_score),
      dailyLimit: num(a.daily_limit),
    })),
    stats: arr(w.stats).map((s) => ({
      userId: String(s.user_id),
      activityId: s.activity_id as ActivityId,
      plays: num(s.plays),
      bestScore: num(s.best_score),
      points: num(s.points),
      firstAt: String(s.first_at),
      perfectAt: (s.perfect_at as string | null) ?? null,
      cranialAt: (s.cranial_at as string | null) ?? null,
      awardedToday: Boolean(s.awarded_today),
    })),
    myCardReads: arr(w.my_card_reads).map(String),
    constellations: arr(w.constellations).map((c) => ({
      id: String(c.id),
      title: String(c.title),
      starCount: num(c.star_count),
      lit: arr(c.lit).map((s) => ({
        starIndex: num(s.star_index),
        litBy: String(s.lit_by),
        litOn: String(s.lit_on),
      })),
    })),
    starsLitToday: num(w.stars_lit_today),
    vote: {
      proposalId: String(vote.proposal_id ?? ''),
      title: String(vote.title ?? ''),
      myChoice: (vote.my_choice as VoteChoice | null) ?? null,
      otherChoice: (vote.other_choice as VoteChoice | null) ?? null,
    },
  }
}

function mapCompletion(r: Json): CompletionResult {
  return {
    pointsAwarded: num(r.points_awarded),
    alreadyAwarded: Boolean(r.already_awarded),
    score: num(r.score),
    starsLit: r.stars_lit === undefined ? undefined : num(r.stars_lit),
  }
}

export function createSupabaseApi(url: string, publishableKey: string): DataApi {
  const sb = createClient(url, publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // Implicit flow: the magic link works even if opened in a different
      // browser/app than the one that requested it (e.g. Gmail's in-app browser).
      flowType: 'implicit',
    },
  })

  async function uid(): Promise<string> {
    const { data } = await sb.auth.getSession()
    const id = data.session?.user.id
    if (!id) throw new Error('Your session expired. Please sign in again.')
    return id
  }

  function check<T>(res: { data: T; error: { message: string } | null }): T {
    if (res.error) throw new Error(res.error.message)
    return res.data
  }

  const api: DataApi = {
    mode: 'supabase',

    async getSessionUser(): Promise<SessionUser | null> {
      const { data, error } = await sb.auth.getSession()
      if (error) throw error
      const u = data.session?.user
      return u ? { id: u.id, email: u.email ?? null } : null
    },

    onAuthChange(cb) {
      const { data } = sb.auth.onAuthStateChange((_event, session) => {
        const u = session?.user
        cb(u ? { id: u.id, email: u.email ?? null } : null)
      })
      return () => data.subscription.unsubscribe()
    },

    async sendMagicLink(email) {
      const { error } = await sb.auth.signInWithOtp({
        email,
        // Never create accounts from the browser: the owner invites both players.
        options: { shouldCreateUser: false, emailRedirectTo: redirectUrl() },
      })
      if (error) {
        if (/signups? not allowed|not found|otp_disabled/i.test(error.message)) {
          throw new Error("This email doesn't have an invitation to the university (yet).")
        }
        throw error
      }
    },

    async verifyCode(email, code) {
      const { error } = await sb.auth.verifyOtp({ email, token: code, type: 'email' })
      if (error) throw error
    },

    async signInWithPassword(email, password) {
      const { error } = await sb.auth.signInWithPassword({ email, password })
      if (error) {
        if (/invalid login credentials/i.test(error.message)) throw new Error('That email and password don’t match. Try again, or use a sign-in link.')
        throw error
      }
    },

    async updatePassword(password) {
      if (password.length < 8) throw new Error('Please use at least 8 characters.')
      const { error } = await sb.auth.updateUser({ password })
      if (error) throw error
    },

    async signOut() {
      const { error } = await sb.auth.signOut()
      if (error) throw error
    },

    async getMembership(): Promise<Member | null> {
      const id = await uid()
      const data = check(
        await sb.from('game_players').select('user_id, role, display_name').eq('user_id', id).eq('enabled', true).maybeSingle(),
      )
      if (!data) return null
      return { userId: data.user_id, role: data.role as Role, displayName: data.display_name }
    },

    async getWorld() {
      const data = check(await sb.rpc('get_world_state'))
      return mapWorld(data as Json)
    },

    async listNotes(): Promise<Note[]> {
      const rows = check(
        await sb
          .from('shared_notes')
          .select('id, author_id, kind, body, reply_to, created_at, updated_at, note_reactions(user_id, emoji)')
          .order('created_at', { ascending: false })
          .limit(300),
      ) as Json[]
      return rows.map((r) => ({
        id: String(r.id),
        authorId: (r.author_id as string | null) ?? null,
        kind: r.kind as NoteKind,
        body: String(r.body),
        replyTo: (r.reply_to as string | null) ?? null,
        createdAt: String(r.created_at),
        updatedAt: String(r.updated_at),
        reactions: ((r.note_reactions as Json[] | null) ?? []).map((x) => ({
          userId: String(x.user_id),
          emoji: x.emoji as Emoji,
        })),
      }))
    },

    async postNote(body, kind = 'note') {
      check(await sb.from('shared_notes').insert({ body, kind }))
    },

    async postSticker(replyTo, sticker) {
      check(await sb.from('shared_notes').insert({ body: sticker, kind: 'sticker', reply_to: replyTo }))
    },

    async editNote(id, body) {
      const rows = check(await sb.from('shared_notes').update({ body }).eq('id', id).select('id'))
      if (!rows || rows.length === 0) throw new Error('You can only edit your own notes.')
    },

    async deleteNote(id) {
      const rows = check(await sb.from('shared_notes').delete().eq('id', id).select('id'))
      if (!rows || rows.length === 0) throw new Error('You can only remove your own notes.')
    },

    async deleteAllMyNotes() {
      const id = await uid()
      const rows = check(await sb.from('shared_notes').delete().eq('author_id', id).select('id'))
      return rows?.length ?? 0
    },

    async setReaction(noteId, emoji, on) {
      if (on) {
        const res = await sb.from('note_reactions').insert({ note_id: noteId, emoji })
        if (res.error && res.error.code !== '23505') throw new Error(res.error.message)
      } else {
        const id = await uid()
        check(await sb.from('note_reactions').delete().eq('note_id', noteId).eq('emoji', emoji).eq('user_id', id))
      }
    },

    async recordCompletion(activity, score) {
      const data = check(await sb.rpc('record_completion', { p_activity: activity, p_score: Math.round(score) }))
      return mapCompletion(data as Json)
    },

    async submitExam(answers): Promise<ExamResult> {
      const data = check(await sb.rpc('submit_exam', { p_answers: answers })) as Json
      return {
        ...mapCompletion(data),
        answered: num(data.answered),
        correct: num(data.correct),
        perfect: Boolean(data.perfect),
        results: ((data.results as Json[]) ?? []).map((r) => ({
          questionId: String(r.question_id),
          chosen: r.chosen === null ? null : num(r.chosen),
          correctIndex: num(r.correct_index),
          correct: r.correct === null ? null : Boolean(r.correct),
        })),
      }
    },

    async castVote(choice) {
      check(await sb.rpc('cast_vote', { p_choice: choice }))
    },

    async markCardRead(cardId) {
      check(await sb.rpc('mark_card_read', { p_card: cardId }))
    },

    async exportMyData() {
      const id = await uid()
      const [notes, reactions, completions, votes, reads] = await Promise.all([
        sb.from('shared_notes').select('id, kind, body, reply_to, created_at, updated_at').eq('author_id', id),
        sb.from('note_reactions').select('note_id, emoji, created_at').eq('user_id', id),
        sb.from('game_completions').select('activity_id, points, score, played_on, details, created_at').eq('user_id', id),
        sb.from('faculty_votes').select('proposal_id, choice, voted_on').eq('voter_id', id),
        sb.from('card_reads').select('card_id, read_at').eq('user_id', id),
      ])
      return {
        exported_at: new Date().toISOString(),
        notes: check(notes),
        reactions: check(reactions),
        game_history: check(completions),
        faculty_votes: check(votes),
        story_cards_read: check(reads),
      }
    },

    subscribe(onChange) {
      let timer: ReturnType<typeof setTimeout> | null = null
      const bump = () => {
        if (timer) clearTimeout(timer)
        timer = setTimeout(onChange, 250)
      }
      let channel: RealtimeChannel | null = sb.channel('only-for-prof-lily-world')
      for (const table of ['shared_notes', 'note_reactions', 'game_completions', 'constellation_stars']) {
        channel = channel.on('postgres_changes', { event: '*', schema: 'public', table }, bump)
      }
      channel.subscribe()
      // Polling fallback in case realtime is unavailable on the network.
      const poll = setInterval(() => {
        if (document.visibilityState === 'visible') onChange()
      }, 45_000)
      const onVisible = () => {
        if (document.visibilityState === 'visible') onChange()
      }
      document.addEventListener('visibilitychange', onVisible)
      return () => {
        clearInterval(poll)
        if (timer) clearTimeout(timer)
        document.removeEventListener('visibilitychange', onVisible)
        if (channel) void sb.removeChannel(channel)
        channel = null
      }
    },
  }
  return api
}
