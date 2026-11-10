import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { CampusScene, PLACES, type PlaceId } from '../art/CampusScene'
import { Dubot } from '../art/Dubot'
import { Lily, Satyam } from '../art/People'
import { Simba, Tofu, type TofuMood } from '../art/Pets'
import { useAuth } from '../auth/AuthProvider'
import { ConstellationView } from '../components/Constellation'
import { Modal } from '../components/ui'
import { BULLETINS, DUBOT_QUIPS, GAMES } from '../data/lore'
import { useShared } from '../hooks/useShared'
import { useUi } from '../hooks/useUi'
import { navigate, type Route } from '../lib/route'
import { awardedToday, coins, currentConstellation, formatWon, partner, sharedStars } from '../lib/rules'
import { sfx } from '../lib/sound'
import { EndOfDay } from './EndOfDay'
import { letterOpened, LetterModal } from './Letter'

interface PlaceInfo {
  blurb: string
  actions: { label: string; route: Route; sub?: string }[]
}

const INFO: Record<PlaceId, PlaceInfo> = {
  cafe: {
    blurb: 'A tiny café serving everything except what was ordered.',
    actions: [
      { label: 'Play: Latte or Flower?', route: { name: 'play', game: 'latte_rescue' }, sub: 'Rescue the iced vanilla latte' },
      { label: 'Play: The Great Café Escape', route: { name: 'play', game: 'cafe_escape' }, sub: 'Tofu & Simba vs. the tray' },
    ],
  },
  office: {
    blurb: 'Homework, a suspicious grading rubric, and several coffee-budget proposals (all rejected: ₩0).',
    actions: [
      { label: 'Sit the Totally Fair Exam', route: { name: 'play', game: 'totally_fair_exam' }, sub: '5 questions, one rubric' },
      { label: 'Faculty Office: scores, rulebook & vote', route: { name: 'faculty' } },
    ],
  },
  lab: {
    blurb: 'Satyam tinkers with DUBOT here. Flowers keep getting “accidentally” delivered.',
    actions: [{ label: 'Play: The Great Laundry Crisis', route: { name: 'play', game: 'laundry_crisis' }, sub: 'Fold before DUBOT escapes' }],
  },
  park: {
    blurb: 'Tofu and Simba’s official park. Both defendants deny all allegations.',
    actions: [{ label: 'Play: The Great Café Escape', route: { name: 'play', game: 'cafe_escape' }, sub: '25 seconds of harmless chaos' }],
  },
  kitchen: {
    blurb: 'This vegetable soup is acting suspiciously fishy.',
    actions: [{ label: 'Play: Vegetarian Ingredient Detective', route: { name: 'play', game: 'veggie_detective' }, sub: 'Find the hidden anchovy broth' }],
  },
  letterbox: {
    blurb: 'Tiny shared notes, stickers and a scrapbook of funny moments.',
    actions: [
      { label: 'Open the Letterbox', route: { name: 'notes' } },
      { label: 'Open the Scrapbook', route: { name: 'badges' } },
    ],
  },
  observatory: {
    blurb: 'Stars, a cozy walk, and a constellation you light up together. No tests here. Not even one.',
    actions: [{ label: 'Walk to the Silvermoon Observatory', route: { name: 'play', game: 'observatory' }, sub: 'Collect 5 stars (or don’t)' }],
  },
}

const SCENE_W = 1600

