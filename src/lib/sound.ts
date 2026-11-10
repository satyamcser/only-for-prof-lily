// Tiny original sound effects synthesised with WebAudio (no audio files,
// no music). Muted by default; only plays after the player turns sound on.
type Sfx = 'tap' | 'good' | 'bad' | 'win' | 'lose' | 'star' | 'pop'

let enabled = false
let ctx: AudioContext | null = null

export function setSoundEnabled(v: boolean) {
  enabled = v
}

const TUNES: Record<Sfx, [number, number][]> = {
  tap: [[660, 0.05]],
  pop: [[880, 0.04], [1320, 0.05]],
  good: [[660, 0.07], [990, 0.09]],
  bad: [[220, 0.12], [180, 0.14]],
  star: [[1046, 0.06], [1318, 0.06], [1568, 0.1]],
  win: [[523, 0.09], [659, 0.09], [784, 0.09], [1046, 0.2]],
  lose: [[392, 0.12], [330, 0.12], [262, 0.22]],
}

export function sfx(name: Sfx) {
  if (!enabled) return
  try {
    ctx ??= new AudioContext()
    let t = ctx.currentTime
    for (const [freq, dur] of TUNES[name]) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = name === 'bad' || name === 'lose' ? 'triangle' : 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(0.12, t + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
      osc.connect(gain).connect(ctx.destination)
      osc.start(t)
      osc.stop(t + dur + 0.02)
      t += dur * 0.9
    }
  } catch {
    /* audio not available — silently skip */
  }
}
