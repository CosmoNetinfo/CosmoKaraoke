import { invoke } from '@tauri-apps/api/core'
import { useStore } from './store'
import type { QueueItem, Song, YtItem } from '../types'

/** Scaricamenti in corso, uno per video: così lo stesso brano non si scarica due volte. */
const inflight = new Map<string, Promise<string>>()

function patchSong(ytId: string, patch: Partial<Song>): void {
  const upd = (q: QueueItem): QueueItem =>
    q.song.ytId === ytId ? { ...q, song: { ...q.song, ...patch } } : q
  useStore.setState((s) => ({
    queueA: s.queueA.map(upd),
    queueB: s.queueB.map(upd),
    current: s.current ? upd(s.current) : s.current,
  }))
}

/** Scarica il video (se non è già scaricato) e aggiorna i brani in scaletta. */
export function ensureDownloaded(ytId: string): Promise<string> {
  const running = inflight.get(ytId)
  if (running) return running
  patchSong(ytId, { yt: 'downloading' })
  const p = invoke<string>('ytdlp_download', {
    id: ytId,
    destDir: useStore.getState().settings.downloadDir || null,
  })
    .then((path) => {
      patchSong(ytId, { path, id: path, yt: undefined })
      return path
    })
    .catch((e) => {
      patchSong(ytId, { yt: 'error' })
      useStore.getState().notify(String(e))
      throw e
    })
    .finally(() => inflight.delete(ytId))
  inflight.set(ytId, p)
  return p
}

/** Mette il video in scaletta (o in riserva) e lo scarica in sottofondo. */
export function queueYoutube(item: YtItem, to: 'A' | 'B', singer?: string): void {
  const song: Song = {
    id: `yt:${item.id}`,
    path: '',
    title: item.title,
    artist: item.channel,
    format: 'video',
    ext: 'mp4',
    cdg: null,
    ytId: item.id,
    yt: 'downloading',
  }
  useStore.getState().enqueue(song, to, singer)
  useStore.getState().notify(`In ${to === 'A' ? 'scaletta' : 'riserva'}: ${item.title}`)
  void ensureDownloaded(item.id).catch(() => {})
}

/** All'avvio riprende i download rimasti a metà (programma chiuso o errore). */
export function resumeYoutubeDownloads(): void {
  const s = useStore.getState()
  for (const q of [...s.queueA, ...s.queueB]) {
    if (q.song.ytId && !q.song.path) void ensureDownloaded(q.song.ytId).catch(() => {})
  }
}
