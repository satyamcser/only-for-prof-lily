import type { KeyboardEvent, ReactNode } from 'react'
import type { Role } from '../lib/types'
import { Dubot } from './Dubot'
import { C } from './palette'
import { Avatar } from './People'
import { PawPrint, Simba, Tofu, type TofuMood } from './Pets'
import { Flower, Heart, StarShape } from './Props'

export type PlaceId = 'lab' | 'cafe' | 'office' | 'park' | 'kitchen' | 'letterbox' | 'observatory'

export const PLACES: { id: PlaceId; name: string; x: number }[] = [
  { id: 'lab', name: 'Robotics Lab', x: 140 },
  { id: 'cafe', name: 'DUBOT Café', x: 400 },
  { id: 'office', name: 'Professor Lily’s Office', x: 675 },
  { id: 'park', name: 'Tofu & Simba Park', x: 930 },
  { id: 'kitchen', name: 'Vegetarian Detective Kitchen', x: 1160 },
  { id: 'letterbox', name: 'Memory Corner', x: 1335 },
  { id: 'observatory', name: 'Silvermoon Observatory', x: 1500 },
]

interface Props {
  myRole: Role
  otherRole: Role | null
  walkerX: number
  facingLeft: boolean
  selected: PlaceId | null
  onPlace: (id: PlaceId) => void
  onDubot: () => void
  onAntenna: () => void
  onTofu: () => void
  onSimba: () => void
  onMoon: () => void
  tofuMood: TofuMood
  pawprints: boolean
  dubotSays: boolean
}

