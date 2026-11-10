import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Dubot } from '../art/Dubot'
import { C } from '../art/palette'
import { Lily, Satyam } from '../art/People'
import { Tofu } from '../art/Pets'
import { Flower, Sock } from '../art/Props'
import { useAuth } from '../auth/AuthProvider'
import { Meter } from '../components/ui'
import { shuffle } from '../data/exam'
import { sfx } from '../lib/sound'
import { GameShell, ResultCard, useGameSave } from './GameShell'
import {
  ALL_INGREDIENTS,
  INGREDIENT_LABEL,
  LATTE_SECONDS,
  MAX_MISTAKES,
  WRONG_QUIP,
  addIngredient,
  latteScore,
  newLatte,
  timeUp,
  type Ingredient,
} from './logic/latte'

function IngredientIcon({ ing }: { ing: Ingredient }) {
  const s = { stroke: C.ink, strokeWidth: 3, strokeLinejoin: 'round' as const }
  return (
    <svg viewBox="0 0 48 48" width={40} height={40} aria-hidden="true">
      {ing === 'cup' && <path d="M12 8 H36 L32 42 H16 Z" fill={C.white} fillOpacity={0.7} {...s} />}
      {ing === 'ice' && (
        <g>
          <rect x={8} y={18} width={18} height={18} rx={4} fill="#E8F8FF" {...s} />
          <rect x={22} y={10} width={18} height={18} rx={4} fill="#E8F8FF" {...s} />
        </g>
      )}
      {ing === 'espresso' && (
        <g>
          <path d="M12 16 H34 L31 40 H15 Z" fill={C.coffee} {...s} />
          <path d="M34 22 q8 0 6 8 q-2 5 -8 4" fill="none" {...s} />
          <path d="M18 10 q-3 -4 0 -7 M26 10 q-3 -4 0 -7" fill="none" stroke={C.ink} strokeWidth={2} strokeLinecap="round" />
        </g>
      )}
      {ing === 'milk' && (
        <g>
          <path d="M14 16 L20 8 H30 L34 16 V42 H14 Z" fill={C.white} {...s} />
          <rect x={14} y={24} width={20} height={10} fill={C.sky} stroke={C.ink} strokeWidth={2} />
        </g>
      )}
      {ing === 'vanilla' && (
        <g>
          <rect x={19} y={4} width={10} height={8} rx={2} fill={C.rose} {...s} />
          <path d="M16 14 H32 V42 H16 Z" fill={C.yellow} {...s} />
          <text x={24} y={34} textAnchor="middle" fontSize={13} fontWeight={700} fontFamily="Fredoka, sans-serif" fill={C.ink}>
            V
          </text>
        </g>
      )}
      {ing === 'flower' && (
        <g>
          <path d="M24 44 V22" stroke="#4E9A51" strokeWidth={3} />
          <Flower x={24} y={16} r={6} />
        </g>
      )}
      {ing === 'water' && <path d="M24 6 C 34 20 38 26 38 32 a14 14 0 0 1 -28 0 C 10 26 14 20 24 6 Z" fill={C.water} {...s} />}
      {ing === 'anchovy' && (
        <g>
          <path d="M6 28 H42 a18 14 0 0 1 -36 0 Z" fill="#EFE6C8" {...s} />
          <path d="M14 22 q8 -8 16 0 q-8 8 -16 0 Z M30 22 l6 -4 v8 Z" fill="#9AA7C7" stroke={C.ink} strokeWidth={2} />
        </g>
      )}
      {ing === 'sock' && (
        <g transform="translate(26 44) scale(0.95)">
          <Sock color={C.lavDeep} />
        </g>
      )}
    </svg>
  )
}

