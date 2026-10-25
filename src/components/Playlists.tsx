import {
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
  Disc3,
  Film,
  GripVertical,
  ListMusic,
  Music,
  Play,
  Save,
  Trash2,
  Users,
  Video,
} from 'lucide-react'
import { useState } from 'react'
import { startPlayback } from '../lib/player'
import { useStore } from '../lib/store'
import type { QueueItem } from '../types'
import { Btn, Panel } from './ui'

interface RowProps {
  item: QueueItem
  index: number
  which: 'A' | 'B'
  isDragging: boolean
  isDragOver: boolean
  onDragStart: () => void
  onDragEnd: () => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: () => void
}

function FormatBadge({ format, isYt }: { format: string; isYt?: boolean }) {
  if (isYt) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-red-500/30 bg-red-950/40 px-1.5 py-0.5 text-xs font-bold text-red-400">
        <Film className="h-3 w-3" /> YT
      </span>
    )
  }
  if (format === 'kar') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-950/40 px-1.5 py-0.5 text-xs font-bold text-emerald-400">
        <Music className="h-3 w-3" /> KAR
      </span>
    )
  }
  if (format === 'video') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-950/40 px-1.5 py-0.5 text-xs font-bold text-amber-400">
        <Video className="h-3 w-3" /> Video
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-indigo-500/30 bg-indigo-950/40 px-1.5 py-0.5 text-xs font-bold text-indigo-300">
      <Disc3 className="h-3 w-3" /> CD+G
    </span>
  )
}

function QueueRow({
  item,
  index,
  which,
  isDragging,
  isDragOver,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}: RowProps) {
  const singers = useStore((s) => s.singers)
  const moveInQueue = useStore((s) => s.moveInQueue)
  const transfer = useStore((s) => s.transfer)
  const removeFromQueue = useStore((s) => s.removeFromQueue)
  const setSingerOf = useStore((s) => s.setSingerOf)

  const isYt = Boolean(item.song.yt || item.song.path.startsWith('https://'))

  return (
    <li
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`group flex items-center gap-2.5 rounded-xl border border-line/60 bg-row p-2.5 transition-all hover:border-line hover:bg-row-hover ${
        isDragging ? 'opacity-40' : ''
      } ${isDragOver ? 'border-t-2 border-accent shadow-sm' : ''}`}
    >
      <span
        title="Trascina per riordinare"
        className="cursor-grab text-muted/60 transition-colors hover:text-text active:cursor-grabbing"
      >
        <GripVertical size={16} />
      </span>
      <span className="w-5 text-center text-sm font-bold tabular-nums text-muted/80">{index + 1}</span>
      
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 truncate">
          <span className="truncate text-base font-bold text-text">{item.song.title}</span>
          <FormatBadge format={item.song.format} isYt={isYt} />
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted">
          {item.song.artist && <span className="truncate">{item.song.artist}</span>}
          {item.song.artist && <span>·</span>}
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-accent-text">🎤</span>
            <select
              value={item.singer}
              draggable={false}
              onDragStart={(e) => e.stopPropagation()}
              onChange={(e) => setSingerOf(item.uid, e.target.value)}
              className="max-w-full rounded bg-transparent text-sm font-semibold text-accent-text outline-none hover:underline"
            >
              <option value="" className="bg-panel text-muted">— assegna cantante —</option>
              {singers.map((n) => (
                <option key={n} value={n} className="bg-panel text-text">
                  {n}
                </option>
              ))}
              {item.singer && !singers.includes(item.singer) && (
                <option value={item.singer} className="bg-panel text-text">{item.singer}</option>
              )}
            </select>
          </div>
        </div>

        {item.song.yt === 'downloading' && (
          <div className="mt-1 text-xs font-semibold text-accent-text">Scarico video da YouTube…</div>
        )}
        {item.song.yt === 'error' && (
          <div className="mt-1 text-xs font-semibold text-danger">Download non riuscito</div>
        )}
      </div>

      <div
        className="flex shrink-0 items-center gap-1 opacity-90 group-hover:opacity-100"
        draggable={false}
        onDragStart={(e) => e.stopPropagation()}
      >
        <Btn variant="ghost" className="h-9 w-9 p-0" title="Riproduci ora" onClick={() => void startPlayback(item)}>
          <Play size={16} className="text-accent-text" />
        </Btn>
        <Btn variant="ghost" className="h-9 w-9 p-0" title="Su" onClick={() => moveInQueue(item.uid, -1)}>
          <ChevronUp size={16} />
        </Btn>
        <Btn variant="ghost" className="h-9 w-9 p-0" title="Giù" onClick={() => moveInQueue(item.uid, 1)}>
          <ChevronDown size={16} />
        </Btn>
        <Btn
          variant="ghost"
          className="h-9 w-9 p-0"
          title={which === 'A' ? 'Sposta nella riserva' : 'Sposta nella scaletta'}
          onClick={() => transfer(item.uid)}
        >
          <ArrowLeftRight size={15} />
        </Btn>
        <Btn variant="ghost" className="h-9 w-9 p-0 text-muted hover:text-danger" title="Togli" onClick={() => removeFromQueue(item.uid)}>
          <Trash2 size={15} />
        </Btn>
      </div>
    </li>
  )
}

