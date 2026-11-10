import type { CSSProperties } from 'react'
import { autoHeight, C } from './palette'
import { StarShape } from './Props'

interface PetProps {
  x?: number
  y?: number
  width?: number | string
  height?: number | string
  className?: string
  style?: CSSProperties
  flip?: boolean
  label?: string
}

/** Draws circles twice: thick ink pass, then fill pass → one fluffy outlined shape. */
function Fluff({ circles, fill, stroke = C.ink, sw = 7 }: { circles: [number, number, number][]; fill: string; stroke?: string; sw?: number }) {
  return (
    <g>
      <g fill={stroke} stroke={stroke} strokeWidth={sw}>
        {circles.map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} />
        ))}
      </g>
      <g fill={fill}>
        {circles.map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} />
        ))}
      </g>
    </g>
  )
}

export type TofuMood = 'innocent' | 'beg' | 'sleep' | 'mischief' | 'happy' | 'approve'

/** Tofu — a tiny, fluffy, white dog. (Breed intentionally unspecified.) */
export function Tofu({ mood = 'happy', x, y, width = 110, height, className = '', style, flip, label = 'Tofu, a tiny fluffy white dog' }: PetProps & { mood?: TofuMood }) {
  const body: [number, number, number][] = [
    [65, 88, 24],
    [47, 94, 15],
    [83, 94, 15],
    [65, 101, 16],
    [52, 108, 8],
    [78, 108, 8],
  ]
  const head: [number, number, number][] = [
    [65, 54, 27],
    [44, 48, 13],
    [86, 48, 13],
    [52, 32, 12],
    [78, 32, 12],
    [65, 29, 13],
  ]
  const sleeping = mood === 'sleep'
  return (
    <svg
      viewBox="0 -10 130 130"
      x={x}
      y={y}
      width={width}
      height={autoHeight(width, height, 1)}
      className={`art tofu mood-${mood} ${className}`}
      style={style}
      role="img"
      aria-label={label}
      overflow="visible"
    >
      <g transform={flip ? 'translate(130 0) scale(-1 1)' : undefined}>
        <ellipse cx={65} cy={117} rx={34} ry={5} fill={C.ink} opacity={0.13} />
        <g className="tofu-tail">
          <Fluff circles={[[94, 86, 9], [100, 79, 6]]} fill={C.tofu} sw={6} />
        </g>
        <g className="tofu-body">
          <Fluff circles={body} fill={C.tofu} />
          {mood === 'beg' && (
            <g fill={C.white} stroke={C.ink} strokeWidth={3}>
              <circle cx={55} cy={82} r={7} />
              <circle cx={75} cy={82} r={7} />
            </g>
          )}
        </g>
        <g className="tofu-head">
          <Fluff circles={head} fill={C.tofu} />
          <ellipse cx={38} cy={60} rx={10} ry={14} fill={C.tofuEar} stroke={C.ink} strokeWidth={3} transform="rotate(14 38 60)" />
          <ellipse cx={92} cy={60} rx={10} ry={14} fill={C.tofuEar} stroke={C.ink} strokeWidth={3} transform="rotate(-14 92 60)" />
          <ellipse cx={47} cy={66} rx={5} ry={3} fill={C.blush} />
          <ellipse cx={83} cy={66} rx={5} ry={3} fill={C.blush} />
          {sleeping ? (
            <g stroke={C.ink} strokeWidth={2.6} fill="none" strokeLinecap="round">
              <path d="M50 56 q5 4 10 0" />
              <path d="M70 56 q5 4 10 0" />
            </g>
          ) : mood === 'mischief' ? (
            <g>
              <circle cx={55} cy={56} r={5.5} fill={C.ink} />
              <path d="M70 56 q5 -4 10 0" stroke={C.ink} strokeWidth={2.8} fill="none" strokeLinecap="round" />
              <path d="M49 46 l10 3" stroke={C.ink} strokeWidth={2.4} strokeLinecap="round" />
              <circle cx={56.8} cy={54} r={1.8} fill={C.white} />
            </g>
          ) : mood === 'approve' ? (
            <g stroke={C.ink} strokeWidth={2.8} fill="none" strokeLinecap="round">
              <path d="M50 57 q5 -5 10 0" />
              <path d="M70 57 q5 -5 10 0" />
            </g>
          ) : (
            <g className="tofu-eyes">
              <circle cx={55} cy={56} r={mood === 'beg' ? 6.5 : 5.5} fill={C.ink} />
              <circle cx={75} cy={56} r={mood === 'beg' ? 6.5 : 5.5} fill={C.ink} />
              <circle cx={mood === 'innocent' ? 55.5 : 56.8} cy={mood === 'innocent' ? 52.8 : 54} r={mood === 'beg' ? 2.4 : 1.8} fill={C.white} />
              <circle cx={mood === 'innocent' ? 75.5 : 76.8} cy={mood === 'innocent' ? 52.8 : 54} r={mood === 'beg' ? 2.4 : 1.8} fill={C.white} />
              {mood === 'beg' && (
                <>
                  <circle cx={53} cy={58.5} r={1.1} fill={C.white} />
                  <circle cx={73} cy={58.5} r={1.1} fill={C.white} />
                </>
              )}
            </g>
          )}
          <ellipse cx={65} cy={65} rx={4.6} ry={3.4} fill={C.ink} />
          {mood === 'mischief' ? (
            <path d="M60 70 q6 4 11 -2" stroke={C.ink} strokeWidth={2.2} fill="none" strokeLinecap="round" />
          ) : (
            <path d="M60 69 q2.5 3 5 0 q2.5 3 5 0" stroke={C.ink} strokeWidth={2.2} fill="none" strokeLinecap="round" />
          )}
          {(mood === 'beg' || mood === 'happy') && <path d="M63 71 q2 6 4 0" fill={C.pink} stroke={C.ink} strokeWidth={1.6} />}
          {mood === 'innocent' && (
            <ellipse className="halo" cx={65} cy={10} rx={17} ry={4.5} fill="none" stroke={C.star} strokeWidth={3.5} />
          )}
          {mood === 'approve' && <StarShape x={100} y={22} r={7} className="twinkle" />}
        </g>
        {sleeping && (
          <text className="zzz" x={96} y={24} fontFamily="Fredoka, sans-serif" fontSize={16} fill={C.ink}>
            z z
          </text>
        )}
      </g>
    </svg>
  )
}

