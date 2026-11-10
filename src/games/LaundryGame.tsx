import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import { Dubot } from '../art/Dubot'
import { C } from '../art/palette'
import { Simba, Tofu } from '../art/Pets'
import { Sock } from '../art/Props'
import { useAuth } from '../auth/AuthProvider'
import { shuffle } from '../data/exam'
import { sfx } from '../lib/sound'
import { GameShell, ResultCard, useGameSave } from './GameShell'
import { BINS, drop, garment, GARMENTS, laundryScore, newLaundry, simbaStrikes, type GarmentType, type LaundryState } from './logic/laundry'

function GarmentArt({ type, color, folded }: { type: GarmentType; color: string; folded?: boolean }) {
  const s = { stroke: C.ink, strokeWidth: 3, strokeLinejoin: 'round' as const }
  if (folded)
    return (
      <svg viewBox="0 0 60 24" width={54} height={22} aria-hidden="true">
        <rect x={3} y={3} width={54} height={18} rx={5} fill={color} {...s} />
        <path d="M10 12 h40" stroke={C.ink} strokeWidth={1.6} opacity={0.4} />
      </svg>
    )
  return (
    <svg viewBox="0 0 64 64" width={56} height={56} aria-hidden="true">
      {type === 'shirt' && (
        <g>
          <path d="M20 8 L8 18 L14 28 L20 24 V56 H44 V24 L50 28 L56 18 L44 8 Q32 18 20 8 Z" fill={color} {...s} />
          <path d="M26 10 q6 8 12 0" fill="none" stroke={C.ink} strokeWidth={2} />
        </g>
      )}
      {type === 'sock' && (
        <g transform="translate(38 56) scale(1.25)">
          <Sock color={color} />
        </g>
      )}
      {type === 'towel' && (
        <g transform="rotate(-8 32 32)">
          <rect x={8} y={14} width={48} height={36} rx={6} fill={color} {...s} />
          <path d="M8 22 H56 M8 42 H56" stroke={C.white} strokeWidth={3} />
          <path d="M14 50 v5 M22 50 v5 M30 50 v5 M38 50 v5 M46 50 v5" stroke={C.ink} strokeWidth={2} />
        </g>
      )}
    </svg>
  )
}

const LABELS: Record<GarmentType, string> = { shirt: 'shirt', sock: 'sock', towel: 'towel' }

