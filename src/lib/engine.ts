import { SoundTouchNode } from '@soundtouchjs/audio-worklet'
import processorUrl from '@soundtouchjs/audio-worklet/processor?url'

export const EQ_FREQS = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000]

type PitchMedia = HTMLMediaElement & { webkitPreservesPitch?: boolean }

/**
 * Motore audio: un unico elemento <video> (legge sia audio sia video) collegato a una
 * catena Web Audio:
 *   sorgente -> [devocalizzatore] -> tonalità/velocità -> equalizzatore -> volume -> uscita
 * Il microfono entra in uscita da un percorso separato (con eco).
 */
class Engine {
  readonly media: HTMLVideoElement = document.createElement('video')
  private ctx: AudioContext | null = null
  private ready: Promise<void> | null = null

  private src!: MediaElementAudioSourceNode
  private splitter!: ChannelSplitterNode
  private gainL!: GainNode
  private gainR!: GainNode
  private sum!: GainNode
  private st!: SoundTouchNode
  private eq: BiquadFilterNode[] = []
  private master!: GainNode
  private outBus!: GainNode

  private micStream: MediaStream | null = null
  private micSrc: MediaStreamAudioSourceNode | null = null
  private micGain!: GainNode
  private echoDelay!: DelayNode
  private echoFeedback!: GainNode
  private echoSend!: GainNode

  private vocalOff = false
  private volume = 1
  private tempo = 1

  constructor() {
    this.media.crossOrigin = 'anonymous'
    this.media.preload = 'auto'
    this.media.playsInline = true
    this.media.style.width = '100%'
    this.media.style.height = '100%'
    this.media.style.objectFit = 'contain'
    this.media.style.background = '#000'
  }

  /** Crea la catena audio (una sola volta, al primo utilizzo). */
  init(): Promise<void> {
    if (!this.ready) this.ready = this.build()
    return this.ready
  }

  private async build(): Promise<void> {
    const ctx = new AudioContext({ latencyHint: 'interactive' })
    this.ctx = ctx
    await SoundTouchNode.register(ctx, processorUrl)

    this.src = ctx.createMediaElementSource(this.media)
    this.splitter = ctx.createChannelSplitter(2)
    this.gainL = ctx.createGain()
    this.gainR = ctx.createGain()
    this.gainR.gain.value = -1
    this.sum = ctx.createGain()
    this.sum.channelCount = 1
    this.sum.channelCountMode = 'explicit'

    this.st = new SoundTouchNode({ context: ctx })

    this.eq = EQ_FREQS.map((f) => {
      const b = ctx.createBiquadFilter()
      b.type = 'peaking'
      b.frequency.value = f
      b.Q.value = 1.4
      b.gain.value = 0
      return b
    })
    this.master = ctx.createGain()
    // ultimo anello: voce e musica passano di qui, così «Mono» le somma per tutti gli altoparlanti
    this.outBus = ctx.createGain()
    this.outBus.channelCountMode = 'explicit'
    this.outBus.channelCount = 2
    this.outBus.connect(ctx.destination)

    // catena principale
    this.st.connect(this.eq[0])
    for (let i = 0; i < this.eq.length - 1; i++) this.eq[i].connect(this.eq[i + 1])
    this.eq[this.eq.length - 1].connect(this.master)
    this.master.connect(this.outBus)

    // microfono + eco (collegato solo quando il microfono è acceso)
    this.micGain = ctx.createGain()
    this.micGain.gain.value = 1
    this.echoDelay = ctx.createDelay(1)
    this.echoDelay.delayTime.value = 0.28
    this.echoFeedback = ctx.createGain()
    this.echoFeedback.gain.value = 0.3
    this.echoSend = ctx.createGain()
    this.echoSend.gain.value = 0
    this.micGain.connect(this.outBus)
    this.micGain.connect(this.echoDelay)
    this.echoDelay.connect(this.echoFeedback)
    this.echoFeedback.connect(this.echoDelay)
    this.echoDelay.connect(this.echoSend)
    this.echoSend.connect(this.outBus)

    this.rewire()
  }

  private rewire(): void {
    this.src.disconnect()
    this.splitter.disconnect()
    this.gainL.disconnect()
    this.gainR.disconnect()
    this.sum.disconnect()
    if (this.vocalOff) {
      // voce al centro = L - R: la sottrazione la elimina (insieme ad altro materiale centrale)
      this.src.connect(this.splitter)
      this.splitter.connect(this.gainL, 0)
      this.splitter.connect(this.gainR, 1)
      this.gainL.connect(this.sum)
      this.gainR.connect(this.sum)
      this.sum.connect(this.st)
    } else {
      this.src.connect(this.st)
    }
  }

