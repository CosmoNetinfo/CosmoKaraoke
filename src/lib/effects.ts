/**
 * Effetti sonori creati dal programma stesso (nessun file da scaricare, nessun diritto d'autore).
 * Ogni effetto è sintetizzato con Web Audio: rumore filtrato, onde, inviluppi.
 */

export interface BuiltinEffect {
  id: string
  name: string
  /** durata approssimativa, in secondi */
  seconds: number
  play: (ctx: AudioContext, out: AudioNode, t0: number) => void
}

let noiseBuf: AudioBuffer | null = null
function noise(ctx: AudioContext): AudioBuffer {
  if (noiseBuf && noiseBuf.sampleRate === ctx.sampleRate) return noiseBuf
  const len = ctx.sampleRate * 2
  noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate)
  const d = noiseBuf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  return noiseBuf
}

function burst(
  ctx: AudioContext,
  out: AudioNode,
  t: number,
  opts: { dur: number; gain: number; type: BiquadFilterType; freq: number; q?: number },
): void {
  const src = ctx.createBufferSource()
  src.buffer = noise(ctx)
  const f = ctx.createBiquadFilter()
  f.type = opts.type
  f.frequency.value = opts.freq
  f.Q.value = opts.q ?? 0.8
  const g = ctx.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(opts.gain, t + 0.002)
  g.gain.exponentialRampToValueAtTime(0.0001, t + opts.dur)
  src.connect(f).connect(g).connect(out)
  src.start(t, Math.random() * 1.5, opts.dur + 0.05)
}

function tone(
  ctx: AudioContext,
  out: AudioNode,
  t: number,
  opts: {
    type: OscillatorType
    from: number
    to?: number
    dur: number
    gain: number
    attack?: number
    lowpass?: number
    vibrato?: number
  },
): void {
  const o = ctx.createOscillator()
  o.type = opts.type
  o.frequency.setValueAtTime(opts.from, t)
  if (opts.to) o.frequency.exponentialRampToValueAtTime(opts.to, t + opts.dur)
  const g = ctx.createGain()
  const a = opts.attack ?? 0.01
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(opts.gain, t + a)
  g.gain.setValueAtTime(opts.gain, t + Math.max(a, opts.dur - 0.08))
  g.gain.linearRampToValueAtTime(0, t + opts.dur)
  let node: AudioNode = o
  if (opts.lowpass) {
    const f = ctx.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = opts.lowpass
    o.connect(f)
    node = f
  }
  if (opts.vibrato) {
    const lfo = ctx.createOscillator()
    lfo.frequency.value = opts.vibrato
    const depth = ctx.createGain()
    depth.gain.value = opts.from * 0.02
    lfo.connect(depth).connect(o.frequency)
    lfo.start(t)
    lfo.stop(t + opts.dur + 0.1)
  }
  node.connect(g).connect(out)
  o.start(t)
  o.stop(t + opts.dur + 0.1)
}

function applause(
  ctx: AudioContext,
  out: AudioNode,
  t0: number,
  dur: number,
  density: number,
): void {
  const n = Math.floor(dur * density)
  for (let i = 0; i < n; i++) {
    // più battiti al centro del tempo, meno all'inizio e alla fine
    const x = (Math.random() + Math.random()) / 2
    burst(ctx, out, t0 + x * dur, {
      dur: 0.02 + Math.random() * 0.03,
      gain: 0.25 + Math.random() * 0.35,
      type: 'bandpass',
      freq: 1200 + Math.random() * 2600,
      q: 0.9,
    })
  }
  // fruscio di fondo
  burst(ctx, out, t0, { dur, gain: 0.12, type: 'bandpass', freq: 2200, q: 0.5 })
}

function crash(ctx: AudioContext, out: AudioNode, t: number): void {
  burst(ctx, out, t, { dur: 1.4, gain: 0.5, type: 'highpass', freq: 5500, q: 0.7 })
}

function kick(ctx: AudioContext, out: AudioNode, t: number): void {
  tone(ctx, out, t, { type: 'sine', from: 160, to: 45, dur: 0.22, gain: 1, attack: 0.002 })
}

function snare(ctx: AudioContext, out: AudioNode, t: number, gain = 0.6): void {
  burst(ctx, out, t, { dur: 0.14, gain, type: 'bandpass', freq: 2200, q: 0.6 })
  tone(ctx, out, t, {
    type: 'triangle',
    from: 210,
    to: 140,
    dur: 0.1,
    gain: gain * 0.5,
    attack: 0.002,
  })
}

