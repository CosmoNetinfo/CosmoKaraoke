import { convertFileSrc, invoke } from '@tauri-apps/api/core'
import { emit, listen } from '@tauri-apps/api/event'
import type { DisplayMessage, DisplayState, QueueItem, Settings } from '../types'
import { BUILTIN_EFFECTS, playBuiltinEffect } from './effects'
import { engine } from './engine'
import { karEngine } from './kar'
import { useStore } from './store'
import { ensureDownloaded, resumeYoutubeDownloads } from './youtube'

let started = false

/** Costruisce lo stato da mandare allo schermo testi. */
function buildDisplayState(): DisplayState {
  const s = useStore.getState()
  const cur = s.current
  const next = s.queueA[0]
  let kind: DisplayState['kind'] = 'idle'
  if (cur) {
    if (cur.song.format === 'cdg') kind = 'cdg'
    else if (cur.song.format === 'video') kind = 'video'
    else if (cur.song.format === 'kar') kind = 'kar'
    else kind = 'audio'
  }
  return {
    kind,
    mediaUrl: cur ? convertFileSrc(cur.song.path) : null,
    cdgUrl: cur?.song.cdg ? convertFileSrc(cur.song.cdg) : null,
    title: cur?.song.title ?? '',
    artist: cur?.song.artist ?? '',
    singer: cur?.singer ?? '',
    next: next ? `${next.singer ? next.singer + ' - ' : ''}${next.song.title}` : '',
    playing: s.playing,
    position: cur?.song.format === 'kar' ? karEngine.position : engine.position,
    duration: cur?.song.format === 'kar' ? karEngine.duration : engine.duration,
    tempo: s.settings.tempo,
    black: s.displayBlack,
    bg: s.settings.displayBg,
    bgImage: s.settings.displayImage ? convertFileSrc(s.settings.displayImage) : null,
    textScale: s.settings.displayTextScale,
    stretch: s.settings.displayStretch,
  }
}

export function pushDisplay(): void {
  void emit('display:state', buildDisplayState())
}

export function sendDisplayMessage(text: string, seconds: number): void {
  const msg: DisplayMessage = { text, seconds }
  void emit('display:message', msg)
}

/** Applica al motore audio gli effetti della voce (riverbero, eco, coro, tono, livellatore). */
export function applyMicFx(st: Settings): void {
  engine.setEcho(st.echo)
  engine.setEchoShape(st.echoTime, st.echoFb)
  engine.setReverb(st.reverb)
  engine.setReverbSize(st.reverbSize)
  engine.setChorus(st.chorus)
  engine.setMicTone(st.micBass, st.micTreble)
  engine.setMicComp(st.micComp)
}

/** Applica al motore audio tutte le impostazioni salvate. */
export function applySettingsToEngine(): void {
  const { settings: st } = useStore.getState()
  engine.setTempo(st.tempo)
  engine.setPitch(st.pitch)
  engine.setVolume(st.volume)
  engine.setVocalRemoval(st.vocalOff)
  engine.setOutputMono(st.outputMono)
  st.eq.forEach((db, i) => engine.setEq(i, db))
  engine.setMicVolume(st.micVol)
  engine.setEcho(st.echo)
  applyMicFx(st)
  const cur = useStore.getState().current
  if (cur?.song.format === 'kar') {
    karEngine.setTempo(cur.interlude ? 1 : st.tempo)
    karEngine.setPitch(cur.interlude ? 0 : st.pitch)
  }
}

export function setPitch(semitones: number): void {
  engine.setPitch(semitones)
  const cur = useStore.getState().current
  if (cur?.song.format === 'kar') {
    karEngine.setPitch(semitones)
  }
}

export function setTempo(tempo: number): void {
  engine.setTempo(tempo)
  const cur = useStore.getState().current
  if (cur?.song.format === 'kar') {
    karEngine.setTempo(tempo)
  }
}

