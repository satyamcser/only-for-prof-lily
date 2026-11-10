import { useState } from 'react'
import { Avatar } from '../art/People'
import { useAuth } from '../auth/AuthProvider'
import { useShared } from '../hooks/useShared'
import { useUi } from '../hooks/useUi'
import { navigate, type Route } from '../lib/route'
import { coins, formatWon, sharedStars } from '../lib/rules'
import { sfx } from '../lib/sound'

type IconName = 'campus' | 'play' | 'notes' | 'badges' | 'sound' | 'mute' | 'gear' | 'door'

export function Icon({ name }: { name: IconName }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} aria-hidden="true">
      {name === 'campus' && (
        <g {...p}>
          <path d="M3 10 L12 4 L21 10" />
          <path d="M5 10 V20 H19 V10" />
          <path d="M10 20 V14 H14 V20" />
        </g>
      )}
      {name === 'play' && (
        <g {...p}>
          <rect x={2.5} y={7} width={19} height={11} rx={5} />
          <path d="M7 11 V14 M5.5 12.5 H8.5" />
          <circle cx={16} cy={11.5} r={0.6} fill="currentColor" />
          <circle cx={18} cy={13.5} r={0.6} fill="currentColor" />
        </g>
      )}
      {name === 'notes' && (
        <g {...p}>
          <rect x={3} y={6} width={18} height={13} rx={2} />
          <path d="M3 7 L12 13 L21 7" />
        </g>
      )}
      {name === 'badges' && (
        <g {...p}>
          <circle cx={12} cy={9} r={5.5} />
          <path d="M8.5 13.5 L7 21 L12 18.5 L17 21 L15.5 13.5" />
        </g>
      )}
      {name === 'sound' && (
        <g {...p}>
          <path d="M4 9 H8 L13 5 V19 L8 15 H4 Z" />
          <path d="M16.5 9 q2 3 0 6 M19 7 q4 5 0 10" />
        </g>
      )}
      {name === 'mute' && (
        <g {...p}>
          <path d="M4 9 H8 L13 5 V19 L8 15 H4 Z" />
          <path d="M17 9.5 L21.5 14 M21.5 9.5 L17 14" />
        </g>
      )}
      {name === 'gear' && (
        <g {...p}>
          <circle cx={12} cy={12} r={3.2} />
          <path d="M12 2.8 V5.4 M12 18.6 V21.2 M21.2 12 H18.6 M5.4 12 H2.8 M18.5 5.5 L16.7 7.3 M7.3 16.7 L5.5 18.5 M18.5 18.5 L16.7 16.7 M7.3 7.3 L5.5 5.5" />
        </g>
      )}
      {name === 'door' && (
        <g {...p}>
          <path d="M14 4 H6 V20 H14" />
          <path d="M10 12 H21 M17 8 L21 12 L17 16" />
        </g>
      )}
    </svg>
  )
}

const TABS: { name: 'campus' | 'play' | 'notes' | 'badges'; label: string }[] = [
  { name: 'campus', label: 'Campus' },
  { name: 'play', label: 'Play' },
  { name: 'notes', label: 'Notes' },
  { name: 'badges', label: 'Badges' },
]

export function NavTabs({ route, variant }: { route: Route; variant: 'top' | 'bottom' }) {
  return (
    <nav className={`tabs tabs-${variant}`} aria-label="Main">
      {TABS.map((t) => {
        const active = route.name === t.name
        return (
          <a
            key={t.name}
            href={`#/${t.name}`}
            className={`tab ${active ? 'active' : ''}`}
            aria-current={active ? 'page' : undefined}
            onClick={() => sfx('tap')}
          >
            <Icon name={t.name} />
            <span>{t.label}</span>
          </a>
        )
      })}
    </nav>
  )
}

export function TopBar({ route }: { route: Route }) {
  const { member, signOut } = useAuth()
  const { world } = useShared()
  const { prefs, setPrefs, bubble, toast } = useUi()
  const [menu, setMenu] = useState(false)
  const [shake, setShake] = useState(false)
  if (!member) return null
  const total = world ? sharedStars(world) : 0
  const won = world ? coins(world) : 0

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="me-wrap">
          <button className="me" onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-haspopup="menu" aria-label={`${member.displayName} menu`}>
            <span className="me-avatar">
              <Avatar role={member.role} headOnly width={38} />
            </span>
            <span className="me-name">{member.displayName}</span>
          </button>
          {bubble && (
            <div className="me-bubble pop-in" role="status">
              {bubble}
            </div>
          )}
          {menu && (
            <div className="me-menu card" role="menu" onClick={() => setMenu(false)}>
              <button role="menuitem" onClick={() => navigate({ name: 'faculty' })}>
                Faculty Office & scores
              </button>
              <button role="menuitem" onClick={() => navigate({ name: 'settings' })}>
                Settings
              </button>
              <button role="menuitem" onClick={() => void signOut()}>
                Sign out
              </button>
            </div>
          )}
        </div>
        <NavTabs route={route} variant="top" />
        <div className="topbar-right">
          <button className="chip chip-gold stat-chip" onClick={() => navigate({ name: 'faculty' })} aria-label={`Shared stars: ${total}. Open the Faculty Office.`}>
            ⭐ {total}
          </button>
          <button
            className={`chip stat-chip won-chip ${shake ? 'shake' : ''}`}
            aria-label={`Coffee budget ${formatWon(won)}. Request two lattes.`}
            onClick={() => {
              setShake(true)
              setTimeout(() => setShake(false), 500)
              sfx(won >= 11000 ? 'good' : 'bad')
              toast(won >= 11000 ? 'Two lattes: approved by the faculty!' : `Request for 2 lattes denied. Budget: ${formatWon(won)}.`)
            }}
          >
            {formatWon(won)}
          </button>
          <button className="icon-btn" onClick={() => setPrefs({ sound: !prefs.sound })} aria-pressed={prefs.sound} aria-label={prefs.sound ? 'Mute sound effects' : 'Turn on sound effects'}>
            <Icon name={prefs.sound ? 'sound' : 'mute'} />
          </button>
          <button className="icon-btn" onClick={() => navigate({ name: 'settings' })} aria-label="Settings">
            <Icon name="gear" />
          </button>
          <button className="icon-btn desktop-only" onClick={() => void signOut()} aria-label="Sign out">
            <Icon name="door" />
          </button>
        </div>
      </div>
    </header>
  )
}
