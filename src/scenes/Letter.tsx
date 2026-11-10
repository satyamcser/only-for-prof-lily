import { useEffect, useRef, useState } from 'react'
import { Dubot } from '../art/Dubot'
import { Envelope } from '../art/Props'
import { LETTER } from '../data/letter'
import { sfx } from '../lib/sound'
import type { Role } from '../lib/types'

const SEEN_KEY = 'only-for-prof-lily.letter-opened'

export function letterOpened(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === '1'
  } catch {
    return false
  }
}

function markOpened() {
  try {
    localStorage.setItem(SEEN_KEY, '1')
  } catch {
    /* fine: it just shows the "new" sparkle again next time */
  }
}

/** The sealed letter. Lily reads it; Satyam sees a preview of what she'll get. */
export function LetterModal({ viewer, onClose }: { viewer: Role; onClose: () => void }) {
  const [open, setOpen] = useState(false)
  const btn = useRef<HTMLButtonElement>(null)
  const paper = useRef<HTMLElement>(null)

  useEffect(() => {
    btn.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const unseal = () => {
    sfx('star')
    setOpen(true)
    if (viewer === 'lily') markOpened()
    requestAnimationFrame(() => paper.current?.focus({ preventScroll: true }))
  }

  return (
    <div className="modal-backdrop letter-backdrop" onClick={onClose}>
      <div className="letter-modal" role="dialog" aria-modal="true" aria-label={LETTER.title} onClick={(e) => e.stopPropagation()}>
        {!open ? (
          <div className="sealed">
            <Dubot width={120} item="envelope" mood="whisper" />
            <p className="sealed-note">
              {viewer === 'lily'
                ? 'DUBOT (whispering): “This one is not a flower. I checked twice.”'
                : 'Preview: this is the sealed letter Professor Lily will find on her account. Edit it in src/data/letter.ts.'}
            </p>
            <button ref={btn} className="seal-button" onClick={unseal} aria-label="Break the seal and read the letter">
              <svg viewBox="-34 -46 68 50" width="100%" aria-hidden="true">
                <Envelope />
              </svg>
              <span>Break the seal</span>
            </button>
            <button className="btn btn-ghost btn-small sealed-later" onClick={onClose}>
              Later
            </button>
          </div>
        ) : (
          <article className="paper" ref={paper} tabIndex={-1}>
            <p className="paper-eyebrow">{LETTER.title}</p>
            <p className="paper-greeting">{LETTER.greeting}</p>
            {LETTER.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            <p className="paper-closing">{LETTER.closing}</p>
            <p className="paper-signature">{LETTER.signature}</p>
            <button className="btn btn-primary" onClick={onClose}>
              Fold it back up
            </button>
          </article>
        )}
      </div>
    </div>
  )
}