/** Da chiamare una sola volta all'avvio della finestra di controllo. */
export async function initPlayer(): Promise<void> {
  if (started) return
  started = true
  await engine.init()
  applySettingsToEngine()

  engine.media.addEventListener('ended', () => {
    void onSongEnded()
  })
  karEngine.onEnded(() => {
    void onSongEnded()
  })

  // il sottofondo si abbassa quando parte un brano e riprende quando finisce la scaletta
  useStore.subscribe((s, prev) => {
    if (s.current && !prev.current && s.bgOn && !bgAudio.paused) {
      bgSuspended = true
      bgRamp(0, 800, () => bgAudio.pause())
    }
    if (!s.current && prev.current && s.bgOn && bgSuspended && s.settings.bgAuto) {
      bgSuspended = false
      void bgResume()
    }
  })
  bgAudio.addEventListener('ended', () => bgNextTrack())
  engine.media.addEventListener('play', () => {
    useStore.getState().patch({ playing: true })
    pushDisplay()
  })
  engine.media.addEventListener('pause', () => {
    useStore.getState().patch({ playing: false })
    pushDisplay()
  })
  engine.media.addEventListener('seeked', pushDisplay)

  let n = 0
  setInterval(() => {
    const cur = useStore.getState().current
    const isKar = cur?.song.format === 'kar'
    const pos = isKar ? karEngine.position : engine.position
    const dur = isKar ? karEngine.duration : engine.duration
    const isPlaying = isKar ? karEngine.isPlaying : engine.isPlaying
    useStore.getState().patch({ position: pos, duration: dur, playing: isPlaying })
    if (isPlaying && ++n % 3 === 0) pushDisplay()
  }, 100)

  resumeYoutubeDownloads()

  // lo schermo testi, appena aperto, chiede lo stato corrente
  await listen('display:ready', () => {
    const cur = useStore.getState().current
    if (cur?.song.format === 'kar') {
      void emit('display:kar', karEngine.lines)
    }
    pushDisplay()
  })
}

export async function startPlayback(item: QueueItem): Promise<void> {
  const store = useStore.getState()
  if (item.song.zipEntry) {
    try {
      const extracted = await invoke<{ audioPath: string; cdgPath: string | null }>(
        'prepare_zip_song',
        {
          zipPath: item.song.path,
          audioEntry: item.song.zipEntry,
          cdgEntry: item.song.cdg,
        },
      )
      item = {
        ...item,
        song: {
          ...item.song,
          path: extracted.audioPath,
          cdg: extracted.cdgPath,
        },
      }
    } catch (e) {
      store.notify(`Impossibile estrarre il brano dal file zip: ${String(e)}`)
      store.patch({ current: null, playing: false })
      return
    }
  }
  if (item.song.format === 'kar') {
    engine.stop()
    karEngine.stop()
    store.removeFromQueue(item.uid)
    store.patch({ current: item, position: 0, playing: true, karLines: [] })
    const { settings } = store
    try {
      const res = await fetch(convertFileSrc(item.song.path))
      const buf = await res.arrayBuffer()
      const ctx = engine.audioContext!
      const dst = engine.inputNode!
      await karEngine.init(ctx, dst)
      await karEngine.load(
        buf,
        item.interlude ? 0 : settings.pitch,
        item.interlude ? 1 : settings.tempo,
      )
      const lines = karEngine.lines
      useStore.getState().patch({ duration: karEngine.duration, karLines: lines })
      void emit('display:kar', lines)
      pushDisplay()
      await karEngine.play()
      pushDisplay()
    } catch (e) {
      useStore.getState().notify(String(e instanceof Error ? e.message : e))
      useStore.getState().patch({ current: null, playing: false, karLines: [] })
      void emit('display:kar', [])
      pushDisplay()
    }
    return
  }
  karEngine.stop()
  store.patch({ karLines: [] })
  void emit('display:kar', [])
  store.removeFromQueue(item.uid)
  if (item.song.ytId && !item.song.path) {
    // brano di YouTube non ancora scaricato: lo finisco di scaricare e poi parte
    store.notify('Sto scaricando il brano da YouTube: parte appena è pronto…')
    store.patch({ current: item, position: 0 })
    try {
      const path = await ensureDownloaded(item.song.ytId)
      item = { ...item, song: { ...item.song, path, id: path, yt: undefined } }
      store.patch({ current: item })
    } catch {
      useStore.getState().patch({ current: null })
      void playNext()
      return
    }
  }
  store.patch({ current: item, position: 0 })
  try {
    await engine.load(convertFileSrc(item.song.path))
    applySettingsToEngine()
    if (item.interlude) {
      // gli stacchetti suonano sempre alla velocità e tonalità originali
      engine.setTempo(1)
      engine.setPitch(0)
    }
    pushDisplay()
    await engine.play()
    pushDisplay()
  } catch (e) {
    useStore.getState().notify(String(e instanceof Error ? e.message : e))
    useStore.getState().patch({ current: null, playing: false })
    pushDisplay()
  }
}

// --- stacchetti tra un brano e l'altro --------------------------------------

let sinceInterlude = 0
let interludeIdx = 0

