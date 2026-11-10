// Pure, deterministic derivations from the server-verified world snapshot.
// Points/limits/grading happen in the database; this only decides what to
// *display* (cards, badges, levels) from those verified facts.
import { BADGES, COOP_LEVELS, GAMES, STORY_CARDS } from '../data/lore'
import type { ActivityId, ActivityStat, ConstellationState, GameId, PlayerSummary, Role, WorldState } from './types'

export const WON_PER_STAR = 100
export const COUPON_WON = 11_000 // two iced vanilla lattes, roughly
export const COFFEE_FUNDING_CARD_WON = 3_000

export const sharedStars = (w: WorldState) => w.players.reduce((s, p) => s + p.stars, 0)
export const coins = (w: WorldState) => sharedStars(w) * WON_PER_STAR

export function formatWon(won: number): string {
  return `₩${won.toLocaleString('en-US')}`
}

export function playerByRole(w: WorldState, role: Role): PlayerSummary | undefined {
  return w.players.find((p) => p.role === role)
}

export function me(w: WorldState): PlayerSummary | undefined {
  return w.players.find((p) => p.userId === w.me)
}

export function partner(w: WorldState): PlayerSummary | undefined {
  return w.players.find((p) => p.userId !== w.me)
}

export function cooperation(stars: number) {
  let idx = 0
  COOP_LEVELS.forEach((lvl, i) => {
    if (stars >= lvl.min) idx = i
  })
  const cur = COOP_LEVELS[idx]
  const next = COOP_LEVELS[idx + 1]
  const progress = next ? (stars - cur.min) / (next.min - cur.min) : 1
  return { level: idx + 1, name: cur.name, nextAt: next?.min ?? null, progress: Math.max(0, Math.min(1, progress)) }
}

function statsFor(w: WorldState, activity: ActivityId, userId?: string): ActivityStat[] {
  return w.stats.filter((s) => s.activityId === activity && (!userId || s.userId === userId))
}

function earliest(dates: (string | null | undefined)[]): string | null {
  const valid = dates.filter((d): d is string => Boolean(d)).sort()
  return valid[0] ?? null
}

function latest(dates: (string | null | undefined)[]): string | null {
  const valid = dates.filter((d): d is string => Boolean(d)).sort()
  return valid[valid.length - 1] ?? null
}

export function firstPlayed(w: WorldState, activity: ActivityId, userId?: string): string | null {
  return earliest(statsFor(w, activity, userId).map((s) => s.firstAt))
}

export function isComplete(c: ConstellationState) {
  return c.lit.length >= c.starCount
}

export function currentConstellation(w: WorldState): ConstellationState | null {
  return w.constellations.find((c) => !isComplete(c)) ?? null
}

export interface CardStatus {
  id: string
  unlocked: boolean
  unlockedAt: string | null
  read: boolean
}

/** Story cards are shared by both players. */
export function deriveCards(w: WorldState): CardStatus[] {
  const firstConstellation = w.constellations[0]
  const both = w.players.length === 2 && w.players.every((p) => w.stats.some((s) => s.userId === p.userId && s.activityId !== 'letterbox'))
  const unlocks: Record<string, string | null | false> = {
    flower_water_incident: firstPlayed(w, 'latte_rescue') ?? false,
    cranial_nerves_strike_back: firstPlayed(w, 'totally_fair_exam') ?? false,
    korean_homework_certificate: earliest(statsFor(w, 'totally_fair_exam').map((s) => s.perfectAt)) ?? false,
    silvermoon_zero_quests: firstPlayed(w, 'observatory') ?? false,
    tofu_snack_request: firstPlayed(w, 'cafe_escape') ?? false,
    simba_innocence_hearing: firstPlayed(w, 'laundry_crisis') ?? false,
    suspiciously_fishy_soup: firstPlayed(w, 'veggie_detective') ?? false,
    freezing_wind_report:
      firstConstellation && isComplete(firstConstellation) ? latest(firstConstellation.lit.map((s) => s.litOn)) : false,
    emergency_coffee_funding:
      firstPlayed(w, 'latte_rescue') && firstPlayed(w, 'cafe_escape')
        ? latest([firstPlayed(w, 'latte_rescue'), firstPlayed(w, 'cafe_escape')])
        : false,
    remote_faculty_meeting: both
      ? latest(
          w.players.map((p) =>
            earliest(w.stats.filter((s) => s.userId === p.userId && s.activityId !== 'letterbox').map((s) => s.firstAt)),
          ),
        )
      : false,
    ordinary_days: firstPlayed(w, 'letterbox') ?? false,
  }
  return STORY_CARDS.map((c) => {
    const u = unlocks[c.id]
    return {
      id: c.id,
      unlocked: u !== false && u !== undefined,
      unlockedAt: u === false || u === undefined ? null : u,
      read: w.myCardReads.includes(c.id),
    }
  })
}