function BuildCup({ added, shake }: { added: Ingredient[]; shake: boolean }) {
  const has = (i: Ingredient) => added.includes(i)
  const fill = (has('espresso') ? 0.45 : 0) + (has('milk') ? 0.4 : 0)
  const top = 150 - fill * 112
  return (
    <svg viewBox="0 0 140 170" className={`build-cup ${shake ? 'shake' : ''}`} role="img" aria-label={`Your drink: ${added.length ? added.map((a) => INGREDIENT_LABEL[a]).join(', ') : 'nothing yet'}`}>
      <defs>
        <clipPath id="buildcup">
          <path d="M28 30 H112 L102 152 H38 Z" />
        </clipPath>
      </defs>
      <ellipse cx={70} cy={160} rx={46} ry={6} fill={C.ink} opacity={0.12} />
      {has('cup') ? (
        <>
          <g clipPath="url(#buildcup)">
            {has('espresso') && <rect className="pour" x={20} y={has('milk') ? top + 50 : top} width={100} height={160} fill={C.coffee} />}
            {has('milk') && <rect className="pour" x={20} y={top} width={100} height={52} fill={C.foam} />}
            {has('vanilla') && <path className="drizzle" d={`M30 ${top + 4} q10 10 20 0 q10 -10 20 0 q10 10 20 0 q10 -10 20 0`} stroke="#E9B949" strokeWidth={6} fill="none" />}
            {has('ice') &&
              [
                [44, 118],
                [70, 104],
                [84, 128],
                [56, 84],
              ].map(([x, y], i) => (
                <rect key={i} className="ice-drop" style={{ animationDelay: `${i * 0.06}s` }} x={x} y={y - 30 * (1 - fill)} width={22} height={22} rx={5} fill={C.white} fillOpacity={0.8} stroke="#8CC8DA" strokeWidth={2} />
              ))}
          </g>
          <path d="M26 28 H114 L104 154 H36 Z" fill={C.white} fillOpacity={0.25} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
          <path d="M40 40 L46 140" stroke={C.white} strokeWidth={5} strokeLinecap="round" opacity={0.7} />
          {added.length === 5 && <rect x={78} y={4} width={9} height={50} rx={4} transform="rotate(14 82 30)" fill={C.pink} stroke={C.ink} strokeWidth={2.5} />}
        </>
      ) : (
        <g>
          <rect x={24} y={146} width={92} height={10} rx={4} fill="#D9C4A8" stroke={C.ink} strokeWidth={3} />
          <text x={70} y={110} textAnchor="middle" fontFamily="Fredoka, sans-serif" fontSize={14} fill={C.ink} opacity={0.6}>
            (no cup yet)
          </text>
        </g>
      )}
    </svg>
  )
}