export const BUILTIN_EFFECTS: BuiltinEffect[] = [
  { id: 'applausi', name: 'Applausi', seconds: 3.5, play: (c, o, t) => applause(c, o, t, 3.2, 90) },
  {
    id: 'ovazione',
    name: 'Ovazione',
    seconds: 6,
    play: (c, o, t) => {
      applause(c, o, t, 5.5, 150)
      // «voci» della folla: rumore stretto che cresce e cala
      const src = c.createBufferSource()
      src.buffer = noise(c)
      src.loop = true
      const f = c.createBiquadFilter()
      f.type = 'bandpass'
      f.frequency.value = 900
      f.Q.value = 1.2
      const g = c.createGain()
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(0.35, t + 1.5)
      g.gain.linearRampToValueAtTime(0.25, t + 4)
      g.gain.linearRampToValueAtTime(0, t + 5.8)
      src.connect(f).connect(g).connect(o)
      src.start(t)
      src.stop(t + 6)
    },
  },
  {
    id: 'fischio',
    name: 'Fischio',
    seconds: 1,
    play: (c, o, t) => {
      tone(c, o, t, { type: 'sine', from: 1700, to: 2700, dur: 0.45, gain: 0.5, vibrato: 7 })
      tone(c, o, t + 0.45, { type: 'sine', from: 2700, to: 1800, dur: 0.45, gain: 0.5, vibrato: 7 })
    },
  },
  {
    id: 'rullo',
    name: 'Rullo di tamburi',
    seconds: 3,
    play: (c, o, t) => {
      const total = 1.8
      for (let x = 0; x < total; x += 0.045) {
        snare(c, o, t + x, 0.15 + (x / total) * 0.5)
      }
      kick(c, o, t + total)
      snare(c, o, t + total, 0.8)
      crash(c, o, t + total)
    },
  },
  {
    id: 'badumtss',
    name: 'Ba-dum-tss',
    seconds: 2,
    play: (c, o, t) => {
      kick(c, o, t)
      kick(c, o, t + 0.22)
      snare(c, o, t + 0.55, 0.8)
      crash(c, o, t + 0.55)
    },
  },
  {
    id: 'tromba',
    name: 'Tromba da stadio',
    seconds: 2,
    play: (c, o, t) => {
      for (const [dt, dur] of [
        [0, 0.35],
        [0.45, 0.35],
        [0.9, 0.9],
      ] as const) {
        for (const f of [349, 440, 523]) {
          tone(c, o, t + dt, {
            type: 'sawtooth',
            from: f,
            to: f * 0.985,
            dur,
            gain: 0.22,
            lowpass: 2600,
            attack: 0.02,
          })
        }
      }
    },
  },
  {
    id: 'fanfara',
    name: 'Fanfara',
    seconds: 2.2,
    play: (c, o, t) => {
      const notes = [
        [262, 0, 0.16],
        [330, 0.16, 0.16],
        [392, 0.32, 0.16],
        [523, 0.48, 0.9],
      ] as const
      for (const [f, dt, dur] of notes) {
        tone(c, o, t + dt, { type: 'square', from: f, dur, gain: 0.35, lowpass: 2400 })
        tone(c, o, t + dt, { type: 'sawtooth', from: f * 2, dur, gain: 0.15, lowpass: 3000 })
      }
    },
  },
  {
    id: 'campanello',
    name: 'Campanello',
    seconds: 2,
    play: (c, o, t) => {
      for (const [m, g] of [
        [1, 0.5],
        [2.76, 0.25],
        [5.4, 0.12],
      ] as const) {
        const osc = c.createOscillator()
        osc.type = 'sine'
        osc.frequency.value = 880 * m
        const gain = c.createGain()
        gain.gain.setValueAtTime(g, t)
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.8)
        osc.connect(gain).connect(o)
        osc.start(t)
        osc.stop(t + 1.9)
      }
    },
  },
  {
    id: 'trombone',
    name: 'Trombone triste',
    seconds: 3,
    play: (c, o, t) => {
      const notes = [
        [233, 0, 0.45],
        [220, 0.5, 0.45],
        [208, 1, 0.45],
        [196, 1.5, 1.3],
      ] as const
      for (const [f, dt, dur] of notes) {
        tone(c, o, t + dt, {
          type: 'sawtooth',
          from: f,
          to: dt > 1.4 ? f * 0.8 : f,
          dur,
          gain: 0.3,
          lowpass: 900,
          attack: 0.05,
          vibrato: dt > 1.4 ? 6 : undefined,
        })
      }
    },
  },
  {
    id: 'errore',
    name: 'Errore',
    seconds: 1,
    play: (c, o, t) => {
      tone(c, o, t, { type: 'square', from: 150, dur: 0.8, gain: 0.25, lowpass: 900 })
      tone(c, o, t, { type: 'square', from: 156, dur: 0.8, gain: 0.25, lowpass: 900 })
    },
  },
]

let ctx: AudioContext | null = null

/** Suona un effetto interno. `volume` va da 0 a 1. */
export function playBuiltinEffect(id: string, volume: number): void {
  const fx = BUILTIN_EFFECTS.find((e) => e.id === id)
  if (!fx) return
  ctx ??= new AudioContext({ latencyHint: 'interactive' })
  void ctx.resume()
  const master = ctx.createGain()
  master.gain.value = volume
  // limitatore: gli effetti più forti (rullo, piatti) non devono saturare
  const limiter = ctx.createDynamicsCompressor()
  limiter.threshold.value = -8
  limiter.ratio.value = 12
  limiter.knee.value = 4
  master.connect(limiter).connect(ctx.destination)
  fx.play(ctx, master, ctx.currentTime + 0.02)
  setTimeout(
    () => {
      master.disconnect()
      limiter.disconnect()
    },
    (fx.seconds + 1) * 1000,
  )
}