export type SimbaMood = 'happy' | 'innocent' | 'zoom' | 'proud'

/** Simba — an original grey/white Siberian Husky. Bigger, bouncier, chaotic. */
export function Simba({ mood = 'happy', x, y, width = 150, height, className = '', style, flip, label = 'Simba, a grey and white Siberian Husky' }: PetProps & { mood?: SimbaMood }) {
  return (
    <svg
      viewBox="0 -12 180 160"
      x={x}
      y={y}
      width={width}
      height={autoHeight(width, height, 160 / 180)}
      className={`art simba mood-${mood} ${className}`}
      style={style}
      role="img"
      aria-label={label}
      overflow="visible"
    >
      <g transform={flip ? 'translate(180 0) scale(-1 1)' : undefined}>
        <ellipse cx={88} cy={143} rx={52} ry={6} fill={C.ink} opacity={0.13} />
        {mood === 'zoom' && (
          <g stroke={C.ink} strokeWidth={3} strokeLinecap="round" opacity={0.5}>
            <path d="M4 70 h22 M0 90 h28 M8 110 h18" />
          </g>
        )}
        {/* tail */}
        <g className="simba-tail">
          <path d="M122 118 C 168 112 172 64 142 58 C 156 74 148 98 120 104 Z" fill={C.husky} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
          <path d="M142 58 C 152 66 154 76 150 84 C 146 74 142 68 136 62 Z" fill={C.huskyWhite} />
        </g>
        {/* body */}
        <ellipse cx={88} cy={110} rx={40} ry={32} fill={C.husky} stroke={C.ink} strokeWidth={4} />
        <path d="M66 92 C 74 120 102 120 110 92 C 104 132 72 132 66 92 Z" fill={C.huskyWhite} />
        <rect x={66} y={112} width={16} height={30} rx={8} fill={C.huskyWhite} stroke={C.ink} strokeWidth={3.5} />
        <rect x={94} y={112} width={16} height={30} rx={8} fill={C.huskyWhite} stroke={C.ink} strokeWidth={3.5} />
        {/* head */}
        <g className="simba-head">
          <path d="M54 42 L58 6 L82 30 Z" fill={C.husky} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
          <path d="M60 32 L61 15 L74 29 Z" fill={C.blush} />
          <path d="M122 42 L118 6 L94 30 Z" fill={C.husky} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
          <path d="M116 32 L115 15 L102 29 Z" fill={C.blush} />
          <circle cx={88} cy={62} r={36} fill={C.husky} stroke={C.ink} strokeWidth={4} />
          <path
            d="M58 66 C 58 50 72 46 79 56 L88 66 L97 56 C 104 46 118 50 118 66 C 120 88 104 98 88 98 C 72 98 56 88 58 66 Z"
            fill={C.huskyWhite}
          />
          <path d="M84 30 L88 50 L92 30 Z" fill={C.huskyWhite} opacity={0.9} />
          <ellipse cx={76} cy={47} rx={4.5} ry={2.6} fill={C.huskyWhite} />
          <ellipse cx={100} cy={47} rx={4.5} ry={2.6} fill={C.huskyWhite} />
          {mood === 'proud' ? (
            <g stroke={C.ink} strokeWidth={3} fill="none" strokeLinecap="round">
              <path d="M71 62 q5 -5 10 0" />
              <path d="M95 62 q5 -5 10 0" />
            </g>
          ) : (
            <g>
              <circle cx={77} cy={62} r={5.8} fill={C.ink} />
              <circle cx={99} cy={62} r={5.8} fill={C.ink} />
              <circle cx={mood === 'innocent' ? 77.5 : 79} cy={mood === 'innocent' ? 59 : 60} r={2} fill={C.white} />
              <circle cx={mood === 'innocent' ? 99.5 : 101} cy={mood === 'innocent' ? 59 : 60} r={2} fill={C.white} />
            </g>
          )}
          <ellipse cx={88} cy={80} rx={15} ry={11} fill={C.huskyWhite} stroke={C.ink} strokeWidth={2.5} />
          <ellipse cx={88} cy={73} rx={6.5} ry={4.6} fill={C.ink} />
          <path d="M81 81 q7 6 14 0" stroke={C.ink} strokeWidth={2.4} fill="none" strokeLinecap="round" />
          {mood !== 'innocent' && <path className="simba-tongue" d="M84 84 q4 14 8 0 Z" fill={C.pink} stroke={C.ink} strokeWidth={2} />}
          <ellipse cx={66} cy={78} rx={5} ry={3} fill={C.blush} opacity={0.8} />
          <ellipse cx={110} cy={78} rx={5} ry={3} fill={C.blush} opacity={0.8} />
          {mood === 'innocent' && <ellipse className="halo" cx={88} cy={-2} rx={22} ry={5} fill="none" stroke={C.star} strokeWidth={3.5} />}
        </g>
      </g>
    </svg>
  )
}

export function PawPrint({ x = 0, y = 0, s = 1, rot = 0 }: { x?: number; y?: number; s?: number; rot?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} fill={C.ink} opacity={0.55}>
      <ellipse cx={0} cy={4} rx={7} ry={6} />
      <circle cx={-7} cy={-5} r={3} />
      <circle cx={-2} cy={-9} r={3} />
      <circle cx={4} cy={-9} r={3} />
      <circle cx={8} cy={-4} r={3} />
    </g>
  )
}
