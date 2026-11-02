import {
  Disc3,
  FileAudio,
  Film,
  Headphones,
  ListPlus,
  Music,
  Play,
  Plus,
  Search,
  Settings as SettingsIcon,
  Sparkles,
} from 'lucide-react'
import { useDeferredValue, useMemo, useState } from 'react'
import { startPlayback, togglePreview } from '../lib/player'
import { useStore } from '../lib/store'
import type { Format, Song } from '../types'
import { Btn } from './ui'

function FormatBadge({ format }: { format: Format }) {
  const badge = 'inline-flex items-center gap-1.5 rounded-md border border-line bg-inset px-2 py-1 text-base font-semibold text-text'
  if (format === 'cdg') {
    return (
      <span className={badge}>
        <Disc3 className="text-accent-text" /> CD+G
      </span>
    )
  }
  if (format === 'kar') {
    return (
      <span className={badge}>
        <Music className="text-accent-text" /> KAR
      </span>
    )
  }
  if (format === 'video') {
    return (
      <span className={badge}>
        <Film className="text-accent-text" /> Video
      </span>
    )
  }
  return (
    <span className={badge}>
      <FileAudio className="text-accent-text" /> Audio
    </span>
  )
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

  const haystack = useMemo(
    () => songs.map((s) => `${s.artist} ${s.title}`.toLowerCase()),
    [songs],
  )

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
    <div className="flex h-full flex-col gap-3.5">
      {/* BARRA SUPERIORE: RICERCA E FILTRI RAPIDI */}
      <div className="catalog-toolbar flex flex-col gap-2.5 rounded-2xl border border-line bg-panel p-3 sm:flex-row sm:items-center">
        {/* Ricerca */}
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted" />
          <input
            value={query}
            aria-label="Cerca nella libreria"
            onChange={(e) => {
              setQuery(e.target.value)
              setLimit(PAGE)
            }}
            placeholder="Cerca per titolo, artista o parole nel brano..."
            className="w-full rounded-xl border border-line bg-inset py-2.5 pr-4 pl-10 text-base font-medium text-text outline-none focus:border-accent"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2 top-1.5 flex h-11 w-11 items-center justify-center rounded-lg text-base font-bold text-muted hover:bg-btn hover:text-text"
              aria-label="Cancella la ricerca"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filtri pillola formato */}
        <div className="flex shrink-0 items-center gap-1 rounded-xl border border-line bg-inset p-1">
          <button
            onClick={() => setFormat('all')}
            className={`min-h-11 rounded-lg px-3 py-1.5 text-base font-bold transition-all ${
              format === 'all'
                ? 'bg-accent text-on-accent shadow-xs'
                : 'text-muted hover:bg-btn hover:text-text'
            }`}
          >
            Tutti
          </button>
          <button
            onClick={() => setFormat('cdg')}
            className={`min-h-11 rounded-lg px-3 py-1.5 text-base font-bold transition-all ${
              format === 'cdg'
                ? 'bg-accent text-on-accent shadow-xs'
                : 'text-muted hover:bg-btn hover:text-text'
            }`}
          >
            CD+G
          </button>
          <button
            onClick={() => setFormat('kar')}
            className={`min-h-11 rounded-lg px-3 py-1.5 text-base font-bold transition-all ${
              format === 'kar'
                ? 'bg-accent text-on-accent shadow-xs'
                : 'text-muted hover:bg-btn hover:text-text'
            }`}
          >
            KAR
          </button>
          <button
            onClick={() => setFormat('video')}
            className={`min-h-11 rounded-lg px-3 py-1.5 text-base font-bold transition-all ${
              format === 'video'
                ? 'bg-accent text-on-accent shadow-xs'
                : 'text-muted hover:bg-btn hover:text-text'
            }`}
          >
            Video
          </button>
        </div>
      </div>

      {/* RIEPILOGO STATISTICHE */}
      <div className="catalog-summary flex items-center justify-between text-base font-semibold text-muted">
        <div>
          {scanning ? (
            <span className="flex items-center gap-1 text-accent-text">
              <Sparkles className="h-3 w-3 animate-spin" /> Scansione libreria in corso…
            </span>
          ) : (
            <span>
              Trovati <span className="text-text">{filtered.length}</span> brani
              {filtered.length !== songs.length && ` su ${songs.length} totali`}
            </span>
          )}
        </div>
      </div>

      {/* STATO VUOTO */}
      {songs.length === 0 && !scanning && (
        <div className="catalog-empty flex flex-col items-center justify-center rounded-2xl border border-dashed border-line p-10 text-center">
          <div className="catalog-empty-icon mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-line bg-panel text-accent-text">
            <Music className="h-8 w-8" />
          </div>
          <div className="text-base font-bold text-text">Libreria vuota</div>
          <p className="mt-1 max-w-md text-base text-muted">
            {libraryPaths.length === 0
              ? 'Per iniziare, aggiungi la cartella in cui tieni i brani karaoke. La scansione include anche le sottocartelle.'
              : 'Non sono stati trovati brani nelle cartelle scelte. Controlla la selezione o avvia una nuova scansione.'}
          </p>
          <Btn className="mt-4" onClick={() => useStore.getState().patch({ tab: 'settings' })}>
            <SettingsIcon /> {libraryPaths.length === 0 ? 'Aggiungi la cartella musicale' : 'Controlla le cartelle'}
          </Btn>
        </div>
      )}

      {/* LISTA DEI BRANI DEL CATALOGO */}
      <div className="catalog-list min-h-0 flex-1 overflow-hidden rounded-2xl border border-line bg-panel shadow-sm">
        <ul className="h-full divide-y divide-line/30 overflow-y-auto pr-1">
          {filtered.slice(0, limit).map((song) => (
            <li
              key={song.id}
              className="catalog-row group flex items-center justify-between gap-3 p-3 transition-colors hover:bg-row-hover"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-base font-bold text-text group-hover:text-accent-text">
                    {song.title}
                  </span>
                  <FormatBadge format={song.format} />
                </div>
                {song.artist && (
                  <div className="truncate text-base font-medium text-muted">{song.artist}</div>
                )}
              </div>

              {/* PULSANTI DI AZIONE RAPIDA */}
              <div className="flex shrink-0 items-center gap-1.5 opacity-90 transition-opacity group-hover:opacity-100">
                <Btn
                  variant="ghost"
                  className="p-0"
                  title="Ascolta anteprima in cuffia (regia)"
                  onClick={() => void togglePreview(song.path)}
                >
                  <Headphones size={16} />
                </Btn>
                <Btn
                  variant="ghost"
                  className="p-0"
                  title="Riproduci subito (salta la coda)"
                  onClick={() => play(song)}
                >
                  <Play size={16} className="text-accent-text" />
                </Btn>
                <Btn
                  variant="primary"
                  className="px-3 text-base font-bold"
                  title="Aggiungi in fondo alla scaletta attiva"
                  onClick={() => enqueue(song, 'A')}
                >
                  <ListPlus size={15} />
                  <span>Accoda</span>
                </Btn>
                <Btn
                  variant="default"
                  className="px-3 text-base"
                  title="Metti nella scaletta di riserva"
                  onClick={() => enqueue(song, 'B')}
                >
                  <Plus size={15} />
                </Btn>
              </div>
            </li>
          ))}

          {filtered.length > limit && (
            <li className="p-4 text-center">
              <Btn onClick={() => setLimit((l) => l + PAGE)} className="text-base">
                Mostra altri {PAGE} brani
              </Btn>
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}
