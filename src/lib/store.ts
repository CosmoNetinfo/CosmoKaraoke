import { invoke } from '@tauri-apps/api/core'
import { create } from 'zustand'
import type { Jingle, QueueItem, Settings, Song } from '../types'

export const DEFAULT_SETTINGS: Settings = {
  fadeSec: 3,
  downloadDir: '',
  monitorIndex: -1,
  displayBg: '#0b1020',
  headphonesId: '',
  eq: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  pitch: 0,
  tempo: 1,
  vocalOff: false,
  outputMono: false,
  // il microfono di solito va nel mixer esterno, non nel programma
  micInApp: false,
  fxVolume: 0.9,
  interludeOn: false,
  interludeEvery: 1,
  interludeRandom: true,
  bgVolume: 0.5,
  bgAuto: true,
  bgShuffle: true,
  displayImage: '',
  volume: 0.9,
  micOn: false,
  micVol: 1,
  echo: 0.2,
  echoTime: 0.28,
  echoFb: 0.3,
  reverb: 0.25,
  reverbSize: 0.4,
  chorus: 0,
  micBass: 0,
  micTreble: 0,
  micComp: 0.3,
  fontFamily: 'atkinson',
  theme: 'scuro',
  uiScale: 1.25,
  letterSpacing: 0.02,
  lineHeight: 1.5,
  displayTextScale: 1.3,
  displayStretch: false,
}

export type Tab = 'library' | 'youtube' | 'mixer' | 'effects' | 'settings'

interface AppState {
  hydrated: boolean
  tab: Tab
  songs: Song[]
  libraryPaths: string[]
  scanning: boolean
  queueA: QueueItem[]
  queueB: QueueItem[]
  singers: string[]
  activeSinger: string
  current: QueueItem | null
  playing: boolean
  position: number
  duration: number
  displayBlack: boolean
  displayOpen: boolean
  jingles: Jingle[]
  /** stacchetti musicali che partono tra un brano e l'altro */
  interludes: Jingle[]
  /** musiche di sottofondo per quando non si canta */
  bgTracks: Jingle[]
  bgOn: boolean
  bgTitle: string
  settings: Settings
  toast: string

  patch: (p: Partial<AppState>) => void
  patchSettings: (p: Partial<Settings>) => void
  notify: (msg: string) => void
  hydrate: () => Promise<void>
  rescan: () => Promise<void>
  addLibraryPath: (p: string) => Promise<void>
  removeLibraryPath: (p: string) => Promise<void>
  addSinger: (name: string) => void
  removeSinger: (name: string) => void
  enqueue: (song: Song, to?: 'A' | 'B', singer?: string) => void
  removeFromQueue: (uid: string) => void
  moveInQueue: (uid: string, dir: -1 | 1) => void
  transfer: (uid: string) => void
  setSingerOf: (uid: string, singer: string) => void
}

let toastTimer: ReturnType<typeof setTimeout> | undefined

function listOf(s: AppState, uid: string): 'A' | 'B' | null {
  if (s.queueA.some((q) => q.uid === uid)) return 'A'
  if (s.queueB.some((q) => q.uid === uid)) return 'B'
  return null
}

