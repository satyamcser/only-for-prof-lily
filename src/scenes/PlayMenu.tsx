import type { ReactNode } from 'react'
import { Dubot } from '../art/Dubot'
import { Avatar, Lily, Satyam } from '../art/People'
import { Simba, Tofu } from '../art/Pets'
import { useAuth } from '../auth/AuthProvider'
import { GAMES } from '../data/lore'
import { useShared } from '../hooks/useShared'
import { navigate } from '../lib/route'
import { awardedToday, bestScore } from '../lib/rules'
import type { GameId } from '../lib/types'

function GameArt({ id }: { id: GameId }): ReactNode {
  const { member } = useAuth()
  switch (id) {
    case 'latte_rescue':
      return (
        <>
          <Dubot width={92} item="flowerWater" mood="proud" />
          <Lily width={62} mood="facepalm" />
        </>
      )
    case 'totally_fair_exam':
      return <Lily width={76} mood="proud" />
    case 'observatory':
      return member ? <Avatar role={member.role} width={66} mood="proud" /> : null
    case 'veggie_detective':
      return (
        <>
          <Dubot width={86} item="magnifier" mood="detective" />
          <Satyam width={60} mood="thoughtful" />
        </>
      )
    case 'cafe_escape':
      return (
        <>
          <Tofu width={58} mood="mischief" />
          <Simba width={84} mood="zoom" />
        </>
      )
    case 'laundry_crisis':
      return <Dubot width={90} item="sock" mood="whisper" />
  }
}

export function PlayMenu() {
  const { world } = useShared()
  return (
    <div className="page">
      <header className="page-head">
        <h1>Play</h1>
        <p>Six mini-games. Each one earns stars once a day — replays are always free, just for fun.</p>
      </header>
      <div className="game-grid">
        {GAMES.map((g) => {
          const earned = world ? awardedToday(world, g.id) : false
          const best = world ? bestScore(world, g.id) : null
          return (
            <article key={g.id} className="game-card card" style={{ ['--accent' as string]: g.accent }}>
              <div className={`game-card-art art-${g.id}`}>
                <GameArt id={g.id} />
              </div>
              <div className="game-card-body">
                <p className="eyebrow">{g.place}</p>
                <h2>{g.title}</h2>
                <p>{g.tagline}</p>
                <div className="row gap wrap">
                  <span className={`chip ${earned ? 'chip-done' : 'chip-gold'}`}>{earned ? '✓ earned today' : '+10 ⭐ today'}</span>
                  {best !== null && <span className="chip">Best {best}</span>}
                </div>
              </div>
              <button className="btn btn-primary btn-block" onClick={() => navigate({ name: 'play', game: g.id })} aria-label={`Play ${g.title}`}>
                {earned ? 'Play again' : 'Play'}
              </button>
            </article>
          )
        })}
      </div>
    </div>
  )
}
