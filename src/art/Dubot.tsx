import type { CSSProperties, KeyboardEvent, MouseEvent } from 'react'
import { autoHeight, C } from './palette'
import { Envelope, FlowerWater, Heart, IcedLatte, Magnifier, Sock, StarShape, Tray } from './Props'

export type DubotMood = 'happy' | 'neutral' | 'proud' | 'error' | 'sleepy' | 'detective' | 'whisper'
export type DubotItem = 'none' | 'flowerWater' | 'latte' | 'envelope' | 'magnifier' | 'tray' | 'sock'
export type DubotAnim = 'bob' | 'wiggle' | 'shake' | 'roll' | 'none'

interface Props {
  mood?: DubotMood
  item?: DubotItem
  anim?: DubotAnim
  wave?: boolean
  className?: string
  style?: CSSProperties
  x?: number
  y?: number
  width?: number | string
  height?: number | string
  onAntenna?: () => void
  label?: string
}

function Eyes({ mood }: { mood: DubotMood }) {
  const glow = C.glow
  switch (mood) {
    case 'happy':
    case 'proud':
      return (
        <g stroke={glow} strokeWidth={6} fill="none" strokeLinecap="round">
          <path d="M52 70 q8 -14 16 0" />
          <path d="M92 70 q8 -14 16 0" />
        </g>
      )
    case 'error':
      return (
        <g stroke="#FF8FB1" strokeWidth={5} strokeLinecap="round">
          <path d="M54 56 l13 13 M67 56 l-13 13" />
          <path d="M94 56 l13 13 M107 56 l-13 13" />
        </g>
      )
    case 'sleepy':
      return (
        <g stroke={glow} strokeWidth={5} strokeLinecap="round">
          <path d="M52 66 h16" />
          <path d="M92 66 h16" />
        </g>
      )
    case 'detective':
      return (
        <g>
          <circle cx={60} cy={63} r={10} fill={glow} />
          <circle cx={63} cy={60} r={3} fill={C.ink} />
          <path d="M92 66 q8 -5 16 0" stroke={glow} strokeWidth={5} fill="none" strokeLinecap="round" />
        </g>
      )
    case 'whisper':
      return (
        <g fill={glow}>
          <circle cx={68} cy={64} r={5} />
          <circle cx={104} cy={64} r={5} />
        </g>
      )
    default:
      return (
        <g className="dubot-blink" fill={glow}>
          <rect x={54} y={54} width={13} height={20} rx={6} />
          <rect x={93} y={54} width={13} height={20} rx={6} />
        </g>
      )
  }
}

function Mouth({ mood }: { mood: DubotMood }) {
  const p = { stroke: C.glow, strokeWidth: 4, fill: 'none', strokeLinecap: 'round' as const }
  switch (mood) {
    case 'happy':
    case 'proud':
      return <path d="M71 80 q9 9 18 0" {...p} />
    case 'error':
      return <path d="M68 84 l6 -5 l6 5 l6 -5 l6 5" {...p} stroke="#FF8FB1" />
    case 'sleepy':
      return <circle cx={80} cy={83} r={3} fill={C.glow} />
    case 'whisper':
      return <circle cx={88} cy={82} r={3.5} {...p} strokeWidth={3} />
    case 'detective':
      return <path d="M73 83 q7 -4 14 0" {...p} />
    default:
      return <path d="M73 82 h14" {...p} />
  }
}

function Item({ item }: { item: DubotItem }) {
  switch (item) {
    case 'flowerWater':
      return <FlowerWater />
    case 'latte':
      return <IcedLatte />
    case 'envelope':
      return <Envelope />
    case 'magnifier':
      return <Magnifier />
    case 'tray':
      return <Tray />
    case 'sock':
      return <Sock />
    default:
      return null
  }
}