export const useStore = create<AppState>((set, get) => ({
  hydrated: false,
  tab: 'library',
  songs: [],
  libraryPaths: [],
  scanning: false,
  queueA: [],
  queueB: [],
  singers: [],
  activeSinger: '',
  current: null,
  playing: false,
  position: 0,
  duration: 0,
  displayBlack: false,
  displayOpen: false,
  jingles: [],
  interludes: [],
  bgTracks: [],
  bgOn: false,
  bgTitle: '',
  settings: DEFAULT_SETTINGS,
  toast: '',

  patch: (p) => set(p),
  patchSettings: (p) => set((s) => ({ settings: { ...s.settings, ...p } })),

  notify: (msg) => {
    set({ toast: msg })
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => set({ toast: '' }), 5000)
  },

  hydrate: async () => {
    try {
      const rawState = await invoke<string>('load_blob', { name: 'state' })
      if (rawState) {
        const d = JSON.parse(rawState) as Partial<AppState> & { settings?: Partial<Settings> }
        set({
          libraryPaths: d.libraryPaths ?? [],
          queueA: d.queueA ?? [],
          queueB: d.queueB ?? [],
          singers: d.singers ?? [],
          activeSinger: d.activeSinger ?? '',
          jingles: d.jingles ?? [],
          interludes: d.interludes ?? [],
          bgTracks: d.bgTracks ?? [],
          settings: { ...DEFAULT_SETTINGS, ...(d.settings ?? {}) },
        })
      }
      const rawLib = await invoke<string>('load_blob', { name: 'library' })
      if (rawLib) set({ songs: JSON.parse(rawLib) as Song[] })
    } catch (e) {
      get().notify(`Impossibile leggere i dati salvati: ${String(e)}`)
    }
    set({ hydrated: true })
  },

  rescan: async () => {
    const { libraryPaths } = get()
    if (libraryPaths.length === 0) {
      set({ songs: [] })
      await invoke('save_blob', { name: 'library', json: '[]' })
      return
    }
    set({ scanning: true })
    try {
      const songs = await invoke<Song[]>('scan_library', { paths: libraryPaths })
      set({ songs })
      await invoke('save_blob', { name: 'library', json: JSON.stringify(songs) })
      get().notify(`Libreria aggiornata: ${songs.length} brani`)
    } catch (e) {
      get().notify(`Scansione non riuscita: ${String(e)}`)
    } finally {
      set({ scanning: false })
    }
  },

  addLibraryPath: async (p) => {
    if (get().libraryPaths.includes(p)) return
    set((s) => ({ libraryPaths: [...s.libraryPaths, p] }))
    await get().rescan()
  },

  removeLibraryPath: async (p) => {
    set((s) => ({ libraryPaths: s.libraryPaths.filter((x) => x !== p) }))
    await get().rescan()
  },

  addSinger: (name) => {
    const n = name.trim()
    if (!n || get().singers.includes(n)) return
    set((s) => ({ singers: [...s.singers, n], activeSinger: s.activeSinger || n }))
  },

  removeSinger: (name) =>
    set((s) => ({
      singers: s.singers.filter((x) => x !== name),
      activeSinger: s.activeSinger === name ? '' : s.activeSinger,
    })),

  enqueue: (song, to = 'A', singer) => {
    const item: QueueItem = {
      uid: crypto.randomUUID(),
      song,
      singer: singer ?? get().activeSinger,
    }
    if (to === 'A') set((s) => ({ queueA: [...s.queueA, item] }))
    else set((s) => ({ queueB: [...s.queueB, item] }))
  },

  removeFromQueue: (uid) =>
    set((s) => ({
      queueA: s.queueA.filter((q) => q.uid !== uid),
      queueB: s.queueB.filter((q) => q.uid !== uid),
    })),

  moveInQueue: (uid, dir) =>
    set((s) => {
      const which = listOf(s, uid)
      if (!which) return {}
      const list = [...(which === 'A' ? s.queueA : s.queueB)]
      const i = list.findIndex((q) => q.uid === uid)
      const j = i + dir
      if (j < 0 || j >= list.length) return {}
      ;[list[i], list[j]] = [list[j], list[i]]
      return which === 'A' ? { queueA: list } : { queueB: list }
    }),

  transfer: (uid) =>
    set((s) => {
      const which = listOf(s, uid)
      if (which === 'A') {
        const item = s.queueA.find((q) => q.uid === uid)
        if (!item) return {}
        return { queueA: s.queueA.filter((q) => q.uid !== uid), queueB: [...s.queueB, item] }
      }
      if (which === 'B') {
        const item = s.queueB.find((q) => q.uid === uid)
        if (!item) return {}
        return { queueB: s.queueB.filter((q) => q.uid !== uid), queueA: [...s.queueA, item] }
      }
      return {}
    }),

  setSingerOf: (uid, singer) =>
    set((s) => ({
      queueA: s.queueA.map((q) => (q.uid === uid ? { ...q, singer } : q)),
      queueB: s.queueB.map((q) => (q.uid === uid ? { ...q, singer } : q)),
    })),
}))

// Salvataggio automatico di impostazioni e code (con un breve ritardo)
let saveTimer: ReturnType<typeof setTimeout> | undefined
useStore.subscribe((s, prev) => {
  if (!s.hydrated) return
  const changed =
    s.libraryPaths !== prev.libraryPaths ||
    s.queueA !== prev.queueA ||
    s.queueB !== prev.queueB ||
    s.singers !== prev.singers ||
    s.activeSinger !== prev.activeSinger ||
    s.jingles !== prev.jingles ||
    s.interludes !== prev.interludes ||
    s.bgTracks !== prev.bgTracks ||
    s.settings !== prev.settings
  if (!changed) return
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    const { libraryPaths, queueA, queueB, singers, activeSinger, jingles, interludes, bgTracks, settings } =
      useStore.getState()
    const json = JSON.stringify({
      libraryPaths,
      queueA,
      queueB,
      singers,
      activeSinger,
      jingles,
      interludes,
      bgTracks,
      settings,
    })
    invoke('save_blob', { name: 'state', json }).catch(() => {})
  }, 600)
})
