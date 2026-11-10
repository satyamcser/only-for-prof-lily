import { useEffect, useState } from 'react'
import { Dubot } from '../art/Dubot'
import { Avatar } from '../art/People'
import { Simba, Tofu } from '../art/Pets'
import { Envelope } from '../art/Props'
import { Stamp } from '../components/ui'
import { introDialogue, SUBTITLES, TITLE } from '../data/lore'
import { useUi } from '../hooks/useUi'
import { sfx } from '../lib/sound'
import type { Member } from '../lib/types'

/** Screen 1: the envelope, the big title, and (first time) the intro dialogue. */
export function Greeting({ member, onEnter }: { member: Member; onEnter: () => void }) {
  const { prefs, setPrefs, reduced } = useUi()
  const [stage, setStage] = useState<'closed' | 'open' | 'dialogue'>('closed')
  const [line, setLine] = useState(0)
  const [sub, setSub] = useState(0)
  const lines = introDialogue(member.role)

  useEffect(() => {
    if (stage !== 'open') return
    const id = setInterval(() => setSub((s) => (s + 1) % SUBTITLES.length), 3800)
    return () => clearInterval(id)
  }, [stage])

  const finish = () => {
    setPrefs({ introSeen: true })
    onEnter()
  }
  const enter = () => {
    sfx('pop')
    if (!prefs.introSeen) setStage('dialogue')
    else onEnter()
  }

  if (stage === 'dialogue') {
    const cur = lines[line]
    const next = () => {
      sfx('tap')
      if (line + 1 >= lines.length) finish()
      else setLine(line + 1)
    }
    return (
      <main className="greeting dialogue-screen" onClick={next}>
        <div className="dialogue-stage">
          <Dubot width={150} item="flowerWater" mood={cur.who === 'stamp' ? 'proud' : 'happy'} wave={cur.who === 'dubot'} />
          <Avatar role={member.role} width={120} mood={member.role === 'lily' ? (line >= 1 ? 'fakeAngry' : 'neutral') : line >= 1 ? 'thoughtful' : 'neutral'} />
          <Tofu width={74} mood="innocent" />
        </div>
        <div className="dialogue-box card" role="dialog" aria-live="polite" aria-label="Intro">
          {cur.who === 'stamp' ? (
            <div className="center">
              <Stamp text={cur.text} />
            </div>
          ) : (
            <>
              <p className="speaker">{cur.who === 'dubot' ? 'DUBOT' : member.displayName}</p>
              <p className="dialogue-text">{cur.text}</p>
            </>
          )}
          <div className="row gap between">
            <button
              className="btn btn-ghost btn-small"
              onClick={(e) => {
                e.stopPropagation()
                finish()
              }}
            >
              Skip intro
            </button>
            <button
              className="btn btn-primary"
              autoFocus
              onClick={(e) => {
                e.stopPropagation()
                next()
              }}
            >
              {line + 1 >= lines.length ? 'Enter campus' : 'Next ▸'}
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className={`greeting ${stage}`}>
      {stage === 'closed' ? (
        <div className="envelope-wrap">
          <button
            className="big-envelope"
            onClick={() => {
              sfx('pop')
              setStage('open')
            }}
            aria-label="Open the envelope labelled Only for Professor Lily"
            autoFocus
          >
            <svg viewBox="-34 -46 68 50" width="100%" aria-hidden="true">
              <Envelope label />
            </svg>
          </button>
          <p className="tap-hint">Tap the envelope</p>
          <div className="greeting-dubot">
            <Dubot width={120} mood="happy" wave />
          </div>
        </div>
      ) : (
        <div className={`reveal ${reduced ? '' : 'reveal-anim'}`}>
          <div className="letter card">
            <p className="eyebrow">Welcome back, {member.displayName}!</p>
            <h1 className="mega-title">{TITLE}</h1>
            <p className="subtitle">One researcher. One medical professor. Two dogs. A very confused robot.</p>
            <div className="hero-scene" aria-label="DUBOT proudly serving a flower in water as an iced vanilla latte, Tofu looking criminally innocent, Simba about to cause chaos">
              <div className="hero-sign">
                <span>ONLY FOR</span>
                <strong>PROFESSOR LILY</strong>
              </div>
              <Tofu width={92} mood="innocent" />
              <Dubot width={150} item="flowerWater" mood="proud" />
              <Simba width={130} mood="zoom" className="about-to-zoom" />
            </div>
            <p className="rotating" aria-live="polite" key={sub}>
              {SUBTITLES[sub]}
            </p>
            <button className="btn btn-primary btn-big" onClick={enter} autoFocus>
              Enter Our Extremely Serious University
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