function Hotspot({ id, label, selected, onPlace, children }: { id: PlaceId; label: string; selected: boolean; onPlace: (id: PlaceId) => void; children: ReactNode }) {
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onPlace(id)
    }
  }
  return (
    <g
      className={`hotspot ${selected ? 'is-selected' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={`Open ${label}`}
      onClick={() => onPlace(id)}
      onKeyDown={onKey}
    >
      {children}
    </g>
  )
}

function Sign({ x, y, w, text, color = C.cream }: { x: number; y: number; w: number; text: string; color?: string }) {
  return (
    <g className="scene-sign">
      <rect x={x - w / 2} y={y} width={w} height={30} rx={9} fill={color} stroke={C.ink} strokeWidth={3.5} />
      <text x={x} y={y + 21} textAnchor="middle" fontFamily="Fredoka, sans-serif" fontWeight={700} fontSize={16} fill={C.ink}>
        {text}
      </text>
    </g>
  )
}

function Window({ x, y, w = 34, h = 34, r = 6 }: { x: number; y: number; w?: number; h?: number; r?: number }) {
  return (
    <g>
      <rect className="window" x={x} y={y} width={w} height={h} rx={r} stroke={C.ink} strokeWidth={3} />
      <path d={`M${x + w / 2} ${y + 2} V${y + h - 2} M${x + 2} ${y + h / 2} H${x + w - 2}`} stroke={C.ink} strokeWidth={2} opacity={0.6} />
    </g>
  )
}

function Tree({ x, y, s = 1, color = C.mintDark }: { x: number; y: number; s?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className="sway">
      <rect x={-6} y={-30} width={12} height={34} rx={4} fill="#A0785A" stroke={C.ink} strokeWidth={3} />
      <circle cx={0} cy={-52} r={30} fill={color} stroke={C.ink} strokeWidth={3.5} />
      <circle cx={-16} cy={-40} r={18} fill={color} stroke={C.ink} strokeWidth={3.5} />
      <circle cx={16} cy={-40} r={18} fill={color} stroke={C.ink} strokeWidth={3.5} />
      <circle cx={-6} cy={-60} r={6} fill={C.white} opacity={0.35} />
    </g>
  )
}

const GROUND = 520

export function CampusScene(p: Props) {
  return (
    <svg className="campus-svg" viewBox="0 0 1600 640" role="group" aria-label="Campus map. Choose a building.">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="sky-top" />
          <stop offset="1" className="sky-bottom" />
        </linearGradient>
        <linearGradient id="dome" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#D9DDF3" />
        </linearGradient>
      </defs>
      <rect width="1600" height="640" fill="url(#sky)" />

      {/* stars (visible at night) */}
      <g className="night-only">
        {Array.from({ length: 40 }, (_, i) => (
          <circle key={i} className="twinkle" style={{ animationDelay: `${(i % 7) * 0.4}s` }} cx={(i * 397) % 1600} cy={20 + ((i * 131) % 230)} r={i % 5 === 0 ? 2.6 : 1.5} fill={C.star} />
        ))}
      </g>
      {/* clouds (day) */}
      <g className="day-only clouds">
        {[
          [160, 90],
          [620, 60],
          [1020, 110],
          [1300, 50],
        ].map(([cx, cy], i) => (
          <g key={i} className="cloud" style={{ animationDelay: `${i * -7}s` }}>
            <ellipse cx={cx} cy={cy} rx={60} ry={20} fill="#FFFFFF" opacity={0.9} />
            <ellipse cx={cx - 25} cy={cy - 12} rx={28} ry={20} fill="#FFFFFF" opacity={0.9} />
            <ellipse cx={cx + 20} cy={cy - 16} rx={32} ry={22} fill="#FFFFFF" opacity={0.9} />
          </g>
        ))}
      </g>

      {/* moon: end-of-day easter egg */}
      <g
        className="moon"
        role="button"
        tabIndex={0}
        aria-label="The moon. Tap for an end-of-day moment."
        onClick={p.onMoon}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            p.onMoon()
          }
        }}
      >
        <circle cx={1500} cy={86} r={40} fill="transparent" />
        <circle cx={1500} cy={86} r={30} fill={C.yellow} stroke={C.ink} strokeWidth={3.5} />
        <circle cx={1514} cy={76} r={26} className="moon-bite" />
        <circle cx={1488} cy={96} r={4} fill={C.star} opacity={0.6} />
      </g>

      {/* far hills and skyline */}
      <path d="M0 400 C 200 330 360 360 520 340 C 700 316 860 370 1040 336 C 1220 300 1400 350 1600 320 L1600 640 L0 640 Z" className="hill-far" />
      <g className="skyline">
        {[
          [40, 300, 46, 120],
          [92, 260, 30, 160],
          [580, 290, 40, 120],
          [626, 250, 26, 160],
          [1040, 280, 44, 130],
          [1090, 240, 30, 170],
          [1128, 300, 38, 110],
        ].map(([x, y, w, h], i) => (
          <g key={i}>
            <rect x={x} y={y} width={w} height={h} rx={4} className="tower" />
            {Array.from({ length: Math.floor(h / 26) }, (_, r) => (
              <rect key={r} x={x + 8} y={y + 10 + r * 26} width={w - 16} height={8} rx={2} className="tower-window" style={{ animationDelay: `${(i + r) * 0.3}s` }} />
            ))}
          </g>
        ))}
      </g>
      <path d="M0 460 C 240 420 420 450 640 430 C 860 410 1040 460 1260 430 C 1420 410 1520 420 1600 410 L1600 640 L0 640 Z" className="hill-near" />

      {/* ground & path */}
      <rect x={0} y={GROUND - 10} width={1600} height={140} className="grass" />
      <path d={`M0 ${GROUND + 40} C 300 ${GROUND + 20} 500 ${GROUND + 60} 800 ${GROUND + 40} C 1100 ${GROUND + 20} 1300 ${GROUND + 60} 1600 ${GROUND + 36} L1600 ${GROUND + 86} C 1300 ${GROUND + 108} 1100 ${GROUND + 70} 800 ${GROUND + 90} C 500 ${GROUND + 108} 300 ${GROUND + 70} 0 ${GROUND + 92} Z`} className="path" />
      {Array.from({ length: 26 }, (_, i) => (
        <ellipse key={i} cx={30 + i * 62} cy={GROUND + 64 + (i % 2 ? 6 : -4)} rx={10} ry={4} className="pebble" />
      ))}

      {/* 1. Robotics Lab */}
      <Hotspot id="lab" label="Robotics Lab" selected={p.selected === 'lab'} onPlace={p.onPlace}>
        <rect x={40} y={330} width={200} height={190} rx={10} fill={C.sky} stroke={C.ink} strokeWidth={4} />
        <rect x={30} y={318} width={220} height={22} rx={6} fill={C.hoodie} stroke={C.ink} strokeWidth={4} />
        <path d="M200 318 L200 270" stroke={C.ink} strokeWidth={4} />
        <path d="M176 280 a26 18 0 0 1 48 -16" fill={C.cream} stroke={C.ink} strokeWidth={4} transform="rotate(-20 200 272)" />
        <circle className="blink-light" cx={200} cy={266} r={6} fill={C.rose} stroke={C.ink} strokeWidth={2.5} />
        <Window x={62} y={360} w={60} h={50} />
        <Window x={158} y={360} w={60} h={50} />
        <g className="gear spin" style={{ transformOrigin: '92px 385px' }}>
          <circle cx={92} cy={385} r={12} fill="none" stroke={C.ink} strokeWidth={4} strokeDasharray="5 4" />
        </g>
        <rect x={110} y={440} width={56} height={80} rx={6} fill={C.mintDark} stroke={C.ink} strokeWidth={4} />
        <circle cx={155} cy={482} r={3.5} fill={C.ink} />
        <Sign x={140} y={428 - 160} w={150} text="ROBOTICS LAB" color={C.mintLight} />
      </Hotspot>

      {/* 2. DUBOT Café */}
      <Hotspot id="cafe" label="DUBOT Café" selected={p.selected === 'cafe'} onPlace={p.onPlace}>
        <rect x={290} y={340} width={220} height={180} rx={10} fill={C.cream} stroke={C.ink} strokeWidth={4} />
        <path d="M280 345 L400 280 L520 345 Z" fill={C.rose} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
        <g>
          {Array.from({ length: 6 }, (_, i) => (
            <path key={i} d={`M${290 + i * 37} 372 q18 22 37 0`} fill={i % 2 ? C.white : C.pink} stroke={C.ink} strokeWidth={3} />
          ))}
          <rect x={288} y={360} width={224} height={14} fill={C.pink} stroke={C.ink} strokeWidth={3} />
        </g>
        <rect x={306} y={396} width={110} height={70} rx={8} className="window" stroke={C.ink} strokeWidth={3.5} />
        <path d="M361 398 V464" stroke={C.ink} strokeWidth={2} opacity={0.5} />
        <rect x={432} y={420} width={58} height={100} rx={8} fill={C.blush} stroke={C.ink} strokeWidth={4} />
        <circle cx={478} cy={472} r={3.5} fill={C.ink} />
        <g transform="translate(400 300)">
          <rect x={-22} y={-14} width={44} height={30} rx={8} fill={C.white} stroke={C.ink} strokeWidth={3} />
          <path d="M22 -4 q12 0 10 10 q-2 8 -10 6" fill="none" stroke={C.ink} strokeWidth={3} />
          <path className="steam" d="M-8 -20 q-6 -8 0 -16 M6 -20 q-6 -8 0 -16" stroke={C.ink} strokeWidth={2.5} fill="none" strokeLinecap="round" opacity={0.6} />
        </g>
        {/* chalkboard */}
        <g transform="translate(250 470)">
          <path d="M0 50 L10 0 L50 0 L60 50" fill="none" stroke="#8B5E3C" strokeWidth={4} />
          <rect x={4} y={-6} width={52} height={40} rx={4} fill="#2F3B3A" stroke={C.ink} strokeWidth={3} />
          <text x={30} y={10} textAnchor="middle" fontSize={8} fill={C.white} fontFamily="Fredoka, sans-serif">
            TODAY:
          </text>
          <text x={30} y={21} textAnchor="middle" fontSize={7} fill={C.white} fontFamily="Fredoka, sans-serif">
            ICED LATTE
          </text>
          <text x={30} y={30} textAnchor="middle" fontSize={6} fill={C.blush} fontFamily="Fredoka, sans-serif">
            (probably)
          </text>
        </g>
        <Sign x={400} y={240} w={150} text="DUBOT CAFÉ" color={C.blush} />
      </Hotspot>

      {/* 3. Professor Lily's Office */}
      <Hotspot id="office" label="Professor Lily’s Office" selected={p.selected === 'office'} onPlace={p.onPlace}>
        <rect x={560} y={350} width={230} height={170} fill={C.lavender} stroke={C.ink} strokeWidth={4} />
        <path d="M545 352 L675 280 L805 352 Z" fill={C.lavDeep} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
        <circle cx={675} cy={322} r={18} fill={C.cream} stroke={C.ink} strokeWidth={3.5} />
        <text x={675} y={327} textAnchor="middle" fontSize={11} fontWeight={700} fontFamily="Pixelify Sans, monospace" fill={C.rose}>
          100
        </text>
        {[585, 630, 720, 765].map((x) => (
          <rect key={x} x={x - 9} y={366} width={18} height={140} rx={4} fill={C.cream} stroke={C.ink} strokeWidth={3} />
        ))}
        <rect x={648} y={430} width={54} height={90} rx={26} fill={C.lavDeep} stroke={C.ink} strokeWidth={4} />
        <rect x={552} y={506} width={246} height={16} rx={4} fill={C.cream} stroke={C.ink} strokeWidth={3.5} />
        <path d="M790 352 L790 300" stroke={C.ink} strokeWidth={3} />
        <path className="flag" d="M790 300 L822 310 L790 322 Z" fill={C.blush} stroke={C.ink} strokeWidth={2.5} />
        <Sign x={675} y={240} w={210} text="PROF. LILY’S OFFICE" color={C.lavender} />
      </Hotspot>

      {/* 4. Tofu & Simba Park */}
      <Hotspot id="park" label="Tofu & Simba Park" selected={p.selected === 'park'} onPlace={p.onPlace}>
        <Tree x={850} y={500} s={1.1} />
        <Tree x={1010} y={490} s={0.9} color={C.lavDeep} />
        <rect x={880} y={470} width={100} height={12} rx={5} fill="#C48E64" stroke={C.ink} strokeWidth={3} />
        <rect x={880} y={452} width={100} height={10} rx={5} fill="#C48E64" stroke={C.ink} strokeWidth={3} />
        <path d="M890 482 v22 M970 482 v22" stroke={C.ink} strokeWidth={4} />
        <Flower x={872} y={512} r={5} color={C.pink} />
        <Flower x={996} y={514} r={5} color={C.yellow} />
        <Sign x={930} y={330} w={190} text="TOFU & SIMBA PARK" color={C.yellow} />
      </Hotspot>

      {/* 5. Vegetarian Detective Kitchen */}
      <Hotspot id="kitchen" label="Vegetarian Detective Kitchen" selected={p.selected === 'kitchen'} onPlace={p.onPlace}>
        <rect x={1070} y={380} width={180} height={140} fill="#FDF1DC" stroke={C.ink} strokeWidth={4} />
        <path d="M1050 384 C 1080 372 1100 352 1110 336 L1210 336 C 1220 352 1240 372 1270 384 Z" fill="#4C5A73" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
        <path d="M1050 384 q-6 -10 4 -14 M1270 384 q6 -10 -4 -14" stroke={C.ink} strokeWidth={4} fill="none" />
        {[1080, 1110, 1140, 1170, 1200, 1230].map((x) => (
          <path key={x} d={`M${x} 346 v32`} stroke="#3A465C" strokeWidth={3} />
        ))}
        <rect x={1090} y={410} width={60} height={50} rx={6} className="window" stroke={C.ink} strokeWidth={3} />
        <rect x={1172} y={420} width={52} height={100} rx={6} fill="#C48E64" stroke={C.ink} strokeWidth={4} />
        <g transform="translate(1160 312)">
          <circle cx={0} cy={0} r={14} fill="#DFF4FF" stroke={C.ink} strokeWidth={4} />
          <path d="M10 10 L22 22" stroke="#8B5E3C" strokeWidth={6} strokeLinecap="round" />
        </g>
        <Sign x={1160} y={258} w={200} text="DETECTIVE KITCHEN" color={C.mintLight} />
      </Hotspot>

      {/* 6. Memory Corner / Letterbox */}
      <Hotspot id="letterbox" label="Memory Corner and Letterbox" selected={p.selected === 'letterbox'} onPlace={p.onPlace}>
        <rect x={1282} y={400} width={110} height={80} rx={6} fill="#C48E64" stroke={C.ink} strokeWidth={4} />
        <rect x={1290} y={408} width={94} height={64} rx={4} fill="#E8C9A0" />
        <rect x={1298} y={414} width={30} height={24} fill={C.white} stroke={C.ink} strokeWidth={2} transform="rotate(-6 1313 426)" />
        <rect x={1338} y={418} width={36} height={22} fill={C.blush} stroke={C.ink} strokeWidth={2} transform="rotate(5 1356 429)" />
        <rect x={1312} y={444} width={44} height={22} fill={C.yellow} stroke={C.ink} strokeWidth={2} transform="rotate(-3 1334 455)" />
        <path d="M1300 480 v40 M1374 480 v40" stroke={C.ink} strokeWidth={5} />
        <g transform="translate(1406 440)">
          <rect x={-16} y={0} width={32} height={80} rx={4} fill={C.rose} stroke={C.ink} strokeWidth={4} />
          <path d="M-16 0 a16 16 0 0 1 32 0" fill={C.rose} stroke={C.ink} strokeWidth={4} />
          <rect x={-10} y={10} width={20} height={5} rx={2} fill={C.ink} />
          <Heart x={0} y={34} s={0.9} fill={C.white} />
        </g>
        <Sign x={1340} y={356} w={160} text="MEMORY CORNER" color={C.cream} />
      </Hotspot>

      {/* 7. Silvermoon Observatory */}
      <Hotspot id="observatory" label="Silvermoon Observatory" selected={p.selected === 'observatory'} onPlace={p.onPlace}>
        <path d="M1430 520 C 1450 430 1560 430 1590 520 Z" className="hill-near" stroke={C.ink} strokeWidth={4} />
        <rect x={1460} y={400} width={110} height={70} fill={C.cream} stroke={C.ink} strokeWidth={4} />
        <path d="M1452 404 a63 60 0 0 1 126 0 Z" fill="url(#dome)" stroke={C.ink} strokeWidth={4} />
        <rect x={1506} y={350} width={18} height={54} fill={C.midnight} stroke={C.ink} strokeWidth={3} />
        <path d="M1515 360 L1556 322" stroke={C.ink} strokeWidth={9} strokeLinecap="round" />
        <path d="M1515 360 L1556 322" stroke={C.lavDeep} strokeWidth={5} strokeLinecap="round" />
        <rect x={1500} y={430} width={30} height={40} rx={14} fill={C.lavDeep} stroke={C.ink} strokeWidth={3.5} />
        <StarShape x={1572} y={320} r={9} className="twinkle" />
        <Sign x={1515} y={290} w={170} text="SILVERMOON" color={C.lavender} />
      </Hotspot>

      {/* Characters */}
      <g className="scene-pet" role="button" tabIndex={0} aria-label="Tofu. Tap to say hi." onClick={p.onTofu} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), p.onTofu())}>
        <Tofu x={872} y={462} width={86} mood={p.tofuMood} className="bounce-soft" />
      </g>
      <g className="scene-pet" role="button" tabIndex={0} aria-label="Simba. Tap to say hi." onClick={p.onSimba} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), p.onSimba())}>
        <Simba x={944} y={438} width={122} mood={p.pawprints ? 'zoom' : 'happy'} className="wiggle-soft" />
      </g>
      <g className="scene-dubot" role="button" tabIndex={-1} aria-label="DUBOT" onClick={p.onDubot}>
        <Dubot x={496} y={410} width={112} item="flowerWater" mood={p.dubotSays ? 'proud' : 'happy'} onAntenna={p.onAntenna} wave />
      </g>
      {p.otherRole && (
        <g className="scene-other" aria-hidden="true">
          <Avatar role={p.otherRole} x={p.otherRole === 'lily' ? 748 : 226} y={448} width={76} mood="neutral" className="idle-sway" />
        </g>
      )}
      <g className="walker" style={{ transform: `translateX(${p.walkerX - 40}px)` }} aria-hidden="true">
        <g style={{ transform: p.facingLeft ? 'scaleX(-1)' : undefined, transformOrigin: '40px 0', transformBox: 'view-box' }}>
          <Avatar role={p.myRole} x={0} y={470} width={80} mood={p.myRole === 'lily' ? 'amused' : 'happy'} className="walk-bob" />
        </g>
        <path d="M40 462 l-8 -10 h16 z" fill={C.rose} stroke={C.ink} strokeWidth={2.5} className="you-marker" />
      </g>

      {p.pawprints && (
        <g className="pawprints" aria-hidden="true">
          {Array.from({ length: 18 }, (_, i) => (
            <g key={i} className="paw" style={{ animationDelay: `${i * 0.12}s` }}>
              <PawPrint x={980 + (i - 9) * 70} y={GROUND + 70 + (i % 2 ? 14 : -10)} s={0.9} rot={90} />
            </g>
          ))}
        </g>
      )}
    </svg>
  )
}