export function Playlists() {
  const singers = useStore((s) => s.singers)
  const active = useStore((s) => s.activeSinger)
  const queueA = useStore((s) => s.queueA)
  const queueB = useStore((s) => s.queueB)
  const savedPlaylists = useStore((s) => s.savedPlaylists)
  const addSinger = useStore((s) => s.addSinger)
  const removeSinger = useStore((s) => s.removeSinger)
  const reorderQueue = useStore((s) => s.reorderQueue)
  const savePlaylist = useStore((s) => s.savePlaylist)
  const loadPlaylist = useStore((s) => s.loadPlaylist)
  const deletePlaylist = useStore((s) => s.deletePlaylist)
  const clearQueue = useStore((s) => s.clearQueue)
  const patch = useStore((s) => s.patch)

  const [name, setName] = useState('')
  const [playlistName, setPlaylistName] = useState('')
  const [activeTab, setActiveTab] = useState<'A' | 'B' | 'singers' | 'saved'>('A')
  const [dragUid, setDragUid] = useState<string | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  const onAddSinger = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    addSinger(trimmed)
    setName('')
  }

  const onSave = () => {
    const trimmed = playlistName.trim()
    if (!trimmed) return
    savePlaylist(trimmed, activeTab === 'B' ? 'B' : 'A')
    setPlaylistName('')
  }

  const list = activeTab === 'A' ? queueA : queueB

  const handleDragStart = (uid: string) => setDragUid(uid)
  const handleDragEnd = () => {
    setDragUid(null)
    setOverIndex(null)
  }
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    setOverIndex(idx)
  }
  const handleDrop = (toIdx: number) => {
    if (!dragUid) return
    reorderQueue(dragUid, activeTab === 'B' ? 'B' : 'A', toIdx)
    setDragUid(null)
    setOverIndex(null)
  }

  return (
    <Panel className="border-line/70">
      {/* SELETTORE A SCHEDE DELLA CODA */}
      <div className="-mx-5 -mt-5 mb-4 border-b border-line bg-header/40 p-2">
        <div className="flex flex-wrap items-center justify-between gap-2 px-3">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('A')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold transition-all ${
                activeTab === 'A'
                  ? 'bg-accent text-on-accent shadow-xs'
                  : 'text-muted hover:bg-btn hover:text-text'
              }`}
            >
              <ListMusic size={15} />
              <span>Scaletta</span>
              <span className={`ml-1 rounded-full px-1.5 py-0.2 text-xs ${activeTab === 'A' ? 'bg-white/20' : 'bg-inset text-muted'}`}>
                {queueA.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('B')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold transition-all ${
                activeTab === 'B'
                  ? 'bg-accent text-on-accent shadow-xs'
                  : 'text-muted hover:bg-btn hover:text-text'
              }`}
            >
              <span>Riserva</span>
              <span className={`ml-1 rounded-full px-1.5 py-0.2 text-xs ${activeTab === 'B' ? 'bg-white/20' : 'bg-inset text-muted'}`}>
                {queueB.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('singers')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold transition-all ${
                activeTab === 'singers'
                  ? 'bg-accent text-on-accent shadow-xs'
                  : 'text-muted hover:bg-btn hover:text-text'
              }`}
            >
              <Users size={15} />
              <span>Cantanti</span>
              <span className={`ml-1 rounded-full px-1.5 py-0.2 text-xs ${activeTab === 'singers' ? 'bg-white/20' : 'bg-inset text-muted'}`}>
                {singers.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('saved')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold transition-all ${
                activeTab === 'saved'
                  ? 'bg-accent text-on-accent shadow-xs'
                  : 'text-muted hover:bg-btn hover:text-text'
              }`}
            >
              <Save size={15} />
              <span>Salvate</span>
            </button>
          </div>

          {(activeTab === 'A' || activeTab === 'B') && list.length > 0 && (
            <Btn
              variant="ghost"
              className="h-8 px-2 text-xs text-muted hover:text-danger"
              onClick={() => clearQueue(activeTab)}
              title="Svuota questa coda"
            >
              <Trash2 size={13} className="mr-1" /> Svuota
            </Btn>
          )}
        </div>
      </div>

      {/* VISTA SCALETTA A O RISERVA B */}
      {(activeTab === 'A' || activeTab === 'B') && (
        <div className="space-y-3">
          {list.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line p-6 text-center text-sm font-medium text-muted">
              {activeTab === 'A'
                ? 'La scaletta è vuota. Cerca un brano nella Libreria o su YouTube e premi "+ Accoda".'
                : 'La riserva è vuota. Puoi parcheggiare qui i brani di scorta.'}
            </div>
          ) : (
            <ul className="space-y-2">
              {list.map((item, idx) => (
                <QueueRow
                  key={item.uid}
                  item={item}
                  index={idx}
                  which={activeTab}
                  isDragging={dragUid === item.uid}
                  isDragOver={overIndex === idx}
                  onDragStart={() => handleDragStart(item.uid)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragLeave={() => setOverIndex(null)}
                  onDrop={() => handleDrop(idx)}
                />
              ))}
            </ul>
          )}

          {list.length > 0 && (
            <div className="flex gap-2 pt-2 border-t border-line/40">
              <input
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                placeholder="Salva scaletta con nome…"
                className="min-w-0 flex-1 rounded-xl border border-line bg-inset px-3 py-1.5 text-sm outline-none focus:border-accent"
              />
              <Btn onClick={onSave} disabled={!playlistName.trim()} className="text-sm">
                Salva
              </Btn>
            </div>
          )}
        </div>
      )}

      {/* VISTA CANTANTI */}
      {activeTab === 'singers' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onAddSinger()}
              placeholder="Nome del cantante o del tavolo…"
              className="min-w-0 flex-1 rounded-xl border border-line bg-inset px-3.5 py-2 text-base outline-none focus:border-accent"
            />
            <Btn onClick={onAddSinger} variant="primary">
              Aggiungi
            </Btn>
          </div>

          <div className="space-y-1.5">
            <div className="text-xs font-bold uppercase tracking-wider text-muted">Cantante al microfono attivo</div>
            <select
              value={active}
              onChange={(e) => patch({ activeSinger: e.target.value })}
              className="w-full rounded-xl border border-line bg-inset px-3 py-2 text-base font-semibold text-text outline-none"
            >
              <option value="">— Nessun cantante selezionato —</option>
              {singers.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3 space-y-1.5">
            <div className="text-xs font-bold uppercase tracking-wider text-muted">Lista partecipanti</div>
            {singers.length === 0 ? (
              <div className="text-sm text-muted">Nessun cantante registrato.</div>
            ) : (
              <ul className="divide-y divide-line/40 rounded-xl border border-line bg-inset">
                {singers.map((s) => (
                  <li key={s} className="flex items-center justify-between px-3 py-2 text-base">
                    <span className="font-medium text-text">{s}</span>
                    <button
                      onClick={() => removeSinger(s)}
                      className="p-1 text-muted hover:text-danger"
                      title="Elimina cantante"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* VISTA PLAYLIST SALVATE */}
      {activeTab === 'saved' && (
        <div className="space-y-3">
          {savedPlaylists.length === 0 ? (
            <div className="text-sm text-muted">Nessuna scaletta salvata finora.</div>
          ) : (
            <ul className="divide-y divide-line/40 rounded-xl border border-line bg-inset">
              {savedPlaylists.map((pl) => (
                <li key={pl.name} className="flex items-center justify-between p-3">
                  <div>
                    <div className="text-base font-bold text-text">{pl.name}</div>
                    <div className="text-xs text-muted">{pl.items.length} brani</div>
                  </div>
                  <div className="flex gap-2">
                    <Btn
                      onClick={() => loadPlaylist(pl.name, 'replace', 'A')}
                      className="text-xs"
                      title="Carica nella scaletta A"
                    >
                      Carica in A
                    </Btn>
                    <Btn
                      variant="ghost"
                      onClick={() => deletePlaylist(pl.name)}
                      className="text-muted hover:text-danger"
                    >
                      <Trash2 size={16} />
                    </Btn>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Panel>
  )
}
