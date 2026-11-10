import { useState } from 'react'
import { Dubot } from '../art/Dubot'
import { C } from '../art/palette'
import { Avatar, Lily, Satyam } from '../art/People'
import { Simba, Tofu } from '../art/Pets'
import { StarShape } from '../art/Props'
import { useAuth } from '../auth/AuthProvider'
import { formatDate, Meter, Modal, Stamp } from '../components/ui'
import { BADGES, STORY_CARDS, type StoryCardDef } from '../data/lore'
import { useShared } from '../hooks/useShared'
import { useUi } from '../hooks/useUi'
import { friendlyError } from '../lib/api'
import { coins, COUPON_WON, deriveBadges, deriveCards, formatWon, isComplete, timeline } from '../lib/rules'
import { sfx } from '../lib/sound'

function CardArt({ art }: { art: StoryCardDef['art'] }) {
  switch (art) {
    case 'cafe':
      return <Dubot width={90} item="flowerWater" mood="proud" />
    case 'exam':
    case 'certificate':
      return <Lily width={70} mood="proud" />
    case 'stars':
      return (
        <svg viewBox="0 0 100 60" width={110} aria-hidden="true">
          <rect width={100} height={60} rx={8} fill={C.midnight} />
          <StarShape x={20} y={20} r={6} className="twinkle" />
          <StarShape x={50} y={12} r={5} className="twinkle" />
          <StarShape x={78} y={26} r={6} className="twinkle" />
          <StarShape x={36} y={44} r={4} className="twinkle" />
          <StarShape x={66} y={48} r={5} className="twinkle" />
        </svg>
      )
    case 'tofu':
      return <Tofu width={80} mood="beg" />
    case 'simba':
      return <Simba width={96} mood="innocent" />
    case 'mountain':
      return (
        <svg viewBox="0 0 100 60" width={110} aria-hidden="true">
          <rect width={100} height={60} rx={8} fill={C.sky} />
          <path d="M0 60 L34 14 L50 34 L66 20 L100 60 Z" fill={C.lavDeep} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />
          <path d="M26 25 L34 14 L42 25 Z" fill={C.white} />
          <path d="M8 14 h14 M12 20 h16 M70 10 h18" stroke={C.white} strokeWidth={2.5} strokeLinecap="round" />
        </svg>
      )
    case 'budget':
      return (
        <div className="won-art" aria-hidden="true">
          ₩0
        </div>
      )
    case 'soup':
      return <Dubot width={90} item="magnifier" mood="detective" />
    case 'meeting':
      return (
        <div className="row">
          <Lily width={56} mood="amused" />
          <Satyam width={56} mood="happy" />
        </div>
      )
    case 'letter':
      return <Dubot width={90} item="envelope" mood="happy" />
  }
}