export function Campus() {
  const { member } = useAuth()
  const { world } = useShared()
  const { say, reduced } = useUi()
  const scroller = useRef<HTMLDivElement>(null)
  const [walkerX, setWalkerX] = useState(PLACES[1].x)
  const [facingLeft, setFacingLeft] = useState(false)
  const [selected, setSelected] = useState<PlaceId | null>(null)
  const [open, setOpen] = useState<PlaceId | null>(null)
  const [tofuMood, setTofuMood] = useState<TofuMood>('innocent')
  const [pawprints, setPawprints] = useState(false)
  const [dubotSays, setDubotSays] = useState(false)
  const [night, setNight] = useState(false)
  const [letter, setLetter] = useState(false)
  const [letterNew, setLetterNew] = useState(() => !letterOpened())
  const [bulletin, setBulletin] = useState(() => Math.floor(Math.random() * BULLETINS.length))
  const tofuTaps = useRef(0)
  const antennaTaps = useRef(0)
  const walkTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scale = useCallback(() => {
    const svg = scroller.current?.querySelector('svg')
    return svg ? svg.getBoundingClientRect().width / SCENE_W : 1
  }, [])

  const centerOn = useCallback(
    (x: number, smooth: boolean) => {
      const el = scroller.current
      if (!el) return
      el.scrollTo({ left: x * scale() - el.clientWidth / 2, behavior: smooth && !reduced ? 'smooth' : 'auto' })
    },
    [scale, reduced],
  )

  useLayoutEffect(() => {
    centerOn(PLACES[1].x, false) // start at DUBOT Café
  }, [centerOn])

  useEffect(() => {
    const id = setInterval(() => setBulletin((b) => (b + 1) % BULLETINS.length), 9000)
    return () => {
      clearInterval(id)
      if (walkTimer.current) clearTimeout(walkTimer.current)
    }
  }, [])

  const walkTo = (id: PlaceId, thenOpen: boolean) => {
    const place = PLACES.find((p) => p.id === id)!
    setFacingLeft(place.x < walkerX)
    setWalkerX(place.x)
    setSelected(id)
    centerOn(place.x, true)
    sfx('tap')
    if (walkTimer.current) clearTimeout(walkTimer.current)
    if (thenOpen) walkTimer.current = setTimeout(() => setOpen(id), reduced ? 0 : Math.min(900, Math.abs(place.x - walkerX) * 1.2 + 150))
  }

  const onSceneKey = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    const idx = Math.max(0, PLACES.findIndex((p) => p.id === (selected ?? 'cafe')))
    const next = PLACES[Math.max(0, Math.min(PLACES.length - 1, idx + (e.key === 'ArrowRight' ? 1 : -1)))]
    walkTo(next.id, false)
    scroller.current?.querySelectorAll<SVGGElement>('.hotspot')[PLACES.indexOf(next)]?.focus({ preventScroll: true })
  }

  const onTofu = () => {
    tofuTaps.current++
    sfx('pop')
    if (tofuTaps.current % 3 === 0) {
      setTofuMood('beg')
      say('🚨 Tofu has declared a snack emergency.')
    } else {
      setTofuMood('innocent')
      say('Tofu looks criminally innocent. The defendant requests treats before answering any questions.')
    }
    setTimeout(() => setTofuMood('innocent'), 3000)
  }
  const onSimba = () => {
    sfx('pop')
    setPawprints(true)
    say('Simba innocence meter: 100%. (The pawprints are a coincidence.)')
    setTimeout(() => setPawprints(false), 4200)
  }
  const onDubot = () => {
    sfx('tap')
    setDubotSays(true)
    say(DUBOT_QUIPS[Math.floor(Math.random() * DUBOT_QUIPS.length)])
    setTimeout(() => setDubotSays(false), 2500)
  }
  const onAntenna = () => {
    antennaTaps.current++
    sfx('tap')
    if (antennaTaps.current >= 5) {
      antennaTaps.current = 0
      say('DUBOT (whispering): “I think Professor Lily is grading me right now.”')
    } else say(`*boop* (${antennaTaps.current}/5)`)
  }

  if (!member) return null
  const other = world ? partner(world) : undefined
  const earnedGames = world ? GAMES.filter((g) => awardedToday(world, g.id)).length : 0
  const sky = world ? currentConstellation(world) : null
  const info = open ? INFO[open] : null
  const place = open ? PLACES.find((p) => p.id === open) : null

  return (
    <div className="campus">
      <div className="campus-head">
        <div>
          <h1 className="welcome">Welcome back, {member.displayName}!</h1>
          <p className="bulletin" aria-live="polite">
            📌 {BULLETINS[bulletin]}
          </p>
          {member.role === 'lily' ? (
            <button className={`letter-chip ${letterNew ? 'is-new' : ''}`} onClick={() => setLetter(true)}>
              ✉️ {letterNew ? 'A sealed letter is waiting for you' : 'Re-read the sealed letter'}
            </button>
          ) : (
            <button className="letter-chip" onClick={() => setLetter(true)}>
              ✉️ Preview your sealed letter to Professor Lily
            </button>
          )}
        </div>
        <button className="btn btn-primary" onClick={() => navigate({ name: 'play' })}>
          Play a game
        </button>
      </div>

      <div className="campus-scroller" ref={scroller} onKeyDown={onSceneKey}>
        <CampusScene
          myRole={member.role}
          otherRole={other?.role ?? null}
          walkerX={walkerX}
          facingLeft={facingLeft}
          selected={selected}
          onPlace={(id) => walkTo(id, true)}
          onDubot={onDubot}
          onAntenna={onAntenna}
          onTofu={onTofu}
          onSimba={onSimba}
          onMoon={() => {
            sfx('star')
            setNight(true)
          }}
          tofuMood={tofuMood}
          pawprints={pawprints}
          dubotSays={dubotSays}
        />
      </div>
      <p className="scene-hint fine">Swipe the campus · tap a building to walk there · ← → keys work too · psst, try the moon</p>

      <nav className="place-chips" aria-label="Campus locations">
        {PLACES.map((p) => (
          <button key={p.id} className={`chip chip-btn ${selected === p.id ? 'active' : ''}`} onClick={() => walkTo(p.id, true)}>
            {p.name}
          </button>
        ))}
      </nav>

      {world && (
        <div className="today-strip">
          <div className="today-card card">
            <span className="eyebrow">Today</span>
            <strong>
              {earnedGames}/{GAMES.length} games starred
            </strong>
            <span className="fine">Stars reset at midnight (Korea time).</span>
          </div>
          <div className="today-card card">
            <span className="eyebrow">Shared stars</span>
            <strong>⭐ {sharedStars(world)}</strong>
            <span className="fine">
              {world.players.map((p) => `${p.role === 'lily' ? 'Lily' : 'Satyam'} ${p.stars}`).join(' · ')} · budget {formatWon(coins(world))}
            </span>
          </div>
          {sky && (
            <button className="today-card card sky-card" onClick={() => navigate({ name: 'play', game: 'observatory' })}>
              <ConstellationView c={sky} players={world.players} compact />
            </button>
          )}
        </div>
      )}

      {open && info && place && (
        <Modal title={place.name} onClose={() => setOpen(null)}>
          <div className="place-art">
            {open === 'cafe' && <Dubot width={110} item="flowerWater" mood="proud" />}
            {open === 'office' && <Lily width={90} mood="proud" />}
            {open === 'lab' && (
              <>
                <Satyam width={86} mood="thoughtful" notebook />
                <Dubot width={96} mood="error" />
              </>
            )}
            {open === 'park' && (
              <>
                <Tofu width={80} mood="innocent" />
                <Simba width={110} mood="happy" />
              </>
            )}
            {open === 'kitchen' && <Dubot width={110} item="magnifier" mood="detective" />}
            {open === 'letterbox' && <Dubot width={110} item="envelope" mood="happy" />}
            {open === 'observatory' && world && sky && <ConstellationView c={sky} players={world.players} />}
          </div>
          <p className="place-blurb">{info.blurb}</p>
          <div className="place-actions">
            {info.actions.map((a) => (
              <button
                key={a.label}
                className="btn btn-primary btn-block"
                onClick={() => {
                  setOpen(null)
                  navigate(a.route)
                }}
              >
                <span>{a.label}</span>
                {a.sub && <small>{a.sub}</small>}
              </button>
            ))}
            {open === 'letterbox' && (
              <button
                className="btn btn-blush btn-block"
                onClick={() => {
                  setOpen(null)
                  setLetter(true)
                }}
              >
                {member.role === 'lily' ? 'Open the sealed letter' : 'Preview your sealed letter'}
              </button>
            )}
            {open === 'lab' && (
              <button className="btn btn-block" onClick={onDubot}>
                Ask DUBOT what he’s doing
              </button>
            )}
            {open === 'park' && (
              <div className="row gap">
                <button className="btn" onClick={onTofu}>
                  Pet Tofu
                </button>
                <button className="btn" onClick={onSimba}>
                  Question Simba
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
      {night && <EndOfDay onClose={() => setNight(false)} />}
      {letter && (
        <LetterModal
          viewer={member.role}
          onClose={() => {
            setLetter(false)
            setLetterNew(!letterOpened())
          }}
        />
      )}
    </div>
  )
}
