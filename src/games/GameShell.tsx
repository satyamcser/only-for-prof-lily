import { useCallback, useRef, useState, type ReactNode } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { Stamp } from '../components/ui'
import { gameMeta } from '../data/lore'
import { useShared } from '../hooks/useShared'
import { useUi } from '../hooks/useUi'
import { friendlyError } from '../lib/api'
import { navigate } from '../lib/route'
import { awardedToday, bestScore } from '../lib/rules'
import { sfx } from '../lib/sound'
import type { CompletionResult, GameId } from '../lib/types'

export type SaveState<R extends CompletionResult = CompletionResult> =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'saved'; result: R }
  | { status: 'error'; error: string }

/** Saves a finished round through the server RPC and refreshes shared state. */
export function useGameSave<R extends CompletionResult = CompletionResult>() {
  const { refresh } = useShared()
  const { say } = useUi()
  const [state, setState] = useState<SaveState<R>>({ status: 'idle' })
  const last = useRef<(() => Promise<R>) | null>(null)

  const run = useCallback(
    async (fn: () => Promise<R>): Promise<R | null> => {
      last.current = fn
      setState({ status: 'saving' })
      try {
        const result = await fn()
        setState({ status: 'saved', result })
        if (result.pointsAwarded > 0) say(`+${result.pointsAwarded} ⭐ saved to the faculty records!`)
        void refresh()
        return result
      } catch (e) {
        setState({ status: 'error', error: friendlyError(e) })
        return null
      }
    },
    [refresh, say],
  )
  const retry = useCallback(() => (last.current ? run(last.current) : Promise.resolve(null)), [run])
  const reset = useCallback(() => setState({ status: 'idle' }), [])
  return { state, run, retry, reset }
}

export function SaveBanner({ state, onRetry }: { state: SaveState; onRetry: () => void }) {
  if (state.status === 'idle') return null
  if (state.status === 'saving') return <p className="save-banner saving">Filing your result with the faculty…</p>
  if (state.status === 'error')
    return (
      <div className="save-banner error" role="alert">
        <p>
          <strong>Not saved.</strong> {state.error}
        </p>
        <button className="btn btn-small" onClick={onRetry}>
          Retry save
        </button>
      </div>
    )
  const r = state.result
  return (
    <p className="save-banner saved">
      {r.pointsAwarded > 0
        ? `+${r.pointsAwarded} ⭐ saved! Shared progress updated for both of you.`
        : r.alreadyAwarded
          ? 'Saved. Today’s stars for this game were already earned — this round was purely for glory.'
          : 'Saved.'}
    </p>
  )
}

export function GameShell({
  game,
  started,
  onStart,
  intro,
  children,
}: {
  game: GameId
  started: boolean
  onStart: () => void
  intro?: ReactNode
  children: ReactNode
}) {
  const meta = gameMeta(game)
  const { world } = useShared()
  const { member } = useAuth()
  const earned = world ? awardedToday(world, game) : false
  const best = world ? bestScore(world, game) : null
  const act = world?.activities.find((a) => a.id === game)
  return (
    <section className={`game game-${game}`} aria-labelledby="game-title">
      <header className="game-head">
        <button className="btn btn-ghost btn-small" onClick={() => navigate({ name: 'play' })} aria-label="Exit to the games list">
          ← Games
        </button>
        <div className="game-head-title">
          <p className="eyebrow">{meta.place}</p>
          <h1 id="game-title">{meta.title}</h1>
        </div>
        <span className={`chip ${earned ? 'chip-done' : 'chip-gold'}`}>
          {earned ? '✓ Stars earned today' : `+${act?.basePoints ?? 10} ⭐ today`}
        </span>
      </header>
      {!started ? (
        <div className="game-intro card">
          {intro}
          <p className="howto">{meta.howTo}</p>
          <p className="fine">
            {earned
              ? 'You already earned today’s stars here. Replays are saved for fun, without extra points.'
              : `Finish a round to earn ${act?.basePoints ?? 10} ⭐ for ${member?.displayName ?? 'you'} (once per day).`}
            {best !== null && ` Personal best: ${best}.`}
          </p>
          <button
            className="btn btn-primary btn-big"
            onClick={() => {
              sfx('pop')
              onStart()
            }}
            autoFocus
          >
            Start
          </button>
        </div>
      ) : (
        children
      )}
    </section>
  )
}

export function ResultCard({
  stamp,
  stampTone = 'rose',
  title,
  lines,
  art,
  save,
  onRetrySave,
  onReplay,
  children,
}: {
  stamp: string
  stampTone?: 'rose' | 'mint' | 'gold' | 'ink'
  title: string
  lines: string[]
  art?: ReactNode
  save: SaveState
  onRetrySave: () => void
  onReplay: () => void
  children?: ReactNode
}) {
  return (
    <div className="result card pop-in" role="region" aria-label="Round result">
      <div className="result-art">
        {art}
        <Stamp text={stamp} tone={stampTone} />
      </div>
      <h2>{title}</h2>
      {lines.map((l, i) => (
        <p key={i}>{l}</p>
      ))}
      {children}
      <SaveBanner state={save} onRetry={onRetrySave} />
      <div className="row gap">
        <button className="btn btn-primary" onClick={onReplay} disabled={save.status === 'saving'}>
          Play again
        </button>
        <button className="btn" onClick={() => navigate({ name: 'campus' })}>
          Back to campus
        </button>
      </div>
    </div>
  )
}
