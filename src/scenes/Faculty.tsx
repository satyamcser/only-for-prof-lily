import { useState } from 'react'
import { Avatar } from '../art/People'
import { useAuth } from '../auth/AuthProvider'
import { ConstellationView } from '../components/Constellation'
import { Meter, Stamp } from '../components/ui'
import { GAMES, RULEBOOK } from '../data/lore'
import { useShared } from '../hooks/useShared'
import { useUi } from '../hooks/useUi'
import { friendlyError } from '../lib/api'
import { coins, cooperation, formatWon, headToHead, sharedStars } from '../lib/rules'
import { sfx } from '../lib/sound'
import type { VoteChoice } from '../lib/types'

export function Faculty() {
  const { api } = useAuth()
  const { world, refresh } = useShared()
  const { toast } = useUi()
  const [busy, setBusy] = useState(false)
  const [shakeBudget, setShakeBudget] = useState(false)

  if (!world) return <p className="page fine">Unlocking the faculty office…</p>

  const total = sharedStars(world)
  const coop = cooperation(total)
  const won = coins(world)
  const vote = world.vote
  const players = [...world.players].sort((a) => (a.role === 'lily' ? -1 : 1))

  const castVote = async (choice: VoteChoice) => {
    setBusy(true)
    try {
      await api.castVote(choice)
      sfx('pop')
      await refresh()
    } catch (e) {
      toast(`Vote not recorded: ${friendlyError(e)}`, 'error')
    } finally {
      setBusy(false)
    }
  }

  const statsFor = (uid: string) => world.stats.filter((s) => s.userId === uid && s.activityId !== 'letterbox')
  const h2h = headToHead(world)
  const short = (uid: string) => {
    const p = world.players.find((x) => x.userId === uid)
    return p?.role === 'lily' ? 'Lily' : 'Satyam'
  }

  return (
    <div className="page faculty">
      <header className="page-head">
        <h1>The Faculty Office</h1>
        <p>Seoul student + Daejeon researcher = remote faculty meeting.</p>
      </header>

      <section className="card scoreboard" aria-live="polite">
        <p className="eyebrow">Head-to-head</p>
        <h2>
          {h2h.leader
            ? `🏆 ${h2h.leader.displayName} leads by ${h2h.margin} ⭐`
            : total === 0
              ? 'No stars yet — the first game decides who leads.'
              : '🤝 Perfectly tied. The faculty finds this suspicious.'}
        </h2>
        <p className="fine">
          Games where each of you holds the best score:{' '}
          {world.players.map((p, i) => (
            <span key={p.userId}>
              {i > 0 && ' · '}
              {short(p.userId)} 👑 {h2h.gamesLed[p.userId] ?? 0}
            </span>
          ))}
          . Best scores never reset; stars can be earned once per game per day.
        </p>
      </section>

      <section className="score-columns">
        {players.map((p) => {
          const st = statsFor(p.userId)
          return (
            <div key={p.userId} className={`score-card card score-${p.role}`}>
              <Avatar role={p.role} width={78} mood={p.role === 'lily' ? 'proud' : 'happy'} />
              <div>
                <p className="eyebrow">{p.displayName}’s Stars</p>
                <strong className="big-num">⭐ {p.stars}</strong>
                <p className="fine">
                  {st.reduce((n, s) => n + s.plays, 0)} rounds played · {st.length}/{GAMES.length} games tried
                </p>
              </div>
            </div>
          )
        })}
      </section>

      <section className="card coop">
        <div className="row between wrap gap">
          <div>
            <p className="eyebrow">Café Cooperation Meter (shared)</p>
            <strong>
              Level {coop.level}: {coop.name}
            </strong>
          </div>
          <button
            className={`budget ${shakeBudget ? 'shake' : ''}`}
            onClick={() => {
              setShakeBudget(true)
              sfx(won >= 11000 ? 'good' : 'bad')
              toast(won >= 11000 ? 'Funding approved! Two lattes are theoretically affordable.' : `Request: 2 lattes. Faculty has reviewed the budget and discovered ${formatWon(won)}.`)
              setTimeout(() => setShakeBudget(false), 500)
            }}
          >
            Coffee budget: <strong>{formatWon(won)}</strong>
          </button>
        </div>
        <Meter value={coop.progress} label="Cooperation progress" />
        <p className="fine">
          {total} shared stars{coop.nextAt ? ` · next level at ${coop.nextAt}` : ' · max level reached'}. Grows with any game either of you plays — it measures teamwork in
          the café, nothing more.
        </p>
      </section>

      <section className="report-card card">
        <h2>Official Report Card</h2>
        <table>
          <thead>
            <tr>
              <th scope="col">Subject</th>
              {players.map((p) => (
                <th key={p.userId} scope="col">
                  {p.role === 'lily' ? 'Lily' : 'Satyam'}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {GAMES.map((g) => (
              <tr key={g.id}>
                <th scope="row">{g.title}</th>
                {players.map((p) => {
                  const s = world.stats.find((x) => x.userId === p.userId && x.activityId === g.id)
                  const crown = h2h.gameLeaders[g.id] === p.userId
                  return (
                    <td key={p.userId} className={crown ? 'leads' : undefined}>
                      {s ? `${crown ? '👑 ' : ''}${s.bestScore}${s.awardedToday ? ' ✓' : ''}` : '—'}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="fine">Best scores. 👑 = holds the record. ✓ = stars earned today.</p>
        <div className="wax-seal" aria-label="Wax seal: Approved by Professor Lily">
          <span>APPROVED BY PROFESSOR LILY</span>
        </div>
      </section>

      <section className="card senate">
        <p className="eyebrow">Faculty Senate · today’s proposal</p>
        <h2 className="proposal">“{vote.title}”</h2>
        {vote.myChoice ? (
          <div className="vote-result">
            <p>
              You voted <strong>{vote.myChoice === 'approve' ? 'APPROVE' : 'REJECT'}</strong>.
            </p>
            <p>
              {vote.otherChoice
                ? `The other faculty member voted ${vote.otherChoice === 'approve' ? 'APPROVE' : 'REJECT'}.`
                : 'The other faculty member hasn’t voted yet — whenever they like, no rush.'}
            </p>
            {vote.otherChoice && (
              <Stamp
                text={vote.myChoice === vote.otherChoice ? (vote.myChoice === 'approve' ? 'MOTION CARRIED' : 'MOTION REJECTED') : 'HUNG FACULTY'}
                tone={vote.myChoice === vote.otherChoice && vote.myChoice === 'approve' ? 'mint' : 'rose'}
                small
              />
            )}
          </div>
        ) : (
          <div className="row gap">
            <button className="btn btn-mint" disabled={busy} onClick={() => void castVote('approve')}>
              Approve
            </button>
            <button className="btn btn-rose" disabled={busy} onClick={() => void castVote('reject')}>
              Reject
            </button>
          </div>
        )}
        <p className="fine">One vote each per day. The other vote is revealed after you vote. Equal votes, equal power.</p>
      </section>

      <section className="card rulebook">
        <h2>University Rulebook</h2>
        <ol>
          {RULEBOOK.map((r, i) => (
            <li key={i}>
              <span className="sect">§{i + 1}</span> {r}
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2>The shared sky</h2>
        <div className="sky-gallery">
          {world.constellations.map((c) => (
            <ConstellationView key={c.id} c={c} players={world.players} />
          ))}
        </div>
      </section>
    </div>
  )
}
