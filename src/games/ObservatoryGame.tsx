import { useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import { C } from '../art/palette'
import { Avatar } from '../art/People'
import { StarShape } from '../art/Props'
import { useAuth } from '../auth/AuthProvider'
import { ConstellationView } from '../components/Constellation'
import { useShared } from '../hooks/useShared'
import { currentConstellation, partner } from '../lib/rules'
import { sfx } from '../lib/sound'
import { GameShell, ResultCard, useGameSave } from './GameShell'
import { collect, GROUND_Y, newStars, newWalker, stepWalker, WORLD_W, type Input, type Star } from './logic/observatory'

const MOMENTS = [
  'A gentle wind. The city hums far away.',
  'DUBOT stopped to admire the architecture. Again.',
  'The soundtrack swells… you got briefly distracted. (No organ was composed.)',
  'Mission progress: low. Beautiful architecture appreciated: 100%.',
  'No tests at the observatory. Not even one.',
]

function NightBackdrop() {
  const stars = useMemo(
    () => Array.from({ length: 60 }, (_, i) => ({ x: (i * 173) % WORLD_W, y: (i * 61) % 170, r: i % 6 === 0 ? 2 : 1.1, d: (i % 9) * 0.35 })),
    [],
  )
  return (
    <g>
      <defs>
        <linearGradient id="nightsky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#11152A" />
          <stop offset="0.7" stopColor="#2E3470" />
          <stop offset="1" stopColor="#5B4F8E" />
        </linearGradient>
      </defs>
      <rect width={WORLD_W} height={400} fill="url(#nightsky)" />
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#FFF3C9" className="twinkle" style={{ animationDelay: `${s.d}s` }} />
      ))}
      <circle cx={860} cy={70} r={30} fill={C.yellow} opacity={0.95} />
      <circle cx={872} cy={60} r={26} fill="#1E2346" />
      {/* skyline */}
      <g className="obs-skyline">
        {[
          [20, 230, 50, 100],
          [80, 200, 36, 130],
          [126, 250, 60, 80],
          [400, 220, 44, 110],
          [452, 180, 30, 150],
          [560, 240, 70, 90],
          [640, 210, 40, 120],
        ].map(([x, y, w, h], i) => (
          <g key={i}>
            <rect x={x} y={y} width={w} height={h} fill="#232A55" />
            {Array.from({ length: Math.floor(h / 22) }, (_, r) =>
              Array.from({ length: Math.max(1, Math.floor(w / 16)) }, (_, c) => (
                <rect
                  key={`${r}-${c}`}
                  x={x + 5 + c * 15}
                  y={y + 8 + r * 22}
                  width={7}
                  height={8}
                  fill={(r + c + i) % 3 === 0 ? '#FFE9A8' : '#3A4175'}
                  className={(r + c + i) % 3 === 0 ? 'window-glow' : undefined}
                />
              )),
            )}
          </g>
        ))}
      </g>
      {/* observatory */}
      <g transform="translate(760 210)">
        <rect x={0} y={40} width={150} height={80} fill={C.cream} stroke={C.ink} strokeWidth={4} />
        <path d="M-8 44 a83 74 0 0 1 166 0 Z" fill="#E4E7F7" stroke={C.ink} strokeWidth={4} />
        <rect x={64} y={-26} width={22} height={70} fill={C.midnight} stroke={C.ink} strokeWidth={3} />
        <path d="M75 -14 L130 -60" stroke={C.ink} strokeWidth={10} strokeLinecap="round" />
        <path d="M75 -14 L130 -60" stroke={C.lavDeep} strokeWidth={6} strokeLinecap="round" />
        <rect x={60} y={74} width={30} height={46} rx={14} fill="#FFE9A8" stroke={C.ink} strokeWidth={3} className="window-glow" />
      </g>
      <path d={`M0 ${GROUND_Y} C 200 ${GROUND_Y - 14} 420 ${GROUND_Y + 10} 600 ${GROUND_Y - 6} C 760 ${GROUND_Y - 18} 900 ${GROUND_Y} 1000 ${GROUND_Y - 8} L1000 400 L0 400 Z`} fill="#3D4A6E" stroke={C.ink} strokeWidth={4} />
      <rect x={0} y={GROUND_Y + 8} width={WORLD_W} height={70} fill="#33405F" />
    </g>
  )
}

