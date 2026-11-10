import { useState, type FormEvent } from 'react'
import { Dubot } from '../art/Dubot'
import { Avatar } from '../art/People'
import { useAuth } from '../auth/AuthProvider'
import { timeAgo } from '../components/ui'
import { encouragementsFor } from '../data/lore'
import { useShared } from '../hooks/useShared'
import { useUi } from '../hooks/useUi'
import { friendlyError } from '../lib/api'
import { sfx } from '../lib/sound'
import { REACTION_EMOJI, STICKERS, type Emoji, type Note, type PlayerSummary, type Sticker } from '../lib/types'

const MAX = 280

export function NoteCard({
  note,
  stickers,
  players,
  me,
  busy,
  onReact,
  onSticker,
  onEdit,
  onDelete,
}: {
  note: Note
  stickers: Note[]
  players: PlayerSummary[]
  me: string
  busy: boolean
  onReact: (n: Note, e: Emoji) => void
  onSticker: (n: Note, s: Sticker) => void
  onEdit: (n: Note, body: string) => Promise<boolean>
  onDelete: (n: Note) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(note.body)
  const [stickerOpen, setStickerOpen] = useState(false)
  const author = players.find((p) => p.userId === note.authorId)
  const mine = note.authorId === me
  const edited = note.updatedAt !== note.createdAt && new Date(note.updatedAt).getTime() - new Date(note.createdAt).getTime() > 1500
  return (
    <article className={`note card note-${note.kind} ${mine ? 'mine' : ''}`}>
      <header className="note-head">
        {author ? <Avatar role={author.role} headOnly width={36} /> : <span className="faculty-seal" aria-hidden="true">🏛️</span>}
        <div>
          <strong>{author ? author.displayName : 'Faculty notice board'}</strong>
          <time dateTime={note.createdAt} title={new Date(note.createdAt).toLocaleString()}>
            {timeAgo(note.createdAt)}
            {edited ? ' · edited' : ''}
          </time>
        </div>
        {note.kind === 'encouragement' && <span className="chip chip-blush">encouragement</span>}
      </header>
      {editing ? (
        <form
          className="note-edit"
          onSubmit={async (e) => {
            e.preventDefault()
            if (await onEdit(note, draft)) setEditing(false)
          }}
        >
          <label className="sr-only" htmlFor={`edit-${note.id}`}>
            Edit note
          </label>
          <textarea id={`edit-${note.id}`} value={draft} maxLength={MAX} onChange={(e) => setDraft(e.target.value)} rows={3} />
          <div className="row gap between">
            <span className="fine">
              {draft.length}/{MAX}
            </span>
            <span className="row gap">
              <button type="button" className="btn btn-small btn-ghost" onClick={() => setEditing(false)}>
                Cancel
              </button>
              <button className="btn btn-small btn-primary" disabled={busy || !draft.trim()}>
                Save
              </button>
            </span>
          </div>
        </form>
      ) : (
        // React escapes this text: notes can never inject HTML.
        <p className="note-body">{note.body}</p>
      )}
      <footer className="note-foot">
        <div className="reactions" role="group" aria-label="Reactions">
          {REACTION_EMOJI.map((e) => {
            const count = note.reactions.filter((r) => r.emoji === e).length
            const mineOn = note.reactions.some((r) => r.emoji === e && r.userId === me)
            return (
              <button key={e} className={`react ${mineOn ? 'on' : ''}`} aria-pressed={mineOn} aria-label={`React ${e}${count ? `, ${count}` : ''}`} disabled={busy} onClick={() => onReact(note, e)}>
                <span>{e}</span>
                {count > 0 && <small>{count}</small>}
              </button>
            )
          })}
        </div>
        <div className="note-actions">
          {!mine && (
            <button className="btn btn-small btn-ghost" onClick={() => setStickerOpen((o) => !o)} aria-expanded={stickerOpen}>
              Reply with a sticker
            </button>
          )}
          {mine && !editing && (
            <>
              <button className="btn btn-small btn-ghost" onClick={() => setEditing(true)}>
                Edit
              </button>
              <button className="btn btn-small btn-ghost danger" onClick={() => onDelete(note)}>
                Remove
              </button>
            </>
          )}
        </div>
      </footer>
      {stickerOpen && (
        <div className="sticker-picker" role="group" aria-label="Choose a sticker">
          {STICKERS.map((s) => (
            <button
              key={s}
              className="sticker"
              onClick={() => {
                onSticker(note, s)
                setStickerOpen(false)
              }}
              aria-label={`Send sticker ${s}`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
      {stickers.length > 0 && (
        <div className="sticker-replies">
          {stickers.map((st) => {
            const who = players.find((p) => p.userId === st.authorId)
            return (
              <span key={st.id} className="sticker-chip" title={new Date(st.createdAt).toLocaleString()}>
                {st.body} <small>{who?.role === 'lily' ? 'Lily' : 'Satyam'}</small>
                {st.authorId === me && (
                  <button className="x" aria-label="Remove my sticker" onClick={() => onDelete(st)}>
                    ✕
                  </button>
                )}
              </span>
            )
          })}
        </div>
      )}
    </article>
  )
}

export function Notes() {
  const { api, member } = useAuth()
  const { notes, world, refresh, error, online } = useShared()
  const { toast, say } = useUi()
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)

  const act = async (fn: () => Promise<void>, ok?: string): Promise<boolean> => {
    setBusy(true)
    try {
      await fn()
      if (ok) toast(ok, 'good')
      await refresh()
      return true
    } catch (e) {
      toast(`Not saved: ${friendlyError(e)}`, 'error')
      return false
    } finally {
      setBusy(false)
    }
  }

  const post = async (e: FormEvent) => {
    e.preventDefault()
    const body = draft.trim()
    if (!body) return
    if (await act(() => api.postNote(body), 'Note pinned to the board.')) {
      setDraft('')
      sfx('pop')
      say('New letter submitted. Estimated length: doctoral dissertation.')
    }
  }

  const encourage = async () => {
    if (!member) return
    const options = encouragementsFor(member.role)
    const phrase = options[Math.floor(Math.random() * options.length)]
    if (await act(() => api.postNote(phrase, 'encouragement'), `Posted: “${phrase}”`)) sfx('star')
  }

  if (!member) return null
  const players = world?.players ?? []
  const top = (notes ?? []).filter((n) => n.kind !== 'sticker')
  const stickersFor = (id: string) => (notes ?? []).filter((n) => n.kind === 'sticker' && n.replyTo === id).reverse()
  const memberNotes = top.filter((n) => n.kind !== 'faculty')
  const faculty = top.filter((n) => n.kind === 'faculty')

  const card = (n: Note) => (
    <NoteCard
      key={n.id}
      note={n}
      stickers={stickersFor(n.id)}
      players={players}
      me={member.userId}
      busy={busy}
      onReact={(note, e) => void act(() => api.setReaction(note.id, e, !note.reactions.some((r) => r.emoji === e && r.userId === member.userId)))}
      onSticker={(note, s) => void act(() => api.postSticker(note.id, s), 'Sticker sent!')}
      onEdit={(note, body) => act(() => api.editNote(note.id, body.trim()), 'Note updated.')}
      onDelete={(note) => {
        if (window.confirm('Remove this from the board? This can’t be undone.')) void act(() => api.deleteNote(note.id), 'Removed.')
      }}
    />
  )

  return (
    <div className="page notes-page">
      <header className="page-head">
        <h1>Letterbox</h1>
        <p>Short notes for the two of you. Only your two accounts can read them.</p>
      </header>
      {(!online || error) && (
        <p className="banner banner-warn" role="alert">
          {!online ? 'You’re offline — notes can’t be sent or refreshed right now.' : error}
        </p>
      )}
      <form className="compose card" onSubmit={post}>
        <label htmlFor="compose">Leave a little note</label>
        <textarea
          id="compose"
          value={draft}
          maxLength={MAX}
          rows={3}
          placeholder="Professor, DUBOT has submitted another flower as homework…"
          onChange={(e) => setDraft(e.target.value)}
        />
        <div className="row gap between wrap">
          <span className={`fine ${draft.length > MAX - 20 ? 'warn' : ''}`}>
            {draft.length}/{MAX}
          </span>
          <span className="row gap wrap">
            <button type="button" className="btn btn-blush" onClick={() => void encourage()} disabled={busy}>
              Send a little encouragement
            </button>
            <button className="btn btn-primary" disabled={busy || !draft.trim()}>
              Post note
            </button>
          </span>
        </div>
        <p className="fine">+3 ⭐ for your first note each day. Totally optional — no reply required, ever.</p>
      </form>

      {notes === null ? (
        <p className="fine center">Fetching letters…</p>
      ) : memberNotes.length === 0 ? (
        <div className="empty card">
          <Dubot width={120} item="envelope" mood="sleepy" />
          <p>DUBOT is waiting by the letterbox. No notes yet — the first one is yours whenever you like.</p>
        </div>
      ) : (
        <div className="note-list">{memberNotes.map(card)}</div>
      )}
      {faculty.length > 0 && (
        <section className="faculty-notices">
          <h2>Faculty notices</h2>
          <div className="note-list">{faculty.map(card)}</div>
        </section>
      )}
    </div>
  )
}