export function LatteGame() {
  const { member, api } = useAuth()
  const [started, setStarted] = useState(false)
  const [round, setRound] = useState(0)
  const [state, setState] = useState(newLatte)
  const [left, setLeft] = useState(LATTE_SECONDS)
  const [paused, setPaused] = useState(false)
  const [shake, setShake] = useState(false)
  const save = useGameSave()
  const shelf = useMemo(() => shuffle(ALL_INGREDIENTS), [round])
  const savedRound = useRef(-1)
  const stateRef = useRef(state)
  stateRef.current = state
  const done = state.status !== 'playing'

  // Countdown
  useEffect(() => {
    if (!started || done || paused) return
    const t0 = performance.now()
    const start = left
    const id = setInterval(() => {
      const remaining = Math.max(0, start - (performance.now() - t0) / 1000)
      setLeft(remaining)
      if (remaining <= 0) {
        stateRef.current = timeUp(stateRef.current)
        setState(stateRef.current)
      }
    }, 100)
    return () => clearInterval(id)
    // `left` is intentionally read once so Pause/Resume continues from where it stopped.
  }, [started, done, paused, round])

  // Save once per finished round (score is validated again by the server).
  useEffect(() => {
    if (done && savedRound.current !== round) {
      savedRound.current = round
      sfx(state.status === 'won' ? 'win' : 'lose')
      const score = latteScore(state)
      void save.run(() => api.recordCompletion('latte_rescue', score))
    }
  }, [done, round, state, save, api])

  const pick = useCallback(
    (ing: Ingredient) => {
      if (paused) return
      const s = stateRef.current
      const next = addIngredient(s, ing)
      if (next === s) return
      stateRef.current = next
      setState(next)
      if (next.last?.kind === 'good') sfx('good')
      else if (next.last && next.last.kind !== 'dup') {
        sfx('bad')
        setShake(true)
        setTimeout(() => setShake(false), 450)
      }
    },
    [paused],
  )

  useEffect(() => {
    if (!started || done) return
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key)
      if (n >= 1 && n <= shelf.length) pick(shelf[n - 1])
      if (e.key === 'p' || e.key === 'P') setPaused((p) => !p)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [started, done, shelf, pick])

  const replay = () => {
    stateRef.current = newLatte()
    setState(stateRef.current)
    setLeft(LATTE_SECONDS)
    setPaused(false)
    save.reset()
    setRound((r) => r + 1)
  }

  const progress = 1 - left / LATTE_SECONDS
  const ev = state.last
  const feedback = !ev
    ? 'Order received: Iced vanilla latte. DUBOT is preparing… botanical water!'
    : ev.kind === 'good'
      ? `${INGREDIENT_LABEL[ev.ingredient]} ✓ ${state.added.length}/5`
      : ev.kind === 'dup'
        ? `Already added ${INGREDIENT_LABEL[ev.ingredient].toLowerCase()}. No double ${ev.ingredient}, professor’s orders.`
        : ev.kind === 'needCup'
          ? WRONG_QUIP.needCup
          : WRONG_QUIP[ev.ingredient]
  const lilyMood = state.status === 'won' ? 'proud' : state.status === 'lost' ? 'facepalm' : ev && ev.kind !== 'good' && ev.kind !== 'dup' ? 'fakeAngry' : 'neutral'
  const customer =
    member?.role === 'satyam' ? (
      <Satyam width={92} mood={state.status === 'won' ? 'proud' : state.status === 'lost' ? 'thoughtful' : 'neutral'} />
    ) : (
      <Lily width={92} mood={lilyMood} />
    )

  return (
    <GameShell
      game="latte_rescue"
      started={started}
      onStart={() => setStarted(true)}
      intro={
        <div className="intro-art">
          <Dubot width={130} item="flowerWater" mood="proud" />
          <Lily width={96} mood="fakeAngry" />
        </div>
      }
    >
      {!done ? (
        <div className="latte-play">
          <div className="ticket" aria-label="Order ticket">
            <span className="ticket-no">ORDER #001</span>
            <strong>1 × Iced Vanilla Latte</strong>
            <span>for {member?.role === 'satyam' ? 'Researcher Satyam (visiting)' : 'Professor Lily'}</span>
          </div>
          <div className="latte-hud">
            <div className="hud-block">
              <span className="hud-label">DUBOT’s artistic inspiration</span>
              <Meter value={progress} label="DUBOT artistic inspiration" tone="blush" />
            </div>
            <div className="hud-block hud-patience" aria-label={`Patience: ${MAX_MISTAKES - state.mistakes} of ${MAX_MISTAKES}`}>
              <span className="hud-label">Patience</span>
              <span className="hearts">
                {Array.from({ length: MAX_MISTAKES }, (_, i) => (
                  <span key={i} className={i < MAX_MISTAKES - state.mistakes ? 'heart on' : 'heart'}>
                    ♥
                  </span>
                ))}
              </span>
            </div>
            <button className="btn btn-small" onClick={() => setPaused((p) => !p)} aria-pressed={paused}>
              {paused ? 'Resume' : 'Pause'}
            </button>
          </div>
          <div className="counter-stage">
            <div className="stage-customer">{customer}</div>
            <div className="stage-cup">
              <BuildCup added={state.added} shake={shake} />
            </div>
            <div className="stage-dubot" style={{ transform: `translateX(${(1 - progress) * 60}%)` }}>
              <Dubot width={120} item="flowerWater" mood={ev && ev.kind === 'bad' ? 'proud' : 'happy'} anim={shake ? 'wiggle' : 'bob'} />
            </div>
            {paused && (
              <div className="paused-overlay">
                <p>Paused. DUBOT is politely frozen mid-flower.</p>
                <button className="btn btn-primary" onClick={() => setPaused(false)}>
                  Resume
                </button>
              </div>
            )}
          </div>
          <p className={`feedback ${ev && ev.kind !== 'good' && ev.kind !== 'dup' ? 'bad' : ''}`} aria-live="polite">
            {feedback}
          </p>
          <div className="shelf" role="group" aria-label="Ingredients">
            {shelf.map((ing, i) => (
              <button
                key={ing}
                className={`ingredient ${state.added.includes(ing) ? 'used' : ''}`}
                onClick={() => pick(ing)}
                disabled={paused}
                aria-label={`${INGREDIENT_LABEL[ing]} (key ${i + 1})`}
              >
                <IngredientIcon ing={ing} />
                <span>{INGREDIENT_LABEL[ing]}</span>
                <kbd>{i + 1}</kbd>
              </button>
            ))}
          </div>
        </div>
      ) : state.status === 'won' ? (
        <ResultCard
          stamp={`${latteScore(state)}/100 COFFEE`}
          stampTone="mint"
          title="An actual iced vanilla latte. Historic."
          lines={[
            'DUBOT: “It’s… coffee? I feel strangely ordinary.”',
            state.mistakes === 0 ? 'Zero mistakes. The faculty is suspicious of your competence.' : `Mistakes: ${state.mistakes}. Still coffee. Still counts.`,
          ]}
          art={
            <div className="result-scene">
              <Lily width={86} mood="proud" />
              <Dubot width={110} item="latte" mood="proud" />
            </div>
          }
          save={save.state}
          onRetrySave={() => void save.retry()}
          onReplay={replay}
        />
      ) : (
        <ResultCard
          stamp="REGULATION #001"
          title="UNIVERSITY REGULATION #001: FLOWER WATER IS NOT AN ICED VANILLA LATTE."
          lines={[
            state.loseReason === 'time' ? 'DUBOT finished his artistic interpretation first.' : 'Three “creative” ingredients later, DUBOT took over.',
            'DUBOT: “It’s not a bug. It’s botanical innovation.”',
            'Tofu approves. Tofu’s opinion is not legally binding.',
          ]}
          art={
            <div className="result-scene">
              <Lily width={86} mood="facepalm" />
              <Dubot width={110} item="flowerWater" mood="proud" />
              <Tofu width={70} mood="approve" />
            </div>
          }
          save={save.state}
          onRetrySave={() => void save.retry()}
          onReplay={replay}
        />
      )}
    </GameShell>
  )
}
