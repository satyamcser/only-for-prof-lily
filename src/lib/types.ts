export type Role = 'satyam' | 'lily'

export type GameId =
  | 'latte_rescue'
  | 'laundry_crisis'
  | 'totally_fair_exam'
  | 'observatory'
  | 'veggie_detective'
  | 'cafe_escape'

export type ActivityId = GameId | 'letterbox'

export const REACTION_EMOJI = ['🤍', '🌸', '😂', '⭐'] as const
export type Emoji = (typeof REACTION_EMOJI)[number]

export const STICKERS = ['🌸', '🐾', '☕', '⭐'] as const
export type Sticker = (typeof STICKERS)[number]

export type NoteKind = 'note' | 'encouragement' | 'sticker' | 'faculty'
export type VoteChoice = 'approve' | 'reject'

export interface SessionUser {
  id: string
  email: string | null
}

export interface Member {
  userId: string
  role: Role
  displayName: string
}

export interface PlayerSummary extends Member {
  stars: number
  notesPosted: number
  cardsRead: number
}

export interface ActivityDef {
  id: ActivityId
  title: string
  basePoints: number
  perfectBonus: number
  maxScore: number
  dailyLimit: number
}

export interface ActivityStat {
  userId: string
  activityId: ActivityId
  plays: number
  bestScore: number
  points: number
  firstAt: string
  perfectAt: string | null
  cranialAt: string | null
  awardedToday: boolean
}

export interface LitStar {
  starIndex: number
  litBy: string
  litOn: string
}

export interface ConstellationState {
  id: string
  title: string
  starCount: number
  lit: LitStar[]
}

export interface VoteState {
  proposalId: string
  title: string
  myChoice: VoteChoice | null
  otherChoice: VoteChoice | null
}

export interface WorldState {
  today: string
  me: string
  players: PlayerSummary[]
  activities: ActivityDef[]
  stats: ActivityStat[]
  myCardReads: string[]
  constellations: ConstellationState[]
  starsLitToday: number
  vote: VoteState
}

export interface Reaction {
  userId: string
  emoji: Emoji
}

export interface Note {
  id: string
  authorId: string | null
  kind: NoteKind
  body: string
  replyTo: string | null
  createdAt: string
  updatedAt: string
  reactions: Reaction[]
}

export interface CompletionResult {
  pointsAwarded: number
  alreadyAwarded: boolean
  score: number
  starsLit?: number
}

export interface ExamQuestionResult {
  questionId: string
  chosen: number | null
  correctIndex: number
  correct: boolean | null
}

export interface ExamResult extends CompletionResult {
  results: ExamQuestionResult[]
  answered: number
  correct: number
  perfect: boolean
}
