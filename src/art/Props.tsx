// Small original SVG props. Each is drawn around a local origin (0,0) at the
// bottom-center so characters can "hold" them.
import { useId } from 'react'
import { C } from './palette'

export function Flower({ x = 0, y = 0, r = 6.5, color = C.pink }: { x?: number; y?: number; r?: number; color?: string }) {
  const petals = [0, 72, 144, 216, 288].map((a) => {
    const rad = ((a - 90) * Math.PI) / 180
    return <circle key={a} cx={x + Math.cos(rad) * r} cy={y + Math.sin(rad) * r} r={r} fill={color} stroke={C.ink} strokeWidth={2} />
  })
  return (
    <g>
      {petals}
      <circle cx={x} cy={y} r={r * 0.7} fill={C.star} stroke={C.ink} strokeWidth={2} />
    </g>
  )
}

export function FlowerWater() {
  return (
    <g className="prop-flowerwater">
      <path d="M0 -26 C -3 -40 4 -50 0 -64" stroke="#4E9A51" strokeWidth={3.5} fill="none" strokeLinecap="round" />
      <ellipse cx={-6} cy={-46} rx={7} ry={3.4} transform="rotate(-30 -6 -46)" fill={C.leaf} stroke={C.ink} strokeWidth={2} />
      <g className="prop-flower-head">
        <Flower y={-68} />
      </g>
      <path d="M-15 -42 L15 -42 L11 0 L-11 0 Z" fill={C.water} fillOpacity={0.55} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
      <path d="M-13.2 -26 L13.2 -26 L10.6 -2 L-10.6 -2 Z" fill="#9ED9F3" fillOpacity={0.85} />
      <path d="M-9 -36 L-7 -8" stroke={C.white} strokeWidth={2.5} strokeLinecap="round" opacity={0.8} />
      <circle cx={4} cy={-14} r={1.8} fill={C.white} />
      <circle cx={7} cy={-20} r={1.2} fill={C.white} />
    </g>
  )
}

export function IcedLatte({ fill = 1 }: { fill?: number }) {
  // fill 0..1 controls how full the cup looks.
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  const level = -3 - fill * 36
  return (
    <g className="prop-latte">
      <defs>
        <clipPath id={`cup-${id}`}>
          <path d="M-13.5 -42 L13.5 -42 L10 -1.5 L-10 -1.5 Z" />
        </clipPath>
      </defs>
      <rect x={1} y={-62} width={5} height={30} rx={2} transform="rotate(12 3 -47)" fill={C.pink} stroke={C.ink} strokeWidth={2} />
      <path d="M-15 -44 L15 -44 L11 0 L-11 0 Z" fill={C.white} fillOpacity={0.75} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
      {fill > 0 && (
        <g clipPath={`url(#cup-${id})`}>
          <rect x={-16} y={level} width={32} height={46} fill={C.coffee} />
          <rect x={-16} y={level} width={32} height={10} fill={C.foam} />
          <rect x={-9} y={level + 3} width={8} height={8} rx={2} fill={C.white} fillOpacity={0.85} stroke="#9CC9D9" strokeWidth={1.5} />
          <rect x={2} y={level + 7} width={7} height={7} rx={2} fill={C.white} fillOpacity={0.85} stroke="#9CC9D9" strokeWidth={1.5} />
        </g>
      )}
      <path d="M-9 -36 L-7 -8" stroke={C.white} strokeWidth={2.5} strokeLinecap="round" opacity={0.7} />
    </g>
  )
}

export function Envelope({ label = false }: { label?: boolean }) {
  return (
    <g className="prop-envelope">
      <rect x={-26} y={-36} width={52} height={34} rx={4} fill={C.cream} stroke={C.ink} strokeWidth={3} />
      <path d="M-26 -36 L0 -16 L26 -36" fill="none" stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
      <path d="M0 -12 c-6 -4 -5 -10 0 -7 c5 -3 6 3 0 7z" fill={C.rose} stroke={C.ink} strokeWidth={1.5} />
      {label && (
        <text x={0} y={-4} textAnchor="middle" fontSize={4.6} fontFamily="Fredoka, sans-serif" fill={C.ink}>
          Only for Professor Lily
        </text>
      )}
    </g>
  )
}

export function Magnifier() {
  return (
    <g className="prop-magnifier">
      <path d="M-6 -16 L-16 0" stroke="#8B5E3C" strokeWidth={7} strokeLinecap="round" />
      <circle cx={4} cy={-30} r={15} fill="#DFF4FF" fillOpacity={0.7} stroke={C.ink} strokeWidth={4} />
      <path d="M-3 -37 q5 -5 11 -3" stroke={C.white} strokeWidth={3} fill="none" strokeLinecap="round" />
    </g>
  )
}

export function Tray() {
  return (
    <g className="prop-tray">
      <g transform="translate(-10 -6) scale(0.55)">
        <IcedLatte />
      </g>
      <g transform="translate(11 -6) scale(0.55)">
        <IcedLatte />
      </g>
      <ellipse cx={0} cy={-3} rx={30} ry={6} fill="#C9CEDF" stroke={C.ink} strokeWidth={3} />
    </g>
  )
}

export function Sock({ color = C.pink }: { color?: string }) {
  return (
    <g className="prop-sock">
      <path
        d="M-6 -34 L8 -34 L8 -12 C 8 -4 4 0 -6 0 L-16 0 C -22 0 -22 -9 -16 -10 L-6 -12 Z"
        fill={color}
        stroke={C.ink}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <path d="M-6 -27 L8 -27 M-6 -21 L8 -21" stroke={C.white} strokeWidth={3} />
    </g>
  )
}

export function StarShape({ x = 0, y = 0, r = 10, fill = C.star, className }: { x?: number; y?: number; r?: number; fill?: string; className?: string }) {
  const pts: string[] = []
  for (let i = 0; i < 10; i++) {
    const rad = ((i * 36 - 90) * Math.PI) / 180
    const rr = i % 2 === 0 ? r : r * 0.45
    pts.push(`${(x + Math.cos(rad) * rr).toFixed(1)},${(y + Math.sin(rad) * rr).toFixed(1)}`)
  }
  return <polygon className={className} points={pts.join(' ')} fill={fill} stroke={C.ink} strokeWidth={r > 6 ? 2 : 1.2} strokeLinejoin="round" />
}

export function Heart({ x = 0, y = 0, s = 1, fill = C.pink }: { x?: number; y?: number; s?: number; fill?: string }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M0 6 C -10 -1 -8 -10 0 -6 C 8 -10 10 -1 0 6 Z"
      fill={fill}
      stroke={C.ink}
      strokeWidth={2 / s}
      strokeLinejoin="round"
    />
  )
}
