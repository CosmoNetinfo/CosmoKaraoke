import { Sequencer, WorkletSynthesizer } from 'spessasynth_lib'
import spessaProcessorUrl from 'spessasynth_lib/dist/spessasynth_processor.min.js?url'

export interface KarSyllable {
  text: string
  time: number
  duration: number
}

export interface KarLine {
  id: number
  startTime: number
  endTime: number
  text: string
  syllables: KarSyllable[]
}

export interface KarData {
  title: string
  artist: string
  duration: number
  lines: KarLine[]
}

interface RawMidiText {
  tick: number
  text: string
  type: number
}

interface TempoEvent {
  tick: number
  time: number
  usPerBeat: number
}

function readUint16(data: Uint8Array, offset: number): number {
  return (data[offset] << 8) | data[offset + 1]
}

function readUint32(data: Uint8Array, offset: number): number {
  return (
    ((data[offset] << 24) >>> 0) +
    (data[offset + 1] << 16) +
    (data[offset + 2] << 8) +
    data[offset + 3]
  )
}

function readVlq(data: Uint8Array, offset: number): [number, number] {
  let val = 0
  let read = 0
  while (offset + read < data.length) {
    const b = data[offset + read]
    read++
    val = (val << 7) | (b & 0x7f)
    if ((b & 0x80) === 0) break
  }
  return [val, read]
}

function decodeText(bytes: Uint8Array): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return new TextDecoder('windows-1252').decode(bytes)
  }
}

/**
 * Analizza un file MIDI/KAR ed estrae tempo, metadati e testi sillaba per sillaba.
 */
export function parseKar(bytes: Uint8Array): KarData {
  if (bytes.length < 14) {
    return { title: '', artist: '', duration: 0, lines: [] }
  }

  // Header chunk 'MThd'
  if (
    bytes[0] !== 0x4d ||
    bytes[1] !== 0x54 ||
    bytes[2] !== 0x68 ||
    bytes[3] !== 0x64
  ) {
    return { title: '', artist: '', duration: 0, lines: [] }
  }

  const division = readUint16(bytes, 12)
  const ticksPerQuarter = division & 0x8000 ? 480 : division

  const tempos: TempoEvent[] = [{ tick: 0, time: 0, usPerBeat: 500000 }]
  const rawTexts: RawMidiText[] = []
  let maxTick = 0
  let detectedTitle = ''
  let detectedArtist = ''

  let offset = 14
  while (offset + 8 <= bytes.length) {
    const isTrk =
      bytes[offset] === 0x4d &&
      bytes[offset + 1] === 0x54 &&
      bytes[offset + 2] === 0x72 &&
      bytes[offset + 3] === 0x6b
    const trkLen = readUint32(bytes, offset + 4)
    offset += 8
    if (!isTrk) {
      offset += trkLen
      continue
    }

    const trkEnd = Math.min(bytes.length, offset + trkLen)
    let curTick = 0
    let runningStatus = 0

    while (offset < trkEnd) {
      const [delta, dLen] = readVlq(bytes, offset)
      offset += dLen
      curTick += delta
      if (curTick > maxTick) maxTick = curTick

      if (offset >= trkEnd) break
      let status = bytes[offset]

      if ((status & 0x80) === 0) {
        status = runningStatus
      } else {
        offset++
        runningStatus = status
      }

      if (status === 0xff) {
        // Meta event
        if (offset >= trkEnd) break
        const metaType = bytes[offset++]
        const [metaLen, mLen] = readVlq(bytes, offset)
        offset += mLen
        const data = bytes.subarray(offset, Math.min(trkEnd, offset + metaLen))
        offset += metaLen

        if (metaType === 0x51 && data.length >= 3) {
          const usPerBeat = (data[0] << 16) | (data[1] << 8) | data[2]
          tempos.push({ tick: curTick, time: 0, usPerBeat })
        } else if (metaType === 0x01 || metaType === 0x05) {
          const txt = decodeText(data)
          if (txt) {
            rawTexts.push({ tick: curTick, text: txt, type: metaType })
          }
        } else if (metaType === 0x03 && !detectedTitle) {
          const trackName = decodeText(data).trim()
          if (trackName && !trackName.toLowerCase().startsWith('words')) {
            detectedTitle = trackName
          }
        }
      } else if (status === 0xf0 || status === 0xf7) {
        // SysEx
        const [sysLen, sLen] = readVlq(bytes, offset)
        offset += sLen + sysLen
      } else {
        const high = status & 0xf0
        if (high === 0xc0 || high === 0xd0) {
          offset += 1
        } else {
          offset += 2
        }
      }
    }
  }

  // Ordina i cambi di tempo per tick e calcola il tempo assoluto in secondi
  tempos.sort((a, b) => a.tick - b.tick)
  for (let i = 1; i < tempos.length; i++) {
    const prev = tempos[i - 1]
    const cur = tempos[i]
    const dticks = cur.tick - prev.tick
    const dsec = (dticks / ticksPerQuarter) * (prev.usPerBeat / 1000000)
    cur.time = prev.time + dsec
  }

  const tickToSeconds = (tick: number): number => {
    let best = tempos[0]
    for (let i = tempos.length - 1; i >= 0; i--) {
      if (tempos[i].tick <= tick) {
        best = tempos[i]
        break
      }
    }
    const dticks = tick - best.tick
    return best.time + (dticks / ticksPerQuarter) * (best.usPerBeat / 1000000)
  }

  const totalDuration = tickToSeconds(maxTick)

  // Ordina i testi cronologicamente
  rawTexts.sort((a, b) => a.tick - b.tick)

  // Raggruppa i testi in righe e sillabe
  const lines: KarLine[] = []
  let currentLineSyllables: KarSyllable[] = []
  let lineId = 0

  const pushCurrentLine = () => {
    if (currentLineSyllables.length === 0) return
    const first = currentLineSyllables[0]
    const last = currentLineSyllables[currentLineSyllables.length - 1]
    const startTime = first.time
    const endTime = Math.max(startTime + 0.5, last.time + last.duration)
    const text = currentLineSyllables.map((s) => s.text).join('')
    lines.push({
      id: lineId++,
      startTime,
      endTime,
      text,
      syllables: currentLineSyllables,
    })
    currentLineSyllables = []
  }

  for (let i = 0; i < rawTexts.length; i++) {
    const item = rawTexts[i]
    const raw = item.text

    // Ignora o estrai i tag di intestazione @...
    if (raw.startsWith('@')) {
      if (raw.startsWith('@T')) {
        const val = raw.slice(2).trim()
        if (!detectedTitle) {
          detectedTitle = val
        } else if (!detectedArtist) {
          detectedArtist = val
        }
      }
      continue
    }

    const isNewLine = raw.startsWith('/')
    const isNewPage = raw.startsWith('\\')
    let clean = isNewLine || isNewPage ? raw.slice(1) : raw

    // Gestione a capo interni
    const split = clean.split(/\r?\n/)
    for (let sIdx = 0; sIdx < split.length; sIdx++) {
      if (sIdx > 0 || isNewLine || isNewPage) {
        pushCurrentLine()
      }
      const part = split[sIdx]
      if (!part && sIdx > 0) continue

      const time = tickToSeconds(item.tick)
      // Stima durata sillaba fino alla successiva
      let duration = 0.4
      if (i + 1 < rawTexts.length) {
        const nextTime = tickToSeconds(rawTexts[i + 1].tick)
        if (nextTime > time) {
          duration = Math.min(3.0, nextTime - time)
        }
      }

      currentLineSyllables.push({
        text: part,
        time,
        duration,
      })
    }
  }
  pushCurrentLine()

  return {
    title: detectedTitle,
    artist: detectedArtist,
    duration: totalDuration,
    lines,
  }
}

