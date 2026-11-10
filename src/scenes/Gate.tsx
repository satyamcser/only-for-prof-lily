import { useEffect, useState, type FormEvent } from 'react'
import { Dubot } from '../art/Dubot'
import { useAuth } from '../auth/AuthProvider'
import { Spinner } from '../components/ui'
import { TAGLINE, TITLE, UNIVERSITY } from '../data/lore'
import { friendlyError } from '../lib/api'

function Sky() {
  return (
    <div className="gate-sky" aria-hidden="true">
      {Array.from({ length: 24 }, (_, i) => (
        <span key={i} className="sky-star twinkle" style={{ left: `${(i * 37) % 100}%`, top: `${(i * 23) % 60}%`, animationDelay: `${(i % 6) * 0.5}s` }} />
      ))}
    </div>
  )
}

export function BootScreen({ text = 'DUBOT is booting up…' }: { text?: string }) {
  return (
    <main className="gate">
      <Sky />
      <div className="gate-card card">
        <Dubot width={130} mood="sleepy" item="envelope" />
        <Spinner label={text} />
        <p>{text}</p>
      </div>
    </main>
  )
}

export function Unconfigured() {
  return (
    <main className="gate">
      <Sky />
      <div className="gate-card card">
        <Dubot width={130} mood="error" />
        <h1>{TITLE}</h1>
        <p>This build isn’t connected to its database yet, so nothing can be saved.</p>
        <p className="fine">
          Owner: add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> as GitHub repository variables, then re-run the
          “Deploy to GitHub Pages” workflow. See README → “Connect Supabase”.
        </p>
      </div>
    </main>
  )
}

export function Login() {
  const { api, urlError } = useAuth()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [phase, setPhase] = useState<'email' | 'sent' | 'password'>('email')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(urlError ? `${urlError}. Please request a new link.` : null)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(id)
  }, [cooldown])

  const send = async (e?: FormEvent) => {
    e?.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('That email looks a little unusual. Try again?')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await api.sendMagicLink(email.trim())
      setPhase('sent')
      setCooldown(60)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  const passwordSignIn = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api.signInWithPassword(email.trim(), password)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  const verify = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api.verifyCode(email.trim(), code.trim())
    } catch (err) {
      setError(`${friendlyError(err)} Codes expire after a while — you can request a new one.`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="gate">
      <Sky />
      <div className="gate-card card">
        <Dubot width={150} item="envelope" mood="happy" wave />
        <p className="envelope-label">Only for Professor Lily</p>
        <h1 className="gate-title">{TITLE}</h1>
        <p className="tagline">{TAGLINE}</p>
        <p className="eyebrow">{UNIVERSITY}</p>

        {api.mode === 'mock' ? (
          // Local preview only (npm run dev without Supabase): quick entry, no email.
          <div className="quick-enter">
            <button className="btn btn-primary btn-big" onClick={() => void api.mockSignIn?.('lily')}>
              Enter as Professor Lily
            </button>
            <button className="btn btn-mint btn-big" onClick={() => void api.mockSignIn?.('satyam')}>
              Enter as Researcher Satyam
            </button>
          </div>
        ) : phase === 'email' ? (
          <form className="login-form" onSubmit={send}>
            <label htmlFor="email">Your invited email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <button className="btn btn-primary btn-big" disabled={busy}>
              {busy ? 'Sending…' : 'Send me a magic link'}
            </button>
            <button type="button" className="btn btn-ghost btn-small" onClick={() => setPhase('password')}>
              I have a password instead
            </button>
            <p className="fine">Invitation-only. No tracking — just you, your invite and a tiny robot.</p>
          </form>
        ) : phase === 'password' ? (
          <form className="login-form" onSubmit={passwordSignIn}>
            <label htmlFor="email-pw">Your invited email</label>
            <input
              id="email-pw"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button className="btn btn-primary btn-big" disabled={busy || !password}>
              {busy ? 'Checking…' : 'Sign in'}
            </button>
            <button type="button" className="btn btn-ghost btn-small" onClick={() => setPhase('email')}>
              Email me a sign-in link instead
            </button>
          </form>
        ) : (
          <form className="login-form" onSubmit={verify}>
            <p className="sent-note">
              ✉️ Sent! Open the email on this device and tap the link — or type the 6-digit code from it here.
            </p>
            <label htmlFor="code">6-digit code (optional)</label>
            <input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6,8}"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
            />
            <button className="btn btn-primary" disabled={busy || code.length < 6}>
              {busy ? 'Checking…' : 'Sign in with code'}
            </button>
            <div className="row gap wrap center">
              <button type="button" className="btn btn-ghost btn-small" disabled={cooldown > 0 || busy} onClick={() => void send()}>
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend email'}
              </button>
              <button type="button" className="btn btn-ghost btn-small" onClick={() => setPhase('email')}>
                Use a different email
              </button>
            </div>
          </form>
        )}
        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}
      </div>
    </main>
  )
}

export function NotMember() {
  const { signOut, user } = useAuth()
  return (
    <main className="gate">
      <Sky />
      <div className="gate-card card">
        <Dubot width={130} mood="detective" />
        <h1>This tiny university is invitation-only.</h1>
        <p>You’re signed in{user?.email ? ` as ${user.email}` : ''}, but this account isn’t on the faculty list.</p>
        <p className="fine">If you think that’s a mistake, ask the person who invited you to add your account.</p>
        <button className="btn btn-primary" onClick={() => void signOut()}>
          Sign out
        </button>
      </div>
    </main>
  )
}

export function AuthError() {
  const { error, retry, signOut } = useAuth()
  return (
    <main className="gate">
      <Sky />
      <div className="gate-card card">
        <Dubot width={130} mood="error" />
        <h1>DUBOT tripped over a cable.</h1>
        <p role="alert">{error}</p>
        <div className="row gap center">
          <button className="btn btn-primary" onClick={retry}>
            Try again
          </button>
          <button className="btn" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </div>
    </main>
  )
}