/** DUBOT — original robot character. Mint shell, heart antenna, expressive screen. */
export function Dubot({
  mood = 'happy',
  item = 'none',
  anim = 'bob',
  wave = false,
  className = '',
  style,
  x,
  y,
  width = 160,
  height,
  onAntenna,
  label = 'DUBOT the robot',
}: Props) {
  const holding = item !== 'none'
  const antennaProps = onAntenna
    ? {
        role: 'button',
        tabIndex: 0,
        'aria-label': 'DUBOT’s antenna',
        onClick: (e: MouseEvent) => {
          e.stopPropagation()
          onAntenna()
        },
        onKeyDown: (e: KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            e.stopPropagation()
            onAntenna()
          }
        },
        style: { cursor: 'pointer' } as CSSProperties,
      }
    : {}
  return (
    <svg
      viewBox="-10 -20 190 215"
      x={x}
      y={y}
      width={width}
      height={autoHeight(width, height, 215 / 190)}
      className={`art dubot anim-${anim} ${className}`}
      style={style}
      role="img"
      aria-label={label}
      overflow="visible"
    >
      <ellipse cx={80} cy={183} rx={46} ry={6} fill={C.ink} opacity={0.14} />
      <g className="dubot-rig">
        {/* antenna */}
        <g className="dubot-antenna" {...antennaProps}>
          <circle cx={80} cy={10} r={18} fill="transparent" />
          <path d="M80 30 L80 14" stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
          <Heart x={80} y={10} s={1.05} fill={C.blush} />
        </g>
        {/* wheels */}
        <rect x={44} y={150} width={72} height={20} rx={10} fill="#8E9BC0" stroke={C.ink} strokeWidth={4} />
        <g className="dubot-wheels">
          <circle cx={61} cy={171} r={10} fill={C.ink} />
          <circle cx={61} cy={171} r={4} fill="#DDE3F5" />
          <circle cx={99} cy={171} r={10} fill={C.ink} />
          <circle cx={99} cy={171} r={4} fill="#DDE3F5" />
        </g>
        {/* body */}
        <rect x={70} y={96} width={20} height={14} fill={C.mintDark} stroke={C.ink} strokeWidth={3} />
        <rect x={42} y={104} width={76} height={52} rx={18} fill={C.mintLight} stroke={C.ink} strokeWidth={4} />
        <rect x={57} y={114} width={46} height={28} rx={9} fill={C.yellow} stroke={C.ink} strokeWidth={3} />
        <Heart x={80} y={128} s={0.9} fill={C.pink} />
        {/* left arm (waves) */}
        <g className={wave ? 'dubot-arm-wave' : 'dubot-arm'}>
          <rect x={14} y={110} width={32} height={15} rx={7.5} transform="rotate(-28 44 118)" fill={C.mint} stroke={C.ink} strokeWidth={3.5} />
          <circle cx={18} cy={132} r={7} fill={C.mint} stroke={C.ink} strokeWidth={3} />
        </g>
        {/* head */}
        <circle cx={20} cy={66} r={8} fill={C.star} stroke={C.ink} strokeWidth={3} />
        <circle cx={140} cy={66} r={8} fill={C.star} stroke={C.ink} strokeWidth={3} />
        <rect x={22} y={30} width={116} height={74} rx={28} fill={C.mint} stroke={C.ink} strokeWidth={4} />
        <path d="M38 46 q10 -9 28 -9" stroke={C.white} strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.6} />
        <rect x={36} y={42} width={88} height={52} rx={18} fill={C.ink} />
        <ellipse cx={46} cy={84} rx={6} ry={3.6} fill={C.blush} opacity={0.9} />
        <ellipse cx={114} cy={84} rx={6} ry={3.6} fill={C.blush} opacity={0.9} />
        <Eyes mood={mood} />
        <Mouth mood={mood} />
        {mood === 'proud' && <StarShape x={120} y={34} r={8} className="twinkle" />}
        {/* right arm + item */}
        {holding ? (
          <g className="dubot-holding">
            <rect x={112} y={100} width={32} height={15} rx={7.5} transform="rotate(-48 116 108)" fill={C.mint} stroke={C.ink} strokeWidth={3.5} />
            <g transform="translate(142 88)">
              <Item item={item} />
              <circle cx={0} cy={-6} r={7} fill={C.mint} stroke={C.ink} strokeWidth={3} />
            </g>
          </g>
        ) : (
          <g>
            <rect x={114} y={110} width={32} height={15} rx={7.5} transform="rotate(28 116 118)" fill={C.mint} stroke={C.ink} strokeWidth={3.5} />
            <circle cx={142} cy={132} r={7} fill={C.mint} stroke={C.ink} strokeWidth={3} />
          </g>
        )}
        {mood === 'error' && (
          <g className="dubot-smoke" fill="#E3E7F0" stroke={C.ink} strokeWidth={2}>
            <circle cx={136} cy={22} r={7} />
            <circle cx={148} cy={10} r={5} />
            <circle cx={156} cy={0} r={3.5} />
          </g>
        )}
        {mood === 'sleepy' && (
          <text x={128} y={22} fontFamily="Fredoka, sans-serif" fontSize={18} fill={C.ink}>
            z
          </text>
        )}
      </g>
    </svg>
  )
}
