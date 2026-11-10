// Original, simplified chibi characters. Stylised on purpose — not likenesses.
import type { CSSProperties } from 'react'
import type { Role } from '../lib/types'
import { autoHeight, C } from './palette'
import { Flower, StarShape } from './Props'

export type LilyMood = 'neutral' | 'amused' | 'fakeAngry' | 'shy' | 'proud' | 'facepalm'
export type SatyamMood = 'neutral' | 'thoughtful' | 'silly' | 'proud' | 'happy'
export type AnyMood = LilyMood | SatyamMood

interface PersonProps {
  x?: number
  y?: number
  width?: number | string
  height?: number | string
  className?: string
  style?: CSSProperties
  headOnly?: boolean
}

const S = { stroke: C.ink, strokeWidth: 3.5, strokeLinejoin: 'round' as const }

function Blush() {
  return (
    <>
      <ellipse cx={44} cy={75} rx={5.5} ry={3.2} fill={C.blush} />
      <ellipse cx={76} cy={75} rx={5.5} ry={3.2} fill={C.blush} />
    </>
  )
}

function OpenEyes({ dx = 0, dy = 0 }: { dx?: number; dy?: number }) {
  return (
    <g className="person-blink">
      <ellipse cx={49 + dx} cy={66 + dy} rx={3.4} ry={4.4} fill={C.ink} />
      <ellipse cx={71 + dx} cy={66 + dy} rx={3.4} ry={4.4} fill={C.ink} />
      <circle cx={50.2 + dx} cy={64.4 + dy} r={1.3} fill={C.white} />
      <circle cx={72.2 + dx} cy={64.4 + dy} r={1.3} fill={C.white} />
    </g>
  )
}

const line = { stroke: C.ink, strokeWidth: 2.8, fill: 'none', strokeLinecap: 'round' as const }

function LilyFace({ mood }: { mood: LilyMood }) {
  switch (mood) {
    case 'amused':
      return (
        <g>
          <path d="M44 66 q5 -6 10 0 M66 66 q5 -6 10 0" {...line} />
          <path d="M53 76 q7 8 14 0 Z" fill={C.rose} stroke={C.ink} strokeWidth={2.2} strokeLinejoin="round" />
          <Blush />
        </g>
      )
    case 'fakeAngry':
      return (
        <g>
          <path d="M43 57 l11 4 M77 57 l-11 4" {...line} strokeWidth={3} />
          <OpenEyes dy={1} />
          <path d="M55 80 q5 -4 10 0" {...line} />
          <ellipse cx={42} cy={76} rx={6.5} ry={4} fill={C.pink} />
          <ellipse cx={78} cy={76} rx={6.5} ry={4} fill={C.pink} />
          <g stroke={C.rose} strokeWidth={3} fill="none" strokeLinecap="round">
            <path d="M88 44 q4 5 0 10 M96 44 q-4 5 0 10" />
          </g>
        </g>
      )
    case 'shy':
      return (
        <g>
          <path d="M44 68 q5 4 10 0 M66 68 q5 4 10 0" {...line} />
          <path d="M57 79 q3 2 6 0" {...line} />
          <ellipse cx={43} cy={75} rx={7} ry={4} fill={C.pink} opacity={0.85} />
          <ellipse cx={77} cy={75} rx={7} ry={4} fill={C.pink} opacity={0.85} />
          <path d="M39 76 l3 -4 M43 77 l3 -4 M74 77 l3 -4 M78 76 l3 -4" stroke={C.rose} strokeWidth={1.6} strokeLinecap="round" />
        </g>
      )
    case 'proud':
      return (
        <g>
          <path d="M44 67 q5 -5 10 0 M66 67 q5 -5 10 0" {...line} />
          <path d="M53 76 q7 7 14 0" {...line} />
          <Blush />
          <StarShape x={96} y={40} r={7} className="twinkle" />
        </g>
      )
    case 'facepalm':
      return (
        <g>
          <path d="M55 81 h10" {...line} />
          <Blush />
          <g className="facepalm-hand">
            <ellipse cx={58} cy={64} rx={21} ry={10} fill={C.skinLily} stroke={C.ink} strokeWidth={3} />
            <path d="M44 60 v8 M51 58 v11 M58 57 v12 M65 58 v11" stroke={C.ink} strokeWidth={1.8} strokeLinecap="round" opacity={0.6} />
          </g>
          <path d="M92 50 q4 6 0 9 q-4 -3 0 -9 Z" fill="#BFE6FA" stroke={C.ink} strokeWidth={1.8} />
        </g>
      )
    default:
      return (
        <g>
          <OpenEyes />
          <path d="M56 77 q4 3 8 0" {...line} />
          <Blush />
        </g>
      )
  }
}