/** Quando un brano finisce da solo: se serve parte uno stacchetto, altrimenti il brano dopo. */
async function onSongEnded(): Promise<void> {
  const s = useStore.getState()
  if (s.current?.interlude) {
    await playNext()
    return
  }
  sinceInterlude++
  const { settings, interludes, queueA } = s
  if (
    settings.interludeOn &&
    interludes.length > 0 &&
    queueA.length > 0 &&
    sinceInterlude >= settings.interludeEvery
  ) {
    sinceInterlude = 0
    const j = settings.interludeRandom
      ? interludes[Math.floor(Math.random() * interludes.length)]
      : interludes[interludeIdx++ % interludes.length]
    await startPlayback({
      uid: crypto.randomUUID(),
      singer: '',
      interlude: true,
      song: {
        id: j.path,
        path: j.path,
        title: `Stacchetto: ${j.name}`,
        artist: '',
        format: 'audio',
        ext: '',
        cdg: null,
      },
    })
    return
  }
  await playNext()
}

export async function playNext(): Promise<void> {
  const next = useStore.getState().queueA[0]
  if (!next) {
    engine.stop()
    karEngine.stop()
    useStore.getState().patch({
      current: null,
      playing: false,
      position: 0,
      duration: 0,
      karLines: [],
    })
    void emit('display:kar', [])
    pushDisplay()
    return
  }
  await startPlayback(next)
}

/** Dissolvenza del brano in corso e partenza del successivo. */
export async function mixNext(): Promise<void> {
  const { settings, queueA } = useStore.getState()
  if (!queueA[0]) {
    useStore.getState().notify("La scaletta è vuota: non c'è un brano successivo.")
    return
  }
  const cur = useStore.getState().current
  const isPlaying = cur?.song.format === 'kar' ? karEngine.isPlaying : engine.isPlaying
  if (isPlaying) await engine.fadeOut(settings.fadeSec)
  if (cur?.song.format === 'kar') karEngine.stop()
  await playNext()
  engine.fadeIn(0.6)
}

export async function togglePause(): Promise<void> {
  const cur = useStore.getState().current
  const isKar = cur?.song.format === 'kar'
  if (isKar) {
    if (karEngine.isPlaying) karEngine.pause()
    else if (cur) await karEngine.play()
    else await playNext()
    useStore.getState().patch({ playing: karEngine.isPlaying })
  } else {
    if (engine.isPlaying) engine.pause()
    else if (cur) await engine.play()
    else await playNext()
    useStore.getState().patch({ playing: engine.isPlaying })
  }
  pushDisplay()
}

export function stopAll(): void {
  engine.stop()
  karEngine.stop()
  useStore.getState().patch({
    current: null,
    playing: false,
    position: 0,
    duration: 0,
    karLines: [],
  })
  void emit('display:kar', [])
  pushDisplay()
}

export function seekTo(seconds: number): void {
  const cur = useStore.getState().current
  if (cur?.song.format === 'kar') {
    karEngine.seek(seconds)
  } else {
    engine.seek(seconds)
  }
  useStore.getState().patch({ position: seconds })
  pushDisplay()
}

// --- anteprima in cuffia ------------------------------------------------------

type SinkAudio = HTMLAudioElement & {
  setSinkId?: (id: string) => Promise<void>
}
const preview: SinkAudio = new Audio()
let previewPath = ''

export function previewSupported(): boolean {
  return typeof preview.setSinkId === 'function'
}

export async function togglePreview(path: string): Promise<void> {
  if (previewPath === path && !preview.paused) {
    preview.pause()
    previewPath = ''
    return
  }
  const { settings, notify } = useStore.getState()
  if (!previewSupported()) {
    notify(
      "Su questo sistema non posso scegliere l'uscita delle cuffie: l'anteprima suonerebbe in sala.",
    )
    return
  }
  if (!settings.headphonesId) {
    notify("Scegli prima l'uscita delle cuffie in Impostazioni.")
    return
  }
  try {
    await preview.setSinkId?.(settings.headphonesId)
    preview.src = convertFileSrc(path)
    previewPath = path
    await preview.play()
  } catch (e) {
    notify(`Anteprima non riuscita: ${String(e)}`)
  }
}

// --- jingle -------------------------------------------------------------------

// --- suoni in corso: ognuno si può fermare ---------------------------------

const activeStops = new Map<string, () => void>()

function track(name: string, stop: () => void): string {
  const id = crypto.randomUUID()
  activeStops.set(id, stop)
  useStore.setState((s) => ({ activeFx: [...s.activeFx, { id, name }] }))
  return id
}

function untrack(id: string): void {
  activeStops.delete(id)
  useStore.setState((s) => ({ activeFx: s.activeFx.filter((x) => x.id !== id) }))
}

/** Ferma un effetto che sta suonando. */
export function stopSound(id: string): void {
  activeStops.get(id)?.()
  untrack(id)
}

