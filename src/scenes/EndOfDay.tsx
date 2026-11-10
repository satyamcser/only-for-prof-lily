import { useEffect, useRef } from 'react'
import { C } from '../art/palette'

/** A gentle end-of-day moment: city windows light up, stars appear, 오늘도 수고했어요. */
export function EndOfDay({ onClose }: { onClose: () => void }) {
  const btn = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    btn.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  const buildings = [
    [0, 160, 70, 140],
    [74, 120, 54, 180],
    [132, 180, 80, 120],
    [216, 100, 50, 200],
    [270, 150, 90, 150],
    [364, 130, 60, 170],
    [428, 170, 72, 130],
  ]
  let n = 0
  return (
    <div className="end-of-day" role="dialog" aria-modal="true" aria-label="End of day">
      <svg viewBox="0 0 500 300" preserveAspectRatio="xMidYMax slice" className="eod-city" aria-hidden="true">
        <rect width="500" height="300" fill={C.midnight} />
        {Array.from({ length: 50 }, (_, i) => (
          <circle key={i} className="eod-star" style={{ animationDelay: `${1 + (i % 10) * 0.25}s` }} cx={(i * 89) % 500} cy={(i * 37) % 140} r={i % 7 === 0 ? 1.8 : 1} fill="#FFF3C9" />
        ))}
        <circle cx={420} cy={50} r={20} fill={C.yellow} className="eod-moon" />
        <circle cx={429} cy={43} r={17} fill={C.midnight} />
        {buildings.map(([x, y, w, h], b) => (
          <g key={b}>
            <rect x={x} y={y} width={w} height={h} fill="#232A55" />
            {Array.from({ length: Math.floor((h - 10) / 20) }, (_, r) =>
              Array.from({ length: Math.floor((w - 8) / 14) }, (_, c) => {
                n++
                return (
                  <rect
                    key={`${r}-${c}`}
                    x={x + 6 + c * 14}
                    y={y + 8 + r * 20}
                    width={7}
                    height={9}
                    className="eod-window"
                    style={{ animationDelay: `${(n * 0.037) % 3}s` }}
                  />
                )
              }),
            )}
          </g>
        ))}
      </svg>
      <div className="eod-text">
        <p className="eod-korean">오늘도 수고했어요 🤍</p>
        <p>You worked hard today, even if you didn’t finish everything.</p>
        <p className="eod-soft">Somebody in Daejeon hopes today was kind to you.</p>
        <button ref={btn} className="btn btn-primary" onClick={onClose}>
          Goodnight, campus
        </button>
      </div>
    </div>
  )
}