function SatyamFace({ mood }: { mood: SatyamMood }) {
  switch (mood) {
    case 'thoughtful':
      return (
        <g>
          <OpenEyes dx={2} dy={-2} />
          <circle cx={62} cy={79} r={2.6} {...line} strokeWidth={2.4} />
          <Blush />
          <g fill={C.ink}>
            <circle cx={92} cy={38} r={2} />
            <circle cx={99} cy={33} r={2.6} />
            <circle cx={107} cy={27} r={3.2} />
          </g>
        </g>
      )
    case 'silly':
      return (
        <g>
          <ellipse cx={49} cy={66} rx={3.4} ry={4.4} fill={C.ink} />
          <path d="M66 66 q5 -5 10 0" {...line} />
          <path d="M53 76 q7 6 14 0" {...line} />
          <path d="M60 78 q3 8 6 0" fill={C.pink} stroke={C.ink} strokeWidth={1.8} />
          <Blush />
        </g>
      )
    case 'proud':
      return (
        <g>
          <path d="M44 67 q5 -5 10 0 M66 67 q5 -5 10 0" {...line} />
          <path d="M53 76 q7 7 14 0" {...line} />
          <Blush />
          <StarShape x={96} y={40} r={7} className="twinkle" />
        </g>
      )
    case 'happy':
      return (
        <g>
          <path d="M44 66 q5 -6 10 0 M66 66 q5 -6 10 0" {...line} />
          <path d="M53 76 q7 8 14 0 Z" fill={C.rose} stroke={C.ink} strokeWidth={2.2} strokeLinejoin="round" />
          <Blush />
        </g>
      )
    default:
      return (
        <g>
          <OpenEyes />
          <path d="M56 77 q4 3 8 0" {...line} />
          <Blush />
        </g>
      )
  }
}

export function Lily({ mood = 'neutral', x, y, width = 110, height, className = '', style, headOnly }: PersonProps & { mood?: LilyMood }) {
  return (
    <svg
      viewBox={headOnly ? '22 22 76 76' : '0 0 120 175'}
      x={x}
      y={y}
      width={width}
      height={autoHeight(width, height, headOnly ? 1 : 175 / 120)}
      className={`art person lily mood-${mood} ${className}`}
      style={style}
      role="img"
      aria-label="Professor Lily (cartoon)"
      overflow="visible"
    >
      {!headOnly && <ellipse cx={60} cy={168} rx={34} ry={5} fill={C.ink} opacity={0.13} />}
      <path d="M26 62 C 20 18 100 18 94 62 L 98 116 C 84 124 36 124 22 116 Z" fill={C.hairLily} {...S} />
      {!headOnly && (
        <g className="person-body">
          <path d="M30 116 C 26 140 30 152 34 162 L 86 162 C 90 152 94 140 90 116 C 84 102 36 102 30 116 Z" fill={C.white} {...S} />
          <path d="M49 103 L60 126 L71 103 Z" fill={C.lavDeep} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />
          <circle cx={57} cy={136} r={2.2} fill={C.lavDeep} />
          <circle cx={57} cy={147} r={2.2} fill={C.lavDeep} />
          <path d="M31 118 C 22 132 22 146 28 156" stroke={C.ink} strokeWidth={3.5} fill="none" strokeLinecap="round" />
          <path d="M89 118 C 98 132 98 146 92 156" stroke={C.ink} strokeWidth={3.5} fill="none" strokeLinecap="round" />
          <circle cx={28} cy={157} r={6} fill={C.skinLily} {...S} strokeWidth={3} />
          <circle cx={92} cy={157} r={6} fill={C.skinLily} {...S} strokeWidth={3} />
          <rect x={53} y={92} width={14} height={12} fill={C.skinLily} />
        </g>
      )}
      <circle cx={60} cy={62} r={30} fill={C.skinLily} {...S} />
      <path d="M30 62 C 26 34 46 26 62 28 C 82 28 96 42 90 64 C 84 52 74 46 64 43 C 56 52 44 58 30 62 Z" fill={C.hairLily} {...S} strokeWidth={3} />
      <g className="hair-clip">
        <Flower x={86} y={38} r={4.6} color={C.blush} />
      </g>
      <LilyFace mood={mood} />
    </svg>
  )
}

