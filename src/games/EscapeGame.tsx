import { useEffect, useRef, useState } from 'react'
import { Dubot } from '../art/Dubot'
import { C } from '../art/palette'
import { Simba, Tofu } from '../art/Pets'
import { Sock, StarShape } from '../art/Props'
import { useAuth } from '../auth/AuthProvider'
import { Meter } from '../components/ui'
import { sfx } from '../lib/sound'
import { GameShell, ResultCard, useGameSave } from './GameShell'
import { ARENA_H, ARENA_W, DUBOT_Y, ESCAPE_SECONDS, escapeScore, newEscape, step, tapPet, tapThing, type EscapeState, type PetId, type Thing } from './logic/escape'

interface Pop {
  id: number
  x: number
  y: number
  text: string
  tone: 'good' | 'bad'
}

function ThingArt({ t }: { t: Thing }) {
  if (t.kind === 'sock')
    return (
      <g transform={`translate(${t.x + 6} ${t.y + 16}) scale(0.7)`}>
        <Sock color={C.lavDeep} />
      </g>
    )
  if (t.kind === 'cup')
    return (
      <g transform={`translate(${t.x} ${t.y})`}>
        <path d="M-10 -14 H10 L7 12 H-7 Z" fill={C.white} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />
        <rect x={-10} y={-18} width={20} height={5} rx={2} fill={C.pink} stroke={C.ink} strokeWidth={2} />
      </g>
    )
  const variant = t.id % 3
  return (
    <g transform={`translate(${t.x} ${t.y})`} className="toy-pop">
      {variant === 0 && (
        <g>
          <circle r={12} fill={C.star} stroke={C.ink} strokeWidth={2.5} />
          <path d="M-12 0 q12 -8 24 0 M-12 0 q12 8 24 0" stroke={C.rose} strokeWidth={2.5} fill="none" />
        </g>
      )}
      {variant === 1 && (
        <g>
          <rect x={-12} y={-4} width={24} height={8} rx={4} fill={C.cream} stroke={C.ink} strokeWidth={2.5} />
          <circle cx={-12} cy={-4} r={5} fill={C.cream} stroke={C.ink} strokeWidth={2.5} />
          <circle cx={-12} cy={4} r={5} fill={C.cream} stroke={C.ink} strokeWidth={2.5} />
          <circle cx={12} cy={-4} r={5} fill={C.cream} stroke={C.ink} strokeWidth={2.5} />
          <circle cx={12} cy={4} r={5} fill={C.cream} stroke={C.ink} strokeWidth={2.5} />
        </g>
      )}
      {variant === 2 && <StarShape r={13} fill={C.blush} />}
    </g>
  )
}

