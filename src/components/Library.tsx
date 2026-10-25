import { Disc3, FileAudio, Film, Headphones, ListPlus, Music, Play, Plus, Search } from 'lucide-react'
import { useDeferredValue, useMemo, useState } from 'react'
import { startPlayback, togglePreview } from '../lib/player'
import { useStore } from '../lib/store'
import type { Format, Song } from '../types'
import { Btn } from './ui'

const FORMAT_LABEL: Record<Format, string> = {
  cdg: 'CD+G',
  kar: 'MIDI/KAR',
  video: 'Video',
  audio: 'Audio',
}

function FormatIcon({ format }: { format: Format }) {
  if (format === 'cdg') return <Disc3 className="text-accent-text" />
  if (format === 'video') return <Film className="text-accent-text" />
  if (format === 'kar') return <Music className="text-accent-text" />
  return <FileAudio className="text-accent-text" />
}

const PAGE = 200

export function Library() {
  const songs = useStore((s) => s.songs)
  const libraryPaths = useStore((s) => s.libraryPaths)
  const scanning = useStore((s) => s.scanning)
  const enqueue = useStore((s) => s.enqueue)
  const [query, setQuery] = useState('')
  const [format, setFormat] = useState<'all' | Format>('all')
  const [limit, setLimit] = useState(PAGE)
  const deferred = useDeferredValue(query)

  // testo di ricerca già in minuscolo, calcolato una volta sola per libreria
  const haystack = useMemo(() => songs.map((s) => `${s.artist} ${s.title}`.toLowerCase()), [songs])

  const filtered = useMemo(() => {
    const words = deferred.toLowerCase().split(/\s+/).filter(Boolean)
    if (format === 'all' && words.length === 0) return songs
    return songs.filter((s, i) => {
      if (format !== 'all' && s.format !== format) return false
      return words.every((w) => haystack[i].includes(w))
    })
  }, [songs, haystack, deferred, format])

  const play = (song: Song) => {
    const s = useStore.getState()
    void startPlayback({ uid: crypto.randomUUID(), song, singer: s.activeSinger })
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3.5 text-muted" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setLimit(PAGE)
            }}
            placeholder="Cerca per titolo o artista…"
            className="w-full rounded-lg border-2 border-line bg-inset py-2.5 pl-10 pr-3 text-base outline-none focus:border-accent"
          />
        </div>
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value as 'all' | Format)}
          className="rounded-lg border-2 border-line bg-inset px-2 py-2 text-base"
        >
          <option value="all">Tutti i formati</option>
          <option value="cdg">CD+G</option>
          <option value="video">Video</option>
          <option value="audio">Solo audio</option>
          <option value="kar">MIDI/KAR</option>
        </select>
      </div>

      <div className="text-base text-muted">
        {scanning
          ? 'Scansione in corso…'
          : `${filtered.length} brani${filtered.length !== songs.length ? ` su ${songs.length}` : ''}`}
      </div>

      {songs.length === 0 && !scanning && (
        <div className="rounded-md border border-dashed border-line p-6 text-center text-base text-muted">
          {libraryPaths.length === 0
            ? 'La libreria è vuota. Vai in Impostazioni e aggiungi una cartella con i tuoi brani.'
            : 'Nessun brano trovato nelle cartelle scelte.'}
        </div>
      )}

      <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
        {filtered.slice(0, limit).map((song) => (
          <li
            key={song.id}
            className="group flex items-center gap-2 rounded-lg bg-row px-3 py-2 hover:bg-row-hover"
          >
            <span title={FORMAT_LABEL[song.format]}>
              <FormatIcon format={song.format} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-base font-medium">{song.title}</div>
              {song.artist && <div className="truncate text-base text-muted">{song.artist}</div>}
            </div>
            <div className="flex shrink-0 flex-wrap justify-end gap-1 ">
              <Btn variant="ghost" title="Ascolta in cuffia" onClick={() => void togglePreview(song.path)}>
                <Headphones />
              </Btn>
              <Btn variant="ghost" title="Riproduci subito" onClick={() => play(song)}>
                <Play />
              </Btn>
              <Btn title="Aggiungi alla scaletta" onClick={() => enqueue(song, 'A')}>
                <ListPlus />
              </Btn>
              <Btn variant="ghost" title="Aggiungi alla riserva" onClick={() => enqueue(song, 'B')}>
                <Plus />
              </Btn>
            </div>
          </li>
        ))}
        {filtered.length > limit && (
          <li className="py-2 text-center">
            <Btn onClick={() => setLimit((l) => l + PAGE)}>Mostra altri {PAGE}</Btn>
          </li>
        )}
      </ul>
    </div>
  )
}
