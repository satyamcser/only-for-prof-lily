import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from './auth/AuthProvider'
import { NavTabs, TopBar } from './components/Chrome'
import { Toasts } from './components/ui'
import { EscapeGame } from './games/EscapeGame'
import { ExamGame } from './games/ExamGame'
import { LatteGame } from './games/LatteGame'
import { LaundryGame } from './games/LaundryGame'
import { ObservatoryGame } from './games/ObservatoryGame'
import { VeggieGame } from './games/VeggieGame'
import { SharedProvider, useShared } from './hooks/useShared'
import { UiProvider, useUi } from './hooks/useUi'
import type { Backend } from './lib/backend'
import { useRoute, type Route } from './lib/route'
import type { GameId, Member } from './lib/types'
import { Badges } from './scenes/Badges'
import { Campus } from './scenes/Campus'
import { Faculty } from './scenes/Faculty'
import { AuthError, BootScreen, Login, NotMember, Unconfigured } from './scenes/Gate'
import { Greeting } from './scenes/Greeting'
import { Notes } from './scenes/Notes'
import { PlayMenu } from './scenes/PlayMenu'
import { Settings } from './scenes/Settings'

const GREETED_KEY = 'only-for-prof-lily.greeted'

function readGreeted(uid: string): boolean {
  try {
    return sessionStorage.getItem(GREETED_KEY) === uid
  } catch {
    return false
  }
}

function GameScreen({ game }: { game: GameId }) {
  switch (game) {
    case 'latte_rescue':
      return <LatteGame />
    case 'laundry_crisis':
      return <LaundryGame />
    case 'totally_fair_exam':
      return <ExamGame />
    case 'observatory':
      return <ObservatoryGame />
    case 'veggie_detective':
      return <VeggieGame />
    case 'cafe_escape':
      return <EscapeGame />
  }
}

function Screen({ route, onReplayIntro }: { route: Route; onReplayIntro: () => void }) {
  switch (route.name) {
    case 'play':
      return route.game ? <GameScreen key={route.game} game={route.game} /> : <PlayMenu />
    case 'notes':
      return <Notes />
    case 'badges':
      return <Badges />
    case 'faculty':
      return <Faculty />
    case 'settings':
      return <Settings onReplayIntro={onReplayIntro} />
    default:
      return <Campus />
  }
}

function World({ member }: { member: Member }) {
  const route = useRoute()
  const { setPrefs } = useUi()
  const { loading, error, online, world, refresh } = useShared()
  const [greeted, setGreeted] = useState(() => readGreeted(member.userId))

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [route.name, route.name === 'play' ? route.game : null])

  if (!greeted) {
    return (
      <Greeting
        member={member}
        onEnter={() => {
          try {
            sessionStorage.setItem(GREETED_KEY, member.userId)
          } catch {
            /* ignore */
          }
          setGreeted(true)
        }}
      />
    )
  }

  const inGame = route.name === 'play' && Boolean(route.game)
  return (
    <div className={`app ${inGame ? 'in-game' : ''}`}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <TopBar route={route} />
      {!online && <p className="banner banner-warn">Offline: you can look around, but scores and notes won’t be saved until you reconnect.</p>}
      {online && error && (
        <p className="banner banner-warn" role="alert">
          {error}{' '}
          <button className="btn btn-small" onClick={() => void refresh()}>
            Retry
          </button>
        </p>
      )}
      <main id="main" className={`main route-${route.name}`} tabIndex={-1}>
        {loading && !world ? <p className="fine center pad-top">Loading the shared campus…</p> : <Screen route={route} onReplayIntro={() => {
          setPrefs({ introSeen: false })
          setGreeted(false)
        }} />}
      </main>
      {!inGame && <NavTabs route={route} variant="bottom" />}
    </div>
  )
}

function Root() {
  const { status, member } = useAuth()
  switch (status) {
    case 'loading':
      return <BootScreen />
    case 'signedOut':
      return <Login />
    case 'notMember':
      return <NotMember />
    case 'error':
      return <AuthError />
    case 'member':
      return member ? (
        <SharedProvider>
          <World member={member} />
        </SharedProvider>
      ) : (
        <BootScreen />
      )
  }
}

export function App({ backend }: { backend: Backend }) {
  if (backend.kind === 'unconfigured') return <Unconfigured />
  return (
    <UiProvider>
      <AuthProvider api={backend.api}>
        <Root />
        <Toasts />
      </AuthProvider>
    </UiProvider>
  )
}
