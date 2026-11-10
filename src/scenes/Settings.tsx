import { useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { useUi } from '../hooks/useUi'
import { useShared } from '../hooks/useShared'
import { friendlyError } from '../lib/api'
import { sfx } from '../lib/sound'
import type { Prefs } from '../lib/prefs'

function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { v: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <fieldset className="segmented">
      <legend>{label}</legend>
      <div className="seg-row">
        {options.map((o) => (
          <label key={o.v} className={value === o.v ? 'on' : ''}>
            <input type="radio" name={label} value={o.v} checked={value === o.v} onChange={() => onChange(o.v)} />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export function Settings({ onReplayIntro }: { onReplayIntro: () => void }) {
  const { api, member, signOut } = useAuth()
  const { refresh } = useShared()
  const { prefs, setPrefs, toast } = useUi()
  const [busy, setBusy] = useState(false)
  const [newPassword, setNewPassword] = useState('')

  const exportData = async () => {
    setBusy(true)
    try {
      const data = await api.exportMyData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `only-for-prof-lily-${member?.role ?? 'me'}-export.json`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 2000)
    } catch (e) {
      toast(`Export failed: ${friendlyError(e)}`, 'error')
    } finally {
      setBusy(false)
    }
  }

  const deleteNotes = async () => {
    if (!window.confirm('Delete ALL notes and stickers you wrote? This cannot be undone. Game history is kept.')) return
    setBusy(true)
    try {
      const n = await api.deleteAllMyNotes()
      toast(`Deleted ${n} note${n === 1 ? '' : 's'}.`, 'good')
      await refresh()
    } catch (e) {
      toast(`Not deleted: ${friendlyError(e)}`, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page settings">
      <header className="page-head">
        <h1>Settings</h1>
      </header>
      <section className="card stack">
        <label className="toggle">
          <input
            type="checkbox"
            checked={prefs.sound}
            onChange={(e) => {
              setPrefs({ sound: e.target.checked })
              if (e.target.checked) setTimeout(() => sfx('pop'), 30)
            }}
          />
          <span>Sound effects (tiny original blips — no music)</span>
        </label>
        <Segmented<Prefs['motion']>
          label="Animation"
          value={prefs.motion}
          onChange={(v) => setPrefs({ motion: v })}
          options={[
            { v: 'system', label: 'Match device' },
            { v: 'reduce', label: 'Reduced' },
            { v: 'full', label: 'Full' },
          ]}
        />
        <Segmented<Prefs['theme']>
          label="Display mode"
          value={prefs.theme}
          onChange={(v) => setPrefs({ theme: v })}
          options={[
            { v: 'day', label: 'Cozy day' },
            { v: 'night', label: 'Starry night' },
            { v: 'system', label: 'Match device' },
          ]}
        />
        <button className="btn" onClick={onReplayIntro}>
          Replay the intro
        </button>
      </section>

      <section className="card stack">
        <h2>Your data</h2>
        <ul className="data-list">
          <li>Saved in the shared database: your game results (score, stars, date), notes, stickers, reactions, faculty votes and which story cards you opened.</li>
          <li>Only your two invited accounts can read it. Nobody else — not even another signed-in account.</li>
          <li>Saved only on this device: sound, animation and display preferences.</li>
          <li>Never collected: photos, location, contacts, face data, medical details.</li>
        </ul>
        <div className="row gap wrap">
          <button className="btn" onClick={() => void exportData()} disabled={busy}>
            Export my notes & game history (JSON)
          </button>
          <button className="btn danger" onClick={() => void deleteNotes()} disabled={busy}>
            Delete all my notes
          </button>
        </div>
      </section>

      {api.mode === 'supabase' && (
        <section className="card stack">
          <h2>Password</h2>
          <form
            className="row gap wrap"
            onSubmit={async (e) => {
              e.preventDefault()
              setBusy(true)
              try {
                await api.updatePassword(newPassword)
                setNewPassword('')
                toast('Password updated. Only you know it now.', 'good')
              } catch (err) {
                toast(`Password not changed: ${friendlyError(err)}`, 'error')
              } finally {
                setBusy(false)
              }
            }}
          >
            <label className="sr-only" htmlFor="new-password">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              placeholder="New password (8+ characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button className="btn" disabled={busy || newPassword.length < 8}>
              Set my own password
            </button>
          </form>
          <p className="fine">If someone set up a starter password for you, change it here so only you know it.</p>
        </section>
      )}

      <section className="card stack">
        <p>
          Signed in as <strong>{member?.displayName}</strong>.
        </p>
        <button className="btn btn-primary" onClick={() => void signOut()}>
          Sign out
        </button>
      </section>
    </div>
  )
}