export interface BadgeStatus {
  id: string
  earned: boolean
  earnedAt: string | null
}

export function deriveBadges(w: WorldState, userId: string): BadgeStatus[] {
  const player = w.players.find((p) => p.userId === userId)
  const own = (a: ActivityId) => statsFor(w, a, userId)
  const best = (a: ActivityId) => Math.max(0, ...own(a).map((s) => s.bestScore))
  const rules: Record<string, [boolean, string | null]> = {
    flower_water_survivor: [own('latte_rescue').length > 0, firstPlayed(w, 'latte_rescue', userId)],
    honorary_english_teacher: [(player?.notesPosted ?? 0) >= 3, null],
    korean_homework_100: [own('totally_fair_exam').some((s) => s.perfectAt), earliest(own('totally_fair_exam').map((s) => s.perfectAt))],
    sock_crime_investigator: [own('cafe_escape').length > 0, firstPlayed(w, 'cafe_escape', userId)],
    cranial_nerve_survivor: [w.stats.some((s) => s.userId === userId && s.cranialAt), earliest(w.stats.filter((s) => s.userId === userId).map((s) => s.cranialAt))],
    observatory_dreamer: [own('observatory').length > 0, firstPlayed(w, 'observatory', userId)],
    vegetarian_detective: [best('veggie_detective') >= 80, null],
    folding_pioneer: [own('laundry_crisis').length > 0, firstPlayed(w, 'laundry_crisis', userId)],
    cafe_funding_approved: [coins(w) >= COUPON_WON, null],
    no_peer_review_required: [(player?.cardsRead ?? 0) >= 3, null],
  }
  return BADGES.map((b) => {
    const [earned, at] = rules[b.id] ?? [false, null]
    return { id: b.id, earned, earnedAt: earned ? at : null }
  })
}

export function awardedToday(w: WorldState, activity: ActivityId): boolean {
  return w.stats.some((s) => s.userId === w.me && s.activityId === activity && s.awardedToday)
}

export function bestScore(w: WorldState, activity: ActivityId, userId = w.me): number | null {
  const s = w.stats.find((x) => x.userId === userId && x.activityId === activity)
  return s ? s.bestScore : null
}

export interface TimelineEvent {
  at: string
  text: string
  kind: 'card' | 'first' | 'constellation'
}

export function timeline(w: WorldState): TimelineEvent[] {
  const events: TimelineEvent[] = []
  for (const c of deriveCards(w)) {
    if (c.unlocked && c.unlockedAt) {
      const def = STORY_CARDS.find((d) => d.id === c.id)
      events.push({ at: c.unlockedAt, text: `Story card unlocked: ${def?.title ?? c.id}`, kind: 'card' })
    }
  }
  for (const c of w.constellations) {
    if (isComplete(c)) {
      const at = latest(c.lit.map((s) => s.litOn))
      if (at) events.push({ at, text: `Constellation completed together: ${c.title}`, kind: 'constellation' })
    }
  }
  return events.sort((a, b) => (a.at < b.at ? 1 : -1))
}

export interface HeadToHead {
  leader: PlayerSummary | null // null = tied
  margin: number
  /** userId holding the strictly higher best score per game (null = tie / unplayed). */
  gameLeaders: Record<GameId, string | null>
  gamesLed: Record<string, number>
}

/** Friendly competition: who has more stars, and who holds each game's best score. */
export function headToHead(w: WorldState): HeadToHead {
  const [a, b] = w.players
  const gameLeaders = {} as Record<GameId, string | null>
  const gamesLed: Record<string, number> = Object.fromEntries(w.players.map((p) => [p.userId, 0]))
  for (const g of GAMES) {
    const best = (uid?: string) => (uid ? w.stats.find((s) => s.userId === uid && s.activityId === g.id)?.bestScore : undefined)
    const sa = best(a?.userId)
    const sb = best(b?.userId)
    let lead: string | null = null
    if (sa !== undefined && (sb === undefined || sa > sb)) lead = a.userId
    else if (sb !== undefined && (sa === undefined || sb > sa)) lead = b.userId
    gameLeaders[g.id] = lead
    if (lead) gamesLed[lead] = (gamesLed[lead] ?? 0) + 1
  }
  if (!a || !b) return { leader: a ?? null, margin: a?.stars ?? 0, gameLeaders, gamesLed }
  const leader = a.stars === b.stars ? null : a.stars > b.stars ? a : b
  return { leader, margin: Math.abs(a.stars - b.stars), gameLeaders, gamesLed }
}
