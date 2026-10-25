import { invoke } from '@tauri-apps/api/core'
import { Download, Eye, Loader2, Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useStore } from '../lib/store'
import type { Song, YtItem } from '../types'
import { Btn, fmtTime } from './ui'

function fileStem(path: string): string {
  const name = path.split(/[\\/]/).pop() ?? path
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(0, dot) : name
}

export function YouTube() {
  const settings = useStore((s) => s.settings)
  const notify = useStore((s) => s.notify)
  const enqueue = useStore((s) => s.enqueue)
  const [version, setVersion] = useState<string | null>(null)
  const [missing, setMissing] = useState('')
  const [installing, setInstalling] = useState(false)
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [results, setResults] = useState<YtItem[]>([])
  const [preview, setPreview] = useState<YtItem | null>(null)
  const [downloading, setDownloading] = useState<Record<string, boolean>>({})

  useEffect(() => {
    invoke<string>('ytdlp_check')
      .then((v) => setVersion(v))
      .catch((e) => setMissing(String(e)))
  }, [])

  const install = async () => {
    setInstalling(true)
    try {
      const v = await invoke<string>('ytdlp_install')
      setVersion(v)
      setMissing('')
      notify(`yt-dlp installato (versione ${v})`)
    } catch (e) {
      notify(String(e))
    } finally {
      setInstalling(false)
    }
  }

  const search = async () => {
    if (!query.trim()) return
    setBusy(true)
    try {
      setResults(await invoke<YtItem[]>('ytdlp_search', { query }))
    } catch (e) {
      notify(String(e))
    } finally {
      setBusy(false)
    }
  }

  const download = async (item: YtItem) => {
    setDownloading((d) => ({ ...d, [item.id]: true }))
    try {
      const path = await invoke<string>('ytdlp_download', {
        id: item.id,
        destDir: settings.downloadDir || null,
      })
      const song: Song = {
        id: path,
        path,
        title: fileStem(path),
        artist: '',
        format: 'video',
        ext: 'mp4',
        cdg: null,
      }
      enqueue(song, 'A')
      notify(`Scaricato e messo in scaletta: ${song.title}`)
    } catch (e) {
      notify(String(e))
    } finally {
      setDownloading((d) => ({ ...d, [item.id]: false }))
    }
  }

  return (
    <div className="flex h-full flex-col gap-3">
      {missing && (
        <div className="rounded-md border border-accent bg-accent/15 p-3 text-base text-text">
          <p>{missing}</p>
          <div className="mt-2">
            <Btn variant="primary" disabled={installing} onClick={() => void install()}>
              {installing ? <Loader2 className="animate-spin" /> : <Download />}
              {installing ? 'Scarico yt-dlp…' : 'Scarica yt-dlp'}
            </Btn>
          </div>
        </div>
      )}
      {version && <div className="text-base text-muted">yt-dlp versione {version}</div>}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3.5 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void search()}
            placeholder="Cerca una base karaoke su YouTube…"
            className="w-full rounded-lg border-2 border-line bg-inset py-2.5 pl-10 pr-3 text-base outline-none focus:border-accent"
          />
        </div>
        <Btn variant="primary" disabled={busy || !query.trim()} onClick={() => void search()}>
          {busy ? <Loader2 className="animate-spin" /> : <Search />}
          Cerca
        </Btn>
      </div>

      <p className="text-base text-muted">
        Funzione per uso personale: scaricare i video può violare i termini di YouTube e il diritto
        d'autore.
      </p>

      <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
        {results.map((r) => (
          <li key={r.id} className="flex items-center gap-3 rounded-md bg-row p-2">
            <img
              src={`https://i.ytimg.com/vi/${r.id}/mqdefault.jpg`}
              alt=""
              className="h-14 w-24 shrink-0 rounded object-cover"
              loading="lazy"
            />
            <div className="min-w-0 flex-1">
              <div className="line-clamp-2 text-base font-medium">{r.title}</div>
              <div className="truncate text-base text-muted">
                {r.channel}
                {r.duration ? ` · ${fmtTime(r.duration)}` : ''}
              </div>
            </div>
            <Btn title="Anteprima" onClick={() => setPreview(r)}>
              <Eye />
            </Btn>
            <Btn
              variant="primary"
              title="Scarica e metti in scaletta"
              disabled={downloading[r.id]}
              onClick={() => void download(r)}
            >
              {downloading[r.id] ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Download />
              )}
            </Btn>
          </li>
        ))}
      </ul>

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6">
          <div className="w-full max-w-3xl rounded-lg bg-panel p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="truncate text-base">{preview.title}</div>
              <Btn variant="ghost" onClick={() => setPreview(null)}>
                <X />
              </Btn>
            </div>
            <div className="aspect-video w-full overflow-hidden rounded bg-black">
              <iframe
                className="h-full w-full"
                src={`https://www.youtube-nocookie.com/embed/${preview.id}?autoplay=1`}
                allow="autoplay; encrypted-media"
                title="Anteprima YouTube"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