/** Ferma tutti gli effetti e salta lo stacchetto in corso (non tocca il brano che si canta). */
export function stopAllSounds(): void {
  for (const id of [...activeStops.keys()]) stopSound(id)
  if (useStore.getState().current?.interlude) void playNext()
}

export function playJingle(path: string, name?: string): void {
  const a = new Audio(convertFileSrc(path))
  a.volume = useStore.getState().settings.fxVolume
  const label = name ?? (path.split(/[\\/]/).pop() ?? path).replace(/\.[^.]+$/, '')
  const id = track(label, () => a.pause())
  a.addEventListener('ended', () => untrack(id))
  void a.play().catch(() => {
    untrack(id)
    useStore.getState().notify('Effetto non riproducibile')
  })
}

function playBuiltin(id: string, name: string): void {
  const h = playBuiltinEffect(id, useStore.getState().settings.fxVolume)
  if (!h) return
  const tid = track(name, h.stop)
  setTimeout(() => untrack(tid), (h.seconds + 0.3) * 1000)
}

export interface EffectSlot {
  key: string
  name: string
  /** true = effetto creato dal programma (si può nascondere), false = file tuo (si può togliere) */
  builtin: boolean
  run: () => void
}

/** Tutti gli effetti, nell'ordine dei tasti 1–9: prima i tuoi file, poi quelli interni. */
export function effectList(): EffectSlot[] {
  const s = useStore.getState()
  const mine: EffectSlot[] = s.jingles.map((j) => ({
    key: j.id,
    name: j.name,
    builtin: false,
    run: () => playJingle(j.path, j.name),
  }))
  const builtin: EffectSlot[] = BUILTIN_EFFECTS.filter(
    (e) => !s.settings.hiddenEffects.includes(e.id),
  ).map((e) => ({
    key: e.id,
    name: e.name,
    builtin: true,
    run: () => playBuiltin(e.id, e.name),
  }))
  return [...mine, ...builtin]
}

// --- musica di sottofondo ----------------------------------------------------

const bgAudio = new Audio()
let bgFade: ReturnType<typeof setInterval> | undefined
let bgIdx = -1
let bgSuspended = false

function bgRamp(to: number, ms: number, done?: () => void): void {
  clearInterval(bgFade)
  const from = bgAudio.volume
  const steps = Math.max(1, Math.round(ms / 50))
  let i = 0
  bgFade = setInterval(() => {
    i++
    bgAudio.volume = Math.min(1, Math.max(0, from + ((to - from) * i) / steps))
    if (i >= steps) {
      clearInterval(bgFade)
      done?.()
    }
  }, 50)
}

function bgLoad(index: number): boolean {
  const { bgTracks } = useStore.getState()
  if (bgTracks.length === 0) return false
  bgIdx = ((index % bgTracks.length) + bgTracks.length) % bgTracks.length
  bgAudio.src = convertFileSrc(bgTracks[bgIdx].path)
  useStore.getState().patch({ bgTitle: bgTracks[bgIdx].name })
  return true
}

function bgPick(): number {
  const { bgTracks, settings } = useStore.getState()
  if (settings.bgShuffle && bgTracks.length > 1) {
    let n = bgIdx
    while (n === bgIdx) n = Math.floor(Math.random() * bgTracks.length)
    return n
  }
  return bgIdx + 1
}

async function bgResume(): Promise<void> {
  bgAudio.volume = 0
  try {
    await bgAudio.play()
    bgRamp(useStore.getState().settings.bgVolume, 1500)
  } catch {
    useStore.getState().notify('Non riesco a far partire il sottofondo.')
  }
}

export async function bgPlay(): Promise<void> {
  const st = useStore.getState()
  if (st.bgTracks.length === 0) {
    st.notify('Aggiungi prima qualche brano di sottofondo.')
    return
  }
  st.patch({ bgOn: true })
  if (st.current) {
    bgSuspended = true // parte da solo quando il brano finisce
    return
  }
  bgSuspended = false
  if (bgIdx < 0 || !bgAudio.src)
    bgLoad(st.settings.bgShuffle ? Math.floor(Math.random() * st.bgTracks.length) : 0)
  await bgResume()
}

export function bgStop(): void {
  useStore.getState().patch({ bgOn: false })
  bgSuspended = false
  bgRamp(0, 600, () => bgAudio.pause())
}

export function bgNextTrack(): void {
  const st = useStore.getState()
  if (!st.bgOn || !bgLoad(bgPick())) return
  if (st.current) {
    bgSuspended = true
    return
  }
  void bgResume()
}

export function setBgVolume(v: number): void {
  useStore.getState().patchSettings({ bgVolume: v })
  if (!bgAudio.paused && !bgSuspended) {
    clearInterval(bgFade)
    bgAudio.volume = v
  }
}
