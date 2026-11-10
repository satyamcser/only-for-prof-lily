import { C } from '../art/palette'
import { StarShape } from '../art/Props'
import { CONSTELLATION_SHAPES } from '../data/lore'
import { isComplete } from '../lib/rules'
import type { ConstellationState, PlayerSummary } from '../lib/types'

const ROLE_COLOR = { lily: C.blush, satyam: C.glow } as const

export function ConstellationView({ c, players, compact }: { c: ConstellationState; players: PlayerSummary[]; compact?: boolean }) {
  const shape = CONSTELLATION_SHAPES[c.id] ?? CONSTELLATION_SHAPES.flower_water_nebula
  const done = isComplete(c)
  const litBy = new Map(c.lit.map((s) => [s.starIndex, s.litBy]))
  const color = (uid: string | undefined) => {
    const p = players.find((x) => x.userId === uid)
    return p ? ROLE_COLOR[p.role] : C.star
  }
  const counts = players.map((p) => ({ p, n: c.lit.filter((s) => s.litBy === p.userId).length }))
  return (
    <figure className={`constellation ${done ? 'complete' : ''} ${compact ? 'compact' : ''}`}>
      <svg viewBox="-6 -6 112 72" role="img" aria-label={`${c.title}: ${c.lit.length} of ${c.starCount} stars lit`}>
        <rect x={-6} y={-6} width={112} height={72} rx={10} fill={C.midnight} />
        {shape.slice(0, c.starCount).map((pt, i) => {
          const next = shape[i + 1]
          if (!next || i + 1 >= c.starCount) return null
          const on = litBy.has(i) && litBy.has(i + 1)
          return (
            <line
              key={`l${i}`}
              x1={pt.x}
              y1={pt.y}
              x2={next.x}
              y2={next.y}
              stroke={on ? C.star : '#3B4270'}
              strokeWidth={on ? 1.6 : 1}
              strokeDasharray={on ? undefined : '2 2'}
              className={on && done ? 'draw-line' : undefined}
            />
          )
        })}
        {shape.slice(0, c.starCount).map((pt, i) => {
          const uid = litBy.get(i)
          return uid ? (
            <StarShape key={i} x={pt.x} y={pt.y} r={5.5} fill={color(uid)} className="twinkle" />
          ) : (
            <circle key={i} cx={pt.x} cy={pt.y} r={2.4} fill="#5A6196" />
          )
        })}
      </svg>
      <figcaption>
        <strong>{c.title}</strong>
        <span>
          {c.lit.length}/{c.starCount} stars
          {done ? ' — complete, together ✨' : ''}
        </span>
        {!compact && (
          <span className="legend">
            {counts.map(({ p, n }) => (
              <span key={p.userId} className={`legend-${p.role}`}>
                {p.role === 'lily' ? 'Lily' : 'Satyam'}: {n}
              </span>
            ))}
          </span>
        )}
      </figcaption>
    </figure>
  )
}
