import { convertFileSrc } from '@tauri-apps/api/core'
import { emit, listen } from '@tauri-apps/api/event'
import type { DisplayMessage, DisplayState, QueueItem } from '../types'
import { engine } from './engine'
import { useStore } from './store'

let started = false

/** Costruisce lo stato da mandare allo schermo testi. */
function buildDisplayState(): DisplayState {
  const s = useStore.getState()
  const cur = s.current
  const next = s.queueA[0]
  let kind: DisplayState['kind'] = 'idle'
  if (cur) {
    kind = cur.song.format === 'cdg' ? 'cdg' : cur.song.format === 'video' ? 'video' : 'audio'
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
    position: engine.position,
    duration: engine.duration,
    tempo: s.settings.tempo,
    black: s.displayBlack,
    bg: s.settings.displayBg,
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
}

/** Da chiamare una sola volta all'avvio della finestra di controllo. */
export async function initPlayer(): Promise<void> {
  if (started) return
  started = true
  await engine.init()
  applySettingsToEngine()

  engine.media.addEventListener('ended', () => {
    void playNext()
  })
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
    useStore.getState().patch({ position: engine.position, duration: engine.duration })
    if (engine.isPlaying && ++n % 3 === 0) pushDisplay()
  }, 100)

  // lo schermo testi, appena aperto, chiede lo stato corrente
  await listen('display:ready', () => pushDisplay())
}

export async function startPlayback(item: QueueItem): Promise<void> {
  const store = useStore.getState()
  if (item.song.format === 'kar') {
    store.notify('I file MIDI/KAR non sono ancora supportati in questa versione.')
    store.removeFromQueue(item.uid)
    return
  }
  store.removeFromQueue(item.uid)
  store.patch({ current: item, position: 0 })
  try {
    await engine.load(convertFileSrc(item.song.path))
    applySettingsToEngine()
    pushDisplay()
    await engine.play()
    pushDisplay()
  } catch (e) {
    useStore.getState().notify(String(e instanceof Error ? e.message : e))
    useStore.getState().patch({ current: null, playing: false })
    pushDisplay()
  }
}

export async function playNext(): Promise<void> {
  const next = useStore.getState().queueA[0]
  if (!next) {
    engine.stop()
    useStore.getState().patch({ current: null, playing: false, position: 0, duration: 0 })
    pushDisplay()
    return
  }
  await startPlayback(next)
}

/** Dissolvenza del brano in corso e partenza del successivo. */
export async function mixNext(): Promise<void> {
  const { settings, queueA } = useStore.getState()
  if (!queueA[0]) {
    useStore.getState().notify('La scaletta è vuota: non c\'è un brano successivo.')
    return
  }
  if (engine.isPlaying) await engine.fadeOut(settings.fadeSec)
  await playNext()
  engine.fadeIn(0.6)
}

export async function togglePause(): Promise<void> {
  if (engine.isPlaying) engine.pause()
  else if (useStore.getState().current) await engine.play()
  else await playNext()
}

export function stopAll(): void {
  engine.stop()
  useStore.getState().patch({ current: null, playing: false, position: 0, duration: 0 })
  pushDisplay()
}

export function seekTo(seconds: number): void {
  engine.seek(seconds)
  useStore.getState().patch({ position: seconds })
  pushDisplay()
}

// --- anteprima in cuffia ------------------------------------------------------

type SinkAudio = HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> }
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
    notify('Su questo sistema non posso scegliere l\'uscita delle cuffie: l\'anteprima suonerebbe in sala.')
    return
  }
  if (!settings.headphonesId) {
    notify('Scegli prima l\'uscita delle cuffie in Impostazioni.')
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

export function playJingle(path: string): void {
  const a = new Audio(convertFileSrc(path))
  void a.play().catch(() => useStore.getState().notify('Jingle non riproducibile'))
}
