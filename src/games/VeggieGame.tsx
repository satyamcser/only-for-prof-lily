import { useEffect, useRef, useState } from 'react'
import { Dubot } from '../art/Dubot'
import { C } from '../art/palette'
import { Satyam } from '../art/People'
import { useAuth } from '../auth/AuthProvider'
import { buildVeggieRound, veggieScore, type Dish } from '../data/veggie'
import { sfx } from '../lib/sound'
import { GameShell, ResultCard, useGameSave } from './GameShell'

function Bowl({ colors }: { colors: [string, string] }) {
  return (
    <svg viewBox="0 0 80 56" width={72} height={50} aria-hidden="true">
      <ellipse cx={40} cy={22} rx={32} ry={9} fill={colors[0]} stroke={C.ink} strokeWidth={3} />
      <circle cx={30} cy={20} r={4} fill={colors[1]} stroke={C.ink} strokeWidth={1.5} />
      <circle cx={46} cy={18} r={3.4} fill={colors[1]} stroke={C.ink} strokeWidth={1.5} />
      <circle cx={52} cy={24} r={2.6} fill={colors[1]} stroke={C.ink} strokeWidth={1.2} />
      <path d="M8 22 C 10 46 70 46 72 22" fill={C.white} stroke={C.ink} strokeWidth={3} />
      <path d="M18 30 q22 8 44 0" stroke={C.blush} strokeWidth={3} fill="none" />
      <rect x={28} y={42} width={24} height={6} rx={3} fill={C.white} stroke={C.ink} strokeWidth={2.5} />
    </svg>
  )
}

export function VeggieGame() {
  const { api } = useAuth()
  const [started, setStarted] = useState(false)
  const [round, setRound] = useState(0)
  const [dishes, setDishes] = useState<Dish[]>(buildVeggieRound)
  const [verdicts, setVerdicts] = useState<Record<string, boolean>>({})
  const [last, setLast] = useState<{ id: string; ok: boolean } | null>(null)
  const [closed, setClosed] = useState(false)
  const save = useGameSave()
  const savedRound = useRef(-1)
  const answered = Object.keys(verdicts).length
  const correct = dishes.filter((d) => d.id in verdicts && verdicts[d.id] === d.safe).length
  const allJudged = answered === dishes.length
  const done = allJudged && closed

  useEffect(() => {
    if (done && savedRound.current !== round) {
      savedRound.current = round
      const score = veggieScore(correct, dishes.length)
      sfx(score >= 80 ? 'win' : 'lose')
      void save.run(() => api.recordCompletion('veggie_detective', score))
    }
  }, [done, round, correct, dishes.length, save, api])

  const judge = (d: Dish, saysSafe: boolean) => {
    if (d.id in verdicts) return
    const ok = saysSafe === d.safe
    sfx(ok ? 'good' : 'bad')
    setVerdicts((v) => ({ ...v, [d.id]: saysSafe }))
    setLast({ id: d.id, ok })
  }

  const replay = () => {
    setDishes(buildVeggieRound())
    setVerdicts({})
    setLast(null)
    setClosed(false)
    save.reset()
    setRound((r) => r + 1)
  }

  const score = veggieScore(correct, dishes.length)
  const lastWrong = last && !last.ok

  return (
    <GameShell
      game="veggie_detective"
      started={started}
      onStart={() => setStarted(true)}
      intro={
        <div className="intro-art">
          <Dubot width={120} item="magnifier" mood="detective" />
          <Satyam width={92} mood="thoughtful" />
        </div>
      }
    >
      {!done ? (
        <div className="veggie">
          <div className="veggie-hud">
            <Dubot width={70} item="magnifier" mood={lastWrong ? 'detective' : 'happy'} anim={lastWrong ? 'shake' : 'bob'} />
            <p className="feedback" aria-live="polite">
              {!last
                ? 'Case file open. Inspect each dish. Trust nothing. Especially broth.'
                : last.ok
                  ? 'Correct! The detective nods slowly.'
                  : 'Suspicious broth detected. (Or a very innocent dish was accused!)'}
            </p>
            <span className="chip">
              {answered}/{dishes.length}
            </span>
          </div>
          <div className="menu-board">
            {dishes.map((d) => {
              const judged = d.id in verdicts
              const ok = judged && verdicts[d.id] === d.safe
              return (
                <article key={d.id} className={`dish card ${judged ? (ok ? 'right' : 'wrong') : ''}`}>
                  <Bowl colors={d.colors} />
                  <div className="dish-text">
                    <h3>{d.name}</h3>
                    <p>{judged ? `${d.safe ? 'SAFE' : 'SUSPICIOUS'} — ${d.reason}` : d.description}</p>
                  </div>
                  {!judged ? (
                    <div className="dish-actions">
                      <button className="btn btn-small btn-mint" onClick={() => judge(d, true)}>
                        Safe
                      </button>
                      <button className="btn btn-small btn-rose" onClick={() => judge(d, false)}>
                        Suspicious
                      </button>
                    </div>
                  ) : (
                    <span className="verdict" aria-label={ok ? 'Correct' : 'Incorrect'}>
                      {ok ? '✓' : '✗'}
                    </span>
                  )}
                </article>
              )
            })}
          </div>
          {allJudged && (
            <button className="btn btn-primary btn-big pop-in" onClick={() => setClosed(true)} autoFocus>
              Close the case →
            </button>
          )}
          <p className="fine center">A playful game, not a dietary certification. Restaurants vary — always verify actual ingredients when ordering.</p>
        </div>
      ) : (
        <ResultCard
          stamp={score >= 80 ? 'CASE CLOSED' : 'CASE OPEN'}
          stampTone={score >= 80 ? 'mint' : 'rose'}
          title={score === 100 ? 'Master Vegetarian Detective!' : score >= 80 ? 'Vegetarian Detective, certified (in-game).' : 'The broth got away this time.'}
          lines={[
            `You judged ${correct} of ${dishes.length} dishes correctly — ${score}/100.`,
            'This vegetable soup is acting suspiciously fishy. Always verify actual ingredients when ordering.',
          ]}
          art={<Dubot width={110} item="magnifier" mood={score >= 80 ? 'proud' : 'detective'} />}
          save={save.state}
          onRetrySave={() => void save.retry()}
          onReplay={replay}
        />
      )}
    </GameShell>
  )
}