export function LaundryGame() {
  const { api } = useAuth()
  const [started, setStarted] = useState(false)
  const [round, setRound] = useState(0)
  const [s, setS] = useState<LaundryState>(() => newLaundry(shuffle(GARMENTS.map((g) => g.id))))
  const [selected, setSelected] = useState<string | null>(null)
  type Drag = { id: string; x: number; y: number; sx: number; sy: number; moved: boolean }
  const [drag, setDrag] = useState<Drag | null>(null)
  const dragRef = useRef<Drag | null>(null)
  const [msg, setMsg] = useState('Lab notice: the washer worked. The folding did not. Please assist.')
  const [dubot, setDubot] = useState<'working' | 'escaping' | 'gone'>('working')
  const dubotRef = useRef(dubot)
  dubotRef.current = dubot
  const [simbaRun, setSimbaRun] = useState(false)
  const [badBin, setBadBin] = useState<GarmentType | null>(null)
  const save = useGameSave()
  const savedRound = useRef(-1)
  const sRef = useRef(s)
  sRef.current = s
  const done = s.status === 'won'

  // DUBOT tries to escape work twice per round.
  useEffect(() => {
    if (!started || done) return
    const timers: ReturnType<typeof setTimeout>[] = []
    const attempt = (delay: number) => {
      timers.push(
        setTimeout(() => {
          if (sRef.current.status !== 'playing') return
          setDubot('escaping')
          setMsg('DUBOT is attempting to escape work! Tap “Catch DUBOT” quickly.')
          timers.push(
            setTimeout(() => {
              if (dubotRef.current !== 'escaping') return
              setDubot('gone')
              setS((st) => ({ ...st, escapes: st.escapes + 1 }))
              setMsg('DUBOT escaped to the café. He returns with a request: “3 chicken treats per shirt.”')
              timers.push(setTimeout(() => setDubot('working'), 2500))
            }, 4000),
          )
        }, delay),
      )
    }
    attempt(5000 + Math.random() * 3000)
    attempt(17000 + Math.random() * 4000)
    return () => timers.forEach(clearTimeout)
  }, [started, done, round])

  useEffect(() => {
    if (done && savedRound.current !== round) {
      savedRound.current = round
      sfx('win')
      const score = laundryScore(s)
      void save.run(() => api.recordCompletion('laundry_crisis', score))
    }
  }, [done, round, s, save, api])

  const doDrop = (id: string, bin: GarmentType) => {
    const before = sRef.current
    let next = drop(before, id, bin)
    if (next === before) return
    if (next.last?.kind === 'bad') {
      sfx('bad')
      setBadBin(bin)
      setTimeout(() => setBadBin(null), 450)
      setMsg(`That ${LABELS[garment(id).type]} does not belong with the ${LABELS[bin]}s. The rubric is watching.`)
    } else {
      sfx('good')
      const sortedCount = GARMENTS.length - next.pile.length
      if (sortedCount === 2 && !next.simbaStruck) {
        next = simbaStrikes(next)
        setSimbaRun(true)
        setTimeout(() => setSimbaRun(false), 1600)
        setMsg('Simba zoomed through and relocated a folded item. “I am innocent. The sock moved by itself.”')
      } else {
        setMsg(next.status === 'won' ? 'All folded!' : 'Folded. Humankind invented the washer and forgot the folding part.')
      }
    }
    sRef.current = next
    setS(next)
    setSelected(null)
  }

  // The live drag lives in a ref (events can arrive faster than React re-renders);
  // state only mirrors it for drawing the floating garment.
  const onPointerDown = (e: RPointerEvent, id: string) => {
    ;(e.currentTarget as Element).setPointerCapture?.(e.pointerId)
    dragRef.current = { id, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: false }
    setDrag(dragRef.current)
  }
  const onPointerMove = (e: RPointerEvent) => {
    const d = dragRef.current
    if (!d) return
    dragRef.current = { ...d, x: e.clientX, y: e.clientY, moved: d.moved || Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 8 }
    setDrag(dragRef.current)
  }
  const onPointerUp = (e: RPointerEvent) => {
    const d = dragRef.current
    dragRef.current = null
    setDrag(null)
    if (!d) return
    if (!d.moved) {
      setSelected((cur) => (cur === d.id ? null : d.id))
      return
    }
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-bin]') as HTMLElement | null
    if (el?.dataset.bin) doDrop(d.id, el.dataset.bin as GarmentType)
  }

  const replay = () => {
    const fresh = newLaundry(shuffle(GARMENTS.map((g) => g.id)))
    sRef.current = fresh
    setS(fresh)
    setSelected(null)
    setDubot('working')
    setMsg('Round two. The laundry has multiplied. Science cannot explain it.')
    save.reset()
    setRound((r) => r + 1)
  }

  const dragged = drag?.moved ? garment(drag.id) : null

  return (
    <GameShell
      game="laundry_crisis"
      started={started}
      onStart={() => setStarted(true)}
      intro={
        <div className="intro-art">
          <Dubot width={120} item="sock" mood="whisper" />
          <Simba width={110} mood="innocent" />
        </div>
      }
    >
      {!done ? (
        <div className="laundry">
          <div className="lab-strip">
            <div className={`lab-dubot dubot-${dubot}`}>
              <Dubot width={88} mood={dubot === 'escaping' ? 'whisper' : dubot === 'gone' ? 'sleepy' : 'happy'} anim={dubot === 'escaping' ? 'roll' : 'bob'} />
            </div>
            {dubot === 'escaping' && (
              <button
                className="btn btn-rose pop-in"
                onClick={() => {
                  sfx('good')
                  setDubot('working')
                  setS((st) => ({ ...st, catches: st.catches + 1 }))
                  setMsg('Caught! DUBOT: “I fold laundry in exchange for 3 chicken treats.”')
                }}
              >
                Catch DUBOT!
              </button>
            )}
            {simbaRun && (
              <div className="simba-dash" aria-hidden="true">
                <Simba width={90} mood="zoom" />
              </div>
            )}
            <div className="innocence" aria-label="Simba innocence meter: 100%">
              Simba innocence meter: <strong>100%</strong>
            </div>
          </div>
          <p className="feedback" aria-live="polite">
            {msg}
          </p>
          <div className="pile" role="group" aria-label="Laundry pile">
            {s.pile.map((id) => {
              const g = garment(id)
              return (
                <button
                  key={id}
                  className={`garment ${selected === id ? 'selected' : ''} ${drag?.id === id && drag.moved ? 'lifting' : ''}`}
                  aria-pressed={selected === id}
                  aria-label={`${g.type}, ${selected === id ? 'selected' : 'tap to select'}`}
                  onPointerDown={(e) => onPointerDown(e, id)}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setSelected((cur) => (cur === id ? null : id))
                    }
                  }}
                >
                  <GarmentArt type={g.type} color={g.color} />
                </button>
              )
            })}
            {s.pile.length === 0 && <p className="fine">Pile empty!</p>}
          </div>
          <div className="bins">
            {BINS.map((b) => (
              <button
                key={b.type}
                data-bin={b.type}
                className={`bin ${selected ? 'armed' : ''} ${badBin === b.type ? 'shake' : ''}`}
                onClick={() => selected && doDrop(selected, b.type)}
                aria-label={`${b.label} basket${selected ? ', drop selected item here' : ''}`}
              >
                <div className="bin-stack">
                  {s.sorted[b.type].map((id) => (
                    <GarmentArt key={id} type={b.type} color={garment(id).color} folded />
                  ))}
                </div>
                <svg viewBox="0 0 100 40" className="basket" aria-hidden="true">
                  <path d="M6 4 H94 L84 36 H16 Z" fill="#E7C49A" stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
                  <path d="M20 12 H80 M24 22 H76" stroke="#B88B5C" strokeWidth={3} />
                </svg>
                <span>{b.label}</span>
              </button>
            ))}
          </div>
          {dragged && drag && (
            <div className="drag-ghost" style={{ left: drag.x, top: drag.y }} aria-hidden="true">
              <GarmentArt type={dragged.type} color={dragged.color} />
            </div>
          )}
        </div>
      ) : (
        <ResultCard
          stamp="BREAKTHROUGH"
          stampTone="mint"
          title="Autonomous Laundry Folding: a humanitarian breakthrough."
          lines={[
            `Score ${laundryScore(s)}/100 · Wrong baskets: ${s.wrong} · DUBOT escapes: ${s.escapes} · Catches: ${s.catches}`,
            'Tofu immediately fell asleep on the clean laundry.',
            'DUBOT demands an “overtime snack”. The request has been filed under “no”.',
          ]}
          art={
            <div className="result-scene">
              <Tofu width={80} mood="sleep" />
              <Dubot width={100} mood="proud" item="sock" />
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