/**
 * Traspone le note MIDI non percussive (canale != 9) nel buffer MIDI originale.
 */
export function transposeMidi(bytes: Uint8Array, semitones: number): Uint8Array {
  if (semitones === 0 || bytes.length < 14) return bytes
  const copy = new Uint8Array(bytes)
  let offset = 14

  while (offset + 8 <= copy.length) {
    const isTrk =
      copy[offset] === 0x4d &&
      copy[offset + 1] === 0x54 &&
      copy[offset + 2] === 0x72 &&
      copy[offset + 3] === 0x6b
    const trkLen = readUint32(copy, offset + 4)
    offset += 8
    if (!isTrk) {
      offset += trkLen
      continue
    }

    const trkEnd = Math.min(copy.length, offset + trkLen)
    let runningStatus = 0

    while (offset < trkEnd) {
      const [, dLen] = readVlq(copy, offset)
      offset += dLen
      if (offset >= trkEnd) break

      let status = copy[offset]
      if ((status & 0x80) === 0) {
        status = runningStatus
      } else {
        offset++
        runningStatus = status
      }

      if (status === 0xff) {
        if (offset >= trkEnd) break
        offset++ // meta type
        const [metaLen, mLen] = readVlq(copy, offset)
        offset += mLen + metaLen
      } else if (status === 0xf0 || status === 0xf7) {
        const [sysLen, sLen] = readVlq(copy, offset)
        offset += sLen + sysLen
      } else {
        const high = status & 0xf0
        const ch = status & 0x0f

        if (high === 0x90 || high === 0x80) {
          // Note On o Note Off
          if (ch !== 9 && offset < trkEnd) {
            const note = copy[offset]
            const shifted = Math.max(0, Math.min(127, note + semitones))
            copy[offset] = shifted
          }
          offset += 2
        } else if (high === 0xc0 || high === 0xd0) {
          offset += 1
        } else {
          offset += 2
        }
      }
    }
  }

  return copy
}