export function EscapeGame() {
  const { api } = useAuth()
  const [started, setStarted] = useState(false)
  const [round, setRound] = useState(0)
  const [s, setS] = useState<EscapeState>(newEscape)
  const [paused, setPaused] = useState(false)
  const [pops, setPops] = useState<Pop[]>([])
  const sRef = useRef(s)
  const popId = useRef(1)
  const savedRound = useRef(-1)
  const save = useGameSave()
  const done = s.status === 'done'

  useEffect(() => {
    if (!started || done || paused) return
    let raf = 0
    let last = performance.now()
    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000)
      last = t
      const prevIncidents = sRef.current.incidents
      sRef.current = step(sRef.current, dt)
      if (sRef.current.incidents > prevIncidents) sfx('bad')
      setS(sRef.current)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [started, done, paused, round])

  useEffect(() => {
    if (done && savedRound.current !== round) {
      savedRound.current = round
      sfx('win')
      const score = escapeScore(sRef.current)
      void save.run(() => api.recordCompletion('cafe_escape', score))
    }
  }, [done, round, save, api])

  const pop = (x: number, y: number, text: string, tone: Pop['tone']) => {
    const id = popId.current++
    setPops((p) => [...p.slice(-6), { id, x, y, text, tone }])
    setTimeout(() => setPops((p) => p.filter((q) => q.id !== id)), 900)
  }

  const onThing = (t: Thing) => {
    if (paused) return
    const [next, r] = tapThing(sRef.current, t.id)
    sRef.current = next
    setS(next)
    if (r === 'toy') {
      sfx('good')
      pop(t.x, t.y, '+10 toy!', 'good')
    } else if (r === 'oops') {
      sfx('bad')
      pop(t.x, t.y, t.kind === 'sock' ? '−5 Simba’s sock!' : '−5 not a toy!', 'bad')
    }
  }

  const onPet = (id: PetId) => {
    if (paused) return
    const pet = sRef.current.pets.find((p) => p.id === id)
    const [next, r] = tapPet(sRef.current, id)
    sRef.current = next
    setS(next)
    if (!pet) return
    if (r === 'save') {
      sfx('good')
      pop(pet.x, pet.y - 30, '+10 crisis averted!', 'good')
    } else {
      sfx('tap')
      pop(pet.x, pet.y - 30, id === 'tofu' ? '♥ requests treats' : '♥ innocent (allegedly)', 'good')
    }
  }

  const replay = () => {
    sRef.current = newEscape()
    setS(sRef.current)
    setPops([])
    setPaused(false)
    save.reset()
    setRound((r) => r + 1)
  }

  const score = escapeScore(s)
  const remaining = Math.max(0, ESCAPE_SECONDS - s.time)

  return (
    <GameShell
      game="cafe_escape"
      started={started}
      onStart={() => setStarted(true)}
      intro={
        <div className="intro-art">
          <Tofu width={80} mood="mischief" />
          <Simba width={110} mood="zoom" />
          <Dubot width={90} item="tray" mood="neutral" />
        </div>
      }
    >
      {!done ? (
        <div className="escape">
          <div className="escape-hud">
            <span className="chip chip-gold">Score {score}</span>
            <div className="hud-block">
              <span className="hud-label">{remaining.toFixed(0)}s left</span>
              <Meter value={remaining / ESCAPE_SECONDS} label="Time left" tone="mint" />
            </div>
            <button className="btn btn-small" onClick={() => setPaused((p) => !p)} aria-pressed={paused}>
              {paused ? 'Resume' : 'Pause'}
            </button>
          </div>
          <div className={`arena-wrap ${s.shake > 0 ? 'shake' : ''}`}>
            <svg className="arena" viewBox={`0 0 ${ARENA_W} ${ARENA_H}`} role="application" aria-label="Café floor. Tap toys, and tap pets that are heading for DUBOT's tray.">
              <defs>
                <pattern id="tiles" width="40" height="40" patternUnits="userSpaceOnUse">
                  <rect width="40" height="40" fill="#FBEFDF" />
                  <rect width="20" height="20" fill="#F6E2CB" />
                  <rect x="20" y="20" width="20" height="20" fill="#F6E2CB" />
                </pattern>
              </defs>
              <rect width={ARENA_W} height={ARENA_H} fill="url(#tiles)" />
              <rect x={0} y={0} width={ARENA_W} height={26} fill={C.blush} />
              {Array.from({ length: 10 }, (_, i) => (
                <path key={i} d={`M${i * 40} 26 q20 16 40 0`} fill={i % 2 ? C.white : C.pink} stroke={C.ink} strokeWidth={1.5} />
              ))}
              <ellipse cx={s.dubotX} cy={DUBOT_Y + 2} rx={36} ry={10} fill={C.rose} opacity={0.12} />
              <g transform={`translate(${s.dubotX - 30} ${DUBOT_Y - 52})`}>
                <Dubot width={60} item="tray" mood={s.shake > 0 ? 'error' : 'happy'} anim="none" />
              </g>
              {s.things.map((t) => (
                <g key={t.id} className="tappable" onPointerDown={() => onThing(t)}>
                  <circle cx={t.x} cy={t.y} r={24} fill="transparent" />
                  <ThingArt t={t} />
                </g>
              ))}
              {s.pets.map((p) => (
                <g key={p.id} className="tappable" onPointerDown={() => onPet(p.id)} aria-label={p.id === 'tofu' ? 'Tofu' : 'Simba'}>
                  <circle cx={p.x} cy={p.y} r={p.id === 'tofu' ? 30 : 36} fill="transparent" />
                  {p.id === 'tofu' ? (
                    <Tofu x={p.x - 24} y={p.y - 30} width={48} mood={p.mischief ? 'mischief' : 'happy'} flip={p.vx < 0} />
                  ) : (
                    <Simba x={p.x - 34} y={p.y - 36} width={68} mood={p.mischief ? 'zoom' : 'happy'} flip={p.vx < 0} />
                  )}
                  {p.mischief && (
                    <g className="alert-mark">
                      <circle cx={p.x + 18} cy={p.y - 38} r={10} fill={C.rose} stroke={C.ink} strokeWidth={2} />
                      <text x={p.x + 18} y={p.y - 33} textAnchor="middle" fontSize={14} fontWeight={800} fill={C.white} fontFamily="Fredoka, sans-serif">
                        !
                      </text>
                    </g>
                  )}
                </g>
              ))}
              {pops.map((p) => (
                <text key={p.id} x={p.x} y={p.y} textAnchor="middle" className={`float-pop ${p.tone}`} fontFamily="Fredoka, sans-serif" fontSize={13} fontWeight={700}>
                  {p.text}
                </text>
              ))}
            </svg>
            {paused && (
              <div className="paused-overlay">
                <p>Paused. Both pets are pretending to be asleep.</p>
                <button className="btn btn-primary" onClick={() => setPaused(false)}>
                  Resume
                </button>
              </div>
            )}
          </div>
          <p className="fine center">Pets with a red “!” are plotting against the tray. Tap them to send them zooming somewhere else.</p>
        </div>
      ) : (
        <ResultCard
          stamp={`${score} PTS`}
          stampTone="gold"
          title="CRIMINAL REPORT — Café Case Closed"
          lines={[]}
          art={
            <div className="result-scene">
              <Tofu width={70} mood="innocent" />
              <Simba width={96} mood="innocent" />
            </div>
          }
          save={save.state}
          onRetrySave={() => void save.retry()}
          onReplay={replay}
        >
          <ul className="report">
            <li>
              <strong>Tofu:</strong> {s.tofuSnackPlots} count{s.tofuSnackPlots === 1 ? '' : 's'} of unauthorized snack solicitation.
            </li>
            <li>
              <strong>Simba:</strong> {s.simbaSockPlots} count{s.simbaSockPlots === 1 ? '' : 's'} of high-speed tray investigation.
            </li>
            <li>
              Toys rescued: {s.toys} · Crises averted: {s.saves} · Tray incidents: {s.incidents}
            </li>
            <li>Simba innocence meter: 100%. Evidence: also 100%.</li>
            <li>The defendants request treats before answering any further questions.</li>
          </ul>
        </ResultCard>
      )}
    </GameShell>
  )
}