export function ObservatoryGame() {
  const { api, member } = useAuth()
  const { world } = useShared()
  const [started, setStarted] = useState(false)
  const [round, setRound] = useState(0)
  const [stars, setStars] = useState<Star[]>(newStars)
  const [skipped, setSkipped] = useState(false)
  const [moment, setMoment] = useState(0)
  const save = useGameSave()
  const walker = useRef(newWalker())
  const starsRef = useRef(stars)
  const input = useRef<Input>({ left: false, right: false, jump: false })
  const avatarRef = useRef<SVGGElement>(null)
  const savedRound = useRef(-1)
  const got = stars.filter((s) => s.got).length
  const done = got === stars.length || skipped

  // Game loop: physics in refs, React state only when a star is collected.
  useEffect(() => {
    if (!started || done) return
    let raf = 0
    let last = performance.now()
    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000)
      last = t
      walker.current = stepWalker(walker.current, input.current, dt)
      input.current.jump = false
      const next = collect(starsRef.current, walker.current)
      if (next !== starsRef.current) {
        starsRef.current = next
        setStars(next)
        sfx('star')
      }
      const w = walker.current
      avatarRef.current?.setAttribute('transform', `translate(${w.x} ${w.y}) scale(${w.facing} 1) translate(-32 -89)`)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [started, done, round])

  useEffect(() => {
    if (!started || done) return
    const id = setInterval(() => setMoment((m) => (m + 1) % MOMENTS.length), 6500)
    return () => clearInterval(id)
  }, [started, done])

  useEffect(() => {
    if (!started || done) return
    const set = (e: KeyboardEvent, on: boolean) => {
      const k = e.key
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') input.current.left = on
      else if (k === 'ArrowRight' || k === 'd' || k === 'D') input.current.right = on
      else if (k === ' ' || k === 'ArrowUp' || k === 'w' || k === 'W') {
        if (on) input.current.jump = true
      } else return
      e.preventDefault()
    }
    const down = (e: KeyboardEvent) => set(e, true)
    const up = (e: KeyboardEvent) => set(e, false)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [started, done])

  useEffect(() => {
    if (done && savedRound.current !== round) {
      savedRound.current = round
      sfx(got > 0 ? 'win' : 'pop')
      void save.run(() => api.recordCompletion('observatory', got))
    }
  }, [done, round, got, save, api])

  const hold = (key: 'left' | 'right') => ({
    onPointerDown: (e: RPointerEvent) => {
      ;(e.target as Element).setPointerCapture?.(e.pointerId)
      input.current[key] = true
    },
    onPointerUp: () => (input.current[key] = false),
    onPointerCancel: () => (input.current[key] = false),
    onPointerLeave: () => (input.current[key] = false),
  })

  const replay = () => {
    walker.current = newWalker()
    const fresh = newStars()
    starsRef.current = fresh
    setStars(fresh)
    setSkipped(false)
    save.reset()
    setRound((r) => r + 1)
  }

  const result = save.state.status === 'saved' ? save.state.result : null
  const other = world ? partner(world) : undefined
  // Show the constellation I just added to (even if it is now complete), else the current one.
  const sky = world
    ? ([...world.constellations].reverse().find((c) => c.lit.some((st) => st.litBy === world.me && st.litOn === world.today)) ??
      currentConstellation(world) ??
      world.constellations[world.constellations.length - 1])
    : null
  const capped = result && result.starsLit !== undefined && result.starsLit < got

  return (
    <GameShell game="observatory" started={started} onStart={() => setStarted(true)} intro={member && <Avatar role={member.role} width={90} mood="proud" />}>
      {!done ? (
        <div className="observatory">
          <div className="obs-hud">
            <span className="chip chip-gold" aria-live="polite">
              ★ {got}/5 stars
            </span>
            <button className="btn btn-small btn-ghost" onClick={() => setSkipped(true)}>
              Skip the quest, just watch the stars
            </button>
          </div>
          <svg className="obs-world" viewBox={`0 0 ${WORLD_W} 400`} role="img" aria-label={`Night sky walk. ${got} of 5 stars collected.`}>
            <NightBackdrop />
            {stars.map((s) =>
              s.got ? null : (
                <g key={s.id} className="float">
                  <circle cx={s.x} cy={s.y} r={22} fill={C.star} opacity={0.18} />
                  <StarShape x={s.x} y={s.y} r={14} />
                </g>
              ),
            )}
            <g ref={avatarRef} transform={`translate(60 ${GROUND_Y}) translate(-32 -89)`}>
              {member && <Avatar role={member.role} width={64} mood={member.role === 'lily' ? 'amused' : 'happy'} />}
            </g>
          </svg>
          <p className="moment" aria-live="polite">
            {MOMENTS[moment]}
          </p>
          <div className="pad" aria-label="Touch controls">
            <button className="pad-btn" aria-label="Walk left" {...hold('left')}>
              ◀
            </button>
            <button className="pad-btn pad-jump" aria-label="Jump" onPointerDown={() => (input.current.jump = true)}>
              ▲
            </button>
            <button className="pad-btn" aria-label="Walk right" {...hold('right')}>
              ▶
            </button>
          </div>
        </div>
      ) : (
        <ResultCard
          stamp={got === 5 ? '5/5 STARS' : got === 0 ? '0 QUESTS' : `${got}/5 STARS`}
          stampTone="gold"
          title={got === 0 ? 'Some nights aren’t for finishing quests.' : got === 5 ? 'Every star collected. The sky looks pleased.' : 'A few stars, a lot of sky.'}
          lines={[
            got === 0 ? 'Mission progress: 0%. Beautiful architecture appreciated: 100%.' : `You collected ${got} star${got === 1 ? '' : 's'}.`,
            result?.starsLit !== undefined
              ? result.starsLit > 0
                ? `You lit ${result.starsLit} star${result.starsLit === 1 ? '' : 's'} in the shared sky.`
                : got > 0
                  ? 'Your 3 shared stars for today are already shining.'
                  : 'No stars lit tonight — and that’s completely fine.'
              : '',
            capped ? `The rest can wait — for ${other?.displayName ?? 'your co-stargazer'}, or for you tomorrow. No rush.` : 'You worked hard today.',
          ].filter(Boolean)}
          save={save.state}
          onRetrySave={() => void save.retry()}
          onReplay={replay}
        >
          {world && sky && <ConstellationView c={sky} players={world.players} />}
        </ResultCard>
      )}
    </GameShell>
  )
}