export function Badges() {
  const { api, member } = useAuth()
  const { world, refresh } = useShared()
  const { toast, say } = useUi()
  const [openCard, setOpenCard] = useState<StoryCardDef | null>(null)
  const [coupon, setCoupon] = useState(false)

  if (!member || !world) return <p className="page fine">Opening the scrapbook…</p>

  const cards = deriveCards(world)
  const unlockedCount = cards.filter((c) => c.unlocked).length
  const players = [...world.players].sort((a) => (a.userId === world.me ? -1 : 1))
  const won = coins(world)
  const constellationsDone = world.constellations.filter(isComplete).length
  const events = timeline(world)

  const read = async (def: StoryCardDef) => {
    setOpenCard(def)
    sfx('pop')
    if (world.myCardReads.includes(def.id)) return
    try {
      await api.markCardRead(def.id)
      const before = world.myCardReads.length
      await refresh()
      if (before + 1 === 3) say('🏅 Hidden badge unlocked: No Peer Review Required.')
    } catch (e) {
      toast(`Couldn’t record that you read this card: ${friendlyError(e)}`, 'error')
    }
  }

  return (
    <div className="page scrapbook">
      <header className="page-head">
        <h1>Scrapbook & Badges</h1>
        <p>Everything here comes from games you two actually played. Even ordinary days deserve a place in the scrapbook.</p>
      </header>

      <section className="card progress-panel">
        <div>
          <span className="eyebrow">Story cards</span>
          <strong>
            {unlockedCount}/{cards.length}
          </strong>
          <Meter value={unlockedCount / cards.length} label="Story cards unlocked" tone="blush" />
        </div>
        <div>
          <span className="eyebrow">Constellations</span>
          <strong>
            {constellationsDone}/{world.constellations.length}
          </strong>
          <Meter value={constellationsDone / world.constellations.length} label="Constellations completed" />
        </div>
        <div>
          <span className="eyebrow">Café fund</span>
          <strong>{formatWon(won)}</strong>
          <Meter value={won / COUPON_WON} label="Café fund toward coupon" tone="mint" />
        </div>
      </section>

      <section>
        <h2>Story cards</h2>
        <div className="story-grid">
          {STORY_CARDS.map((def) => {
            const st = cards.find((c) => c.id === def.id)!
            return st.unlocked ? (
              <button key={def.id} className={`story-card card ${st.read ? 'read' : 'new'}`} onClick={() => void read(def)}>
                <div className="story-art">
                  <CardArt art={def.art} />
                </div>
                <strong>{def.title}</strong>
                <small>{st.read ? `Unlocked ${formatDate(st.unlockedAt)}` : 'New! Tap to read'}</small>
              </button>
            ) : (
              <div key={def.id} className="story-card card locked" aria-label={`Locked card. ${def.hint}`}>
                <div className="story-art lock">?</div>
                <strong>Locked</strong>
                <small>{def.hint}</small>
              </div>
            )
          })}
        </div>
      </section>

      <section>
        <h2>Badges</h2>
        <div className="badge-columns">
          {players.map((p) => {
            const list = deriveBadges(world, p.userId)
            return (
              <div key={p.userId} className="badge-shelf card">
                <div className="shelf-head">
                  <Avatar role={p.role} headOnly width={40} />
                  <strong>{p.userId === world.me ? 'Your badges' : `${p.displayName}’s badges`}</strong>
                  <span className="chip">{list.filter((b) => b.earned).length}</span>
                </div>
                <ul className="badges">
                  {BADGES.map((b) => {
                    const st = list.find((x) => x.id === b.id)!
                    if (b.hidden && !st.earned) return null
                    return (
                      <li key={b.id} className={`badge ${st.earned ? 'earned' : 'locked'}`} title={b.how}>
                        <span className="medal" aria-hidden="true">
                          {st.earned ? b.glyph : '·'}
                        </span>
                        <span>
                          <strong>{b.title}</strong>
                          <small>{st.earned ? (st.earnedAt ? formatDate(st.earnedAt) : 'Earned') : b.how}</small>
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
      </section>

      <section className="card coupon-section">
        {won >= COUPON_WON ? (
          <button className="coupon unlocked" onClick={() => setCoupon(true)}>
            <span className="coupon-title">☕ One Iced Vanilla Latte — Professor Lily</span>
            <span className="fine">Unlocked by shared café funding. Tap for terms.</span>
          </button>
        ) : (
          <div className="coupon locked">
            <span className="coupon-title">☕ Mystery café coupon</span>
            <span className="fine">
              Unlocks when the shared café fund reaches {formatWon(COUPON_WON)} (currently {formatWon(won)}).
            </span>
          </div>
        )}
      </section>

      <section>
        <h2>Milestones</h2>
        {events.length === 0 ? (
          <p className="fine">No milestones yet. The first game you play will appear here.</p>
        ) : (
          <ol className="timeline">
            {events.map((e, i) => (
              <li key={i} className={`tl-${e.kind}`}>
                <time>{formatDate(e.at)}</time>
                <span>{e.text}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      {openCard && (
        <Modal title={openCard.title} onClose={() => setOpenCard(null)}>
          <div className="story-open">
            <div className="story-art big">
              <CardArt art={openCard.art} />
            </div>
            {openCard.lines.map((l, i) => (
              <p key={i} className={i === 0 && openCard.art === 'certificate' ? 'cert-title' : undefined}>
                {l}
              </p>
            ))}
            {openCard.art === 'certificate' && <Stamp text="100/100" />}
          </div>
        </Modal>
      )}
      {coupon && (
        <Modal title="Café coupon" onClose={() => setCoupon(false)}>
          <div className="coupon-full">
            <p className="coupon-title">One Iced Vanilla Latte — Professor Lily</p>
            <p>Redeemable during an actual café visit if both parties want to. No expiration. Not a financial obligation.</p>
            <p className="fine">Coffee is optional. Good conversation is the whole point.</p>
            <Stamp text="CAFÉ FUNDING APPROVED" tone="mint" small />
          </div>
        </Modal>
      )}
    </div>
  )
}
