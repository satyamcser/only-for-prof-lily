import type {
  CompletionResult,
  Emoji,
  ExamResult,
  GameId,
  Member,
  Note,
  SessionUser,
  Sticker,
  VoteChoice,
  WorldState,
} from './types'

/**
 * Everything the UI needs from a backend. Two implementations:
 *  - supabaseApi.ts: the real, shared, RLS-protected database.
 *  - mockApi.ts: an in-memory, dev-only stand-in with two fake players.
 */
export interface DataApi {
  readonly mode: 'supabase' | 'mock'

  getSessionUser(): Promise<SessionUser | null>
  onAuthChange(cb: (user: SessionUser | null) => void): () => void
  sendMagicLink(email: string): Promise<void>
  verifyCode(email: string, code: string): Promise<void>
  signInWithPassword(email: string, password: string): Promise<void>
  updatePassword(password: string): Promise<void>
  signOut(): Promise<void>
  getMembership(): Promise<Member | null>

  getWorld(): Promise<WorldState>
  listNotes(): Promise<Note[]>
  postNote(body: string, kind?: 'note' | 'encouragement'): Promise<void>
  postSticker(replyTo: string, sticker: Sticker): Promise<void>
  editNote(id: string, body: string): Promise<void>
  deleteNote(id: string): Promise<void>
  deleteAllMyNotes(): Promise<number>
  setReaction(noteId: string, emoji: Emoji, on: boolean): Promise<void>

  recordCompletion(activity: Exclude<GameId, 'totally_fair_exam'>, score: number): Promise<CompletionResult>
  submitExam(answers: Record<string, number | null>): Promise<ExamResult>
  castVote(choice: VoteChoice): Promise<void>
  markCardRead(cardId: string): Promise<void>
  exportMyData(): Promise<unknown>

  /** Calls onChange whenever shared data may have changed (realtime/polling). */
  subscribe(onChange: () => void): () => void

  /** Mock mode only. */
  mockSignIn?(who: 'lily' | 'satyam' | 'stranger'): Promise<void>
}

const MESSAGES: Record<string, string> = {
  not_a_member: 'This tiny university is invitation-only.',
  slow_down: 'Whoa, speedy! The faculty needs a minute to file all that. Try again shortly.',
  daily_save_limit: 'That is a LOT of games today. The faculty has gone to sleep — try tomorrow.',
  note_rate_limited: 'The letterbox is full for today. DUBOT is sorting it.',
  already_voted_today: 'You already voted today. One vote per faculty member per day!',
  score_out_of_range: 'That score looks suspicious. DUBOT refused to file it.',
  activity_not_reportable: 'That activity cannot be saved from here.',
  unknown_question: 'The exam paper got mixed up. Please start a new exam.',
  answer_at_least_three: 'Answer at least three questions so the professor has something to grade.',
  sticker_needs_a_note: 'Stickers must be attached to a note.',
  unknown_card: 'Unknown story card.',
}

/** Turns any thrown value into a short, honest message for the UI. */
export function friendlyError(err: unknown): string {
  const raw =
    typeof err === 'string'
      ? err
      : err && typeof err === 'object' && 'message' in err
        ? String((err as { message: unknown }).message)
        : 'Something went wrong.'
  for (const [code, msg] of Object.entries(MESSAGES)) {
    if (raw.includes(code)) return msg
  }
  if (/Failed to fetch|NetworkError|network|fetch failed|Load failed/i.test(raw)) {
    return 'Could not reach the faculty server. Nothing was saved — check your connection and retry.'
  }
  if (/JWT|session|refresh token/i.test(raw)) {
    return 'Your session expired. Please sign in again.'
  }
  return raw.length > 160 ? raw.slice(0, 157) + '…' : raw
}