  /** Carica un file e aspetta che sia pronto. */
  async load(url: string): Promise<void> {
    await this.init()
    await new Promise<void>((resolve, reject) => {
      const ok = () => {
        cleanup()
        resolve()
      }
      const ko = () => {
        cleanup()
        reject(new Error('File non leggibile (formato non supportato o file mancante)'))
      }
      const cleanup = () => {
        this.media.removeEventListener('canplay', ok)
        this.media.removeEventListener('error', ko)
      }
      this.media.addEventListener('canplay', ok)
      this.media.addEventListener('error', ko)
      this.media.src = url
      this.media.load()
    })
    this.applyTempo()
  }

  async play(): Promise<void> {
    await this.init()
    await this.ctx?.resume()
    await this.media.play()
  }

  pause(): void {
    this.media.pause()
  }

  stop(): void {
    this.media.pause()
    this.media.removeAttribute('src')
    this.media.load()
  }

  seek(seconds: number): void {
    this.media.currentTime = Math.max(0, seconds)
  }

  get position(): number {
    return this.media.currentTime
  }

  get duration(): number {
    return Number.isFinite(this.media.duration) ? this.media.duration : 0
  }

  get isPlaying(): boolean {
    return !this.media.paused && !this.media.ended
  }

  // --- tonalità e velocità -------------------------------------------------

  private applyTempo(): void {
    const m = this.media as PitchMedia
    m.preservesPitch = false
    m.webkitPreservesPitch = false
    m.playbackRate = this.tempo
    if (this.st) this.st.playbackRate.value = this.tempo
  }

  setTempo(tempo: number): void {
    this.tempo = Math.min(1.5, Math.max(0.5, tempo))
    this.applyTempo()
  }

  setPitch(semitones: number): void {
    if (this.st) this.st.pitchSemitones.value = Math.min(12, Math.max(-12, semitones))
  }

  // --- mixer ---------------------------------------------------------------

  setVolume(v: number): void {
    this.volume = v
    if (this.master && this.ctx) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime)
      this.master.gain.setValueAtTime(v, this.ctx.currentTime)
    }
  }

  setEq(index: number, db: number): void {
    if (this.eq[index]) this.eq[index].gain.value = db
  }

  /** Mono: musica e voce vengono sommate su un solo canale e uscono uguali da sinistra e destra. */
  setOutputMono(mono: boolean): void {
    if (!this.outBus) return
    this.outBus.channelCount = mono ? 1 : 2
  }

  setVocalRemoval(on: boolean): void {
    this.vocalOff = on
    if (this.ctx) this.rewire()
  }

  /** Dissolvenza in uscita; alla fine il volume resta a zero finché non si richiama setVolume. */
  fadeOut(seconds: number): Promise<void> {
    if (!this.ctx || !this.master || seconds <= 0) return Promise.resolve()
    const t = this.ctx.currentTime
    this.master.gain.cancelScheduledValues(t)
    this.master.gain.setValueAtTime(this.master.gain.value, t)
    this.master.gain.linearRampToValueAtTime(0, t + seconds)
    return new Promise((r) => setTimeout(r, seconds * 1000))
  }

  /** Riporta il volume al valore impostato con una breve salita. */
  fadeIn(seconds = 0.6): void {
    if (!this.ctx || !this.master) return
    const t = this.ctx.currentTime
    this.master.gain.cancelScheduledValues(t)
    this.master.gain.setValueAtTime(0, t)
    this.master.gain.linearRampToValueAtTime(this.volume, t + seconds)
  }

  // --- microfono -----------------------------------------------------------

  async setMic(on: boolean): Promise<void> {
    await this.init()
    if (!this.ctx) return
    if (on && !this.micStream) {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1,
          // «latency» esiste nei browser ma non nei tipi di TypeScript
          ...({ latency: 0 } as MediaTrackConstraints),
        },
      })
      this.micSrc = this.ctx.createMediaStreamSource(this.micStream)
      this.micSrc.connect(this.micGain)
      await this.ctx.resume()
    } else if (!on && this.micStream) {
      this.micSrc?.disconnect()
      this.micStream.getTracks().forEach((t) => t.stop())
      this.micStream = null
      this.micSrc = null
    }
  }

  setMicVolume(v: number): void {
    if (this.micGain) this.micGain.gain.value = v
  }

  setEcho(amount: number): void {
    if (this.echoSend) this.echoSend.gain.value = amount
  }
}

export const engine = new Engine()