/**
 * Motore di riproduzione sintetizzatore MIDI + SoundFont con supporto KAR.
 */
class KarEngine {
  private seq: Sequencer | null = null
  private ctx: AudioContext | null = null
  private rawBuffer: ArrayBuffer | null = null
  private soundBankBuffer: ArrayBuffer | null = null
  private initPromise: Promise<void> | null = null
  private pitch = 0
  private tempo = 1
  private onEndedCallback: (() => void) | null = null

  karData: KarData | null = null

  /**
   * Inizializza il sintetizzatore Web Audio e carica il SoundFont TimGM6mb.
   */
  async init(context: AudioContext, destination: AudioNode): Promise<void> {
    if (this.initPromise) return this.initPromise
    this.ctx = context

    this.initPromise = (async () => {
      await context.audioWorklet.addModule(spessaProcessorUrl)
      const synth = new WorkletSynthesizer(context, { oneOutput: true })
      synth.connect(destination)

      // Carica il SoundFont compatto incluso localmente (TimGM6mb.sf2, 5.7 MB)
      if (!this.soundBankBuffer) {
        const res = await fetch('/soundfont/TimGM6mb.sf2')
        if (!res.ok) {
          throw new Error('Impossibile caricare il SoundFont TimGM6mb.sf2')
        }
        this.soundBankBuffer = await res.arrayBuffer()
      }

      await synth.soundBankManager.addSoundBank(this.soundBankBuffer, 'TimGM6mb')
      const seq = new Sequencer(synth)

      seq.eventHandler.addEvent('songEnded', 'cosmokaraoke_end', () => {
        this.onEndedCallback?.()
      })

      this.seq = seq
    })()

    return this.initPromise
  }

  onEnded(callback: () => void): void {
    this.onEndedCallback = callback
  }

  /**
   * Carica un file MIDI/KAR, applica l'eventuale trasposizione e prepara la sequenza.
   */
  async load(buffer: ArrayBuffer, pitch = 0, tempo = 1): Promise<void> {
    this.rawBuffer = buffer
    this.pitch = pitch
    this.tempo = tempo

    const bytes = new Uint8Array(buffer)
    this.karData = parseKar(bytes)

    const playbackBytes = pitch === 0 ? bytes : transposeMidi(bytes, pitch)

    if (this.seq) {
      this.seq.loadNewSongList([{ binary: playbackBytes.buffer as ArrayBuffer }])
      this.seq.playbackRate = tempo
    }
  }

  async play(): Promise<void> {
    if (this.ctx?.state === 'suspended') {
      await this.ctx.resume()
    }
    this.seq?.play()
  }

  pause(): void {
    this.seq?.pause()
  }

  stop(): void {
    if (this.seq) {
      this.seq.pause()
      this.seq.currentTime = 0
    }
    this.rawBuffer = null
    this.karData = null
  }

  seek(seconds: number): void {
    if (this.seq) {
      const dur = this.duration
      this.seq.currentTime = Math.max(0, Math.min(seconds, dur > 0 ? dur : seconds))
    }
  }

  setTempo(tempo: number): void {
    this.tempo = Math.min(1.5, Math.max(0.5, tempo))
    if (this.seq) {
      this.seq.playbackRate = this.tempo
    }
  }

  /**
   * Cambia la tonalità modificando direttamente le note MIDI senza alterare la velocità.
   */
  setPitch(semitones: number): void {
    const clamped = Math.min(12, Math.max(-12, Math.round(semitones)))
    if (clamped === this.pitch || !this.rawBuffer || !this.seq) {
      this.pitch = clamped
      return
    }

    const pos = this.seq.currentTime
    const wasPlaying = !this.seq.paused && !this.seq.isFinished
    this.pitch = clamped

    const bytes = new Uint8Array(this.rawBuffer)
    const transposed = clamped === 0 ? bytes : transposeMidi(bytes, clamped)

    this.seq.loadNewSongList([{ binary: transposed.buffer as ArrayBuffer }])
    this.seq.playbackRate = this.tempo
    this.seq.currentTime = pos
    if (wasPlaying) {
      this.seq.play()
    }
  }

  get position(): number {
    return this.seq ? this.seq.currentTime : 0
  }

  get duration(): number {
    return this.karData?.duration || this.seq?.duration || 0
  }

  get isPlaying(): boolean {
    return Boolean(this.seq && !this.seq.paused && !this.seq.isFinished)
  }

  get lines(): KarLine[] {
    return this.karData?.lines ?? []
  }
}

export const karEngine = new KarEngine()