export function Satyam({ mood = 'neutral', x, y, width = 110, height, className = '', style, headOnly, notebook }: PersonProps & { mood?: SatyamMood; notebook?: boolean }) {
  return (
    <svg
      viewBox={headOnly ? '22 22 76 76' : '0 0 120 175'}
      x={x}
      y={y}
      width={width}
      height={autoHeight(width, height, headOnly ? 1 : 175 / 120)}
      className={`art person satyam mood-${mood} ${className}`}
      style={style}
      role="img"
      aria-label="Researcher Satyam (cartoon)"
      overflow="visible"
    >
      {!headOnly && (
        <g className="person-body">
          <ellipse cx={60} cy={168} rx={34} ry={5} fill={C.ink} opacity={0.13} />
          <path d="M28 118 C 24 140 28 152 32 162 L 88 162 C 92 152 96 140 92 118 C 86 102 34 102 28 118 Z" fill={C.hoodie} {...S} />
          <path d="M40 104 C 46 114 74 114 80 104 C 74 98 46 98 40 104 Z" fill={C.hoodieLight} stroke={C.ink} strokeWidth={2.5} />
          <path d="M54 112 v16 M66 112 v16" stroke={C.white} strokeWidth={2.4} strokeLinecap="round" />
          <rect x={44} y={138} width={32} height={14} rx={5} fill={C.hoodieLight} stroke={C.ink} strokeWidth={2.4} />
          <path d="M29 120 C 20 134 20 148 26 158" stroke={C.ink} strokeWidth={3.5} fill="none" strokeLinecap="round" />
          <path d="M91 120 C 100 134 100 148 94 158" stroke={C.ink} strokeWidth={3.5} fill="none" strokeLinecap="round" />
          <circle cx={26} cy={158} r={6} fill={C.skinSatyam} {...S} strokeWidth={3} />
          {notebook && (
            <g transform="rotate(-10 96 150)">
              <rect x={86} y={136} width={22} height={28} rx={3} fill={C.yellow} {...S} strokeWidth={3} />
              <path d="M90 144 h14 M90 150 h14 M90 156 h9" stroke={C.ink} strokeWidth={1.6} />
            </g>
          )}
          <circle cx={94} cy={158} r={6} fill={C.skinSatyam} {...S} strokeWidth={3} />
          <rect x={53} y={90} width={14} height={12} fill={C.skinSatyam} />
        </g>
      )}
      <circle cx={60} cy={62} r={30} fill={C.skinSatyam} {...S} />
      <path
        d="M30 58 C 26 30 48 22 64 26 C 84 26 96 40 90 58 C 86 50 80 45 73 45 C 69 50 61 49 57 44 C 50 51 40 53 30 58 Z"
        fill={C.hairSatyam}
        {...S}
        strokeWidth={3}
      />
      <path d="M46 31 l3 -9 l6 7 M62 26 l5 -8 l3 9" fill={C.hairSatyam} stroke={C.ink} strokeWidth={2.6} strokeLinejoin="round" />
      <SatyamFace mood={mood} />
    </svg>
  )
}

export function Avatar({ role, mood, ...rest }: PersonProps & { role: Role; mood?: AnyMood }) {
  return role === 'lily' ? <Lily mood={(mood as LilyMood) ?? 'neutral'} {...rest} /> : <Satyam mood={(mood as SatyamMood) ?? 'neutral'} {...rest} />
}
