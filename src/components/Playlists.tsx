import {
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  GripVertical,
  Play,
  Save,
  Trash2,
  Upload,
  UserPlus,
  X,
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
  onDragStart: (e: React.DragEvent) => void
  onDragEnd: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
}

function Row({
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

  return (
    <li
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`flex items-center gap-1.5 rounded-lg bg-row px-2.5 py-2 transition-all ${
        isDragging ? 'opacity-40' : ''
      } ${isDragOver ? 'border-t-2 border-accent' : ''}`}
    >
      <span
        title="Trascina per spostare"
        className="cursor-grab text-muted hover:text-text active:cursor-grabbing"
      >
        <GripVertical size={16} />
      </span>
      <span className="w-5 text-center text-base tabular-nums text-muted">{index + 1}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-base font-medium">{item.song.title}</div>
        {item.song.yt === 'downloading' && (
          <div className="text-base text-muted">Scarico da YouTube…</div>
        )}
        {item.song.yt === 'error' && (
          <div className="text-base text-danger">Download non riuscito</div>
        )}
        <select
          value={item.singer}
          draggable={false}
          onDragStart={(e) => e.stopPropagation()}
          onChange={(e) => setSingerOf(item.uid, e.target.value)}
          className="mt-0.5 max-w-full rounded bg-transparent text-base text-muted outline-none"
        >
          <option value="">— cantante —</option>
          {singers.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
          {item.singer && !singers.includes(item.singer) && (
            <option value={item.singer}>{item.singer}</option>
          )}
        </select>
      </div>
      <div
        className="flex items-center gap-0.5"
        draggable={false}
        onDragStart={(e) => e.stopPropagation()}
      >
        <Btn variant="ghost" title="Riproduci ora" onClick={() => void startPlayback(item)}>
          <Play />
        </Btn>
        <Btn variant="ghost" title="Su" onClick={() => moveInQueue(item.uid, -1)}>
          <ChevronUp />
        </Btn>
        <Btn variant="ghost" title="Giù" onClick={() => moveInQueue(item.uid, 1)}>
          <ChevronDown />
        </Btn>
        <Btn
          variant="ghost"
          title={which === 'A' ? 'Sposta nella riserva' : 'Sposta nella scaletta'}
          onClick={() => transfer(item.uid)}
        >
          <ArrowLeftRight />
        </Btn>
        <Btn variant="ghost" title="Togli" onClick={() => removeFromQueue(item.uid)}>
          <Trash2 />
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
  const [showSave, setShowSave] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [showSavedList, setShowSavedList] = useState(false)

  const [draggingUid, setDraggingUid] = useState<string | null>(null)
  const [dragOverUid, setDragOverUid] = useState<string | null>(null)
  const [dragOverList, setDragOverList] = useState<'A' | 'B' | null>(null)

  const add = () => {
    addSinger(name)
    setName('')
  }

  const doSave = () => {
    if (!saveName.trim()) return
    savePlaylist(saveName.trim(), 'A')
    setSaveName('')
    setShowSave(false)
  }

  return (
    <div className="space-y-3">
      <Panel title="Cantanti">
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="Nome del cantante…"
            className="min-w-0 flex-1 rounded-lg border-2 border-line bg-inset px-3 py-2 text-base outline-none focus:border-accent"
          />
          <Btn onClick={add} disabled={!name.trim()}>
            <UserPlus />
          </Btn>
        </div>
        {singers.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {singers.map((n) => (
              <span
                key={n}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-base ${
                  n === active ? 'bg-accent text-on-accent' : 'bg-btn text-text'
                }`}
              >
                <button
                  onClick={() => patch({ activeSinger: n })}
                  title="Usa per i prossimi brani"
                >
                  {n}
                </button>
                <button
                  onClick={() => removeSinger(n)}
                  title="Elimina"
                  className="opacity-60 hover:opacity-100"
                >
                  <X />
                </button>
              </span>
            ))}
          </div>
        )}
        <p className="mt-2 text-base text-muted">
          Il cantante evidenziato viene assegnato ai brani che aggiungi.
        </p>
      </Panel>

      <Panel
        title={`Scaletta (${queueA.length})`}
        right={
          <div className="flex items-center gap-1">
            <Btn
              variant="ghost"
              title="Salva scaletta"
              onClick={() => {
                setShowSave(!showSave)
                setShowSavedList(false)
              }}
              disabled={queueA.length === 0}
            >
              <Save /> Salva
            </Btn>
            <Btn
              variant="ghost"
              title="Playlist salvate"
              onClick={() => {
                setShowSavedList(!showSavedList)
                setShowSave(false)
              }}
            >
              <FolderOpen /> Playlist ({savedPlaylists.length})
            </Btn>
            {queueA.length > 0 && (
              <Btn
                variant="ghost"
                title="Svuota scaletta"
                onClick={() => clearQueue('A')}
              >
                <Trash2 />
              </Btn>
            )}
          </div>
        }
      >
        {showSave && (
          <div className="mb-2.5 flex items-center gap-2 rounded-lg bg-inset p-2">
            <input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && doSave()}
              placeholder="Nome playlist (es. Serata di sabato)…"
              className="min-w-0 flex-1 rounded border border-line bg-transparent px-2.5 py-1 text-base outline-none focus:border-accent"
              autoFocus
            />
            <Btn variant="primary" onClick={doSave} disabled={!saveName.trim()}>
              Salva
            </Btn>
            <Btn variant="ghost" onClick={() => setShowSave(false)}>
              Annulla
            </Btn>
          </div>
        )}

        {showSavedList && (
          <div className="mb-3 space-y-1.5 rounded-lg border border-line bg-panel p-2">
            <div className="flex items-center justify-between text-base font-bold">
              <span>Playlist salvate</span>
              <Btn variant="ghost" onClick={() => setShowSavedList(false)} title="Chiudi">
                <X size={16} />
              </Btn>
            </div>
            {savedPlaylists.length === 0 ? (
              <p className="py-2 text-base text-muted">Nessuna playlist salvata.</p>
            ) : (
              <ul className="max-h-48 space-y-1 overflow-y-auto">
                {savedPlaylists.map((pl) => (
                  <li
                    key={pl.id}
                    className="flex items-center justify-between gap-1.5 rounded bg-row px-2.5 py-1.5 text-base"
                  >
                    <div className="min-w-0 flex-1 truncate">
                      <span className="font-semibold">{pl.name}</span>
                      <span className="ml-2 text-sm text-muted">({pl.items.length} brani)</span>
                    </div>
                    <Btn
                      variant="ghost"
                      title="Carica in scaletta"
                      onClick={() => loadPlaylist(pl.id, 'replace', 'A')}
                    >
                      <Upload size={16} /> Carica
                    </Btn>
                    <Btn
                      variant="ghost"
                      title="+ Aggiungi"
                      onClick={() => loadPlaylist(pl.id, 'append', 'A')}
                    >
                      + Aggiungi
                    </Btn>
                    <Btn
                      variant="ghost"
                      title="Elimina playlist"
                      onClick={() => deletePlaylist(pl.id)}
                    >
                      <Trash2 size={16} />
                    </Btn>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {queueA.length === 0 ? (
          <div
            onDragOver={(e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = 'move'
              setDragOverList('A')
            }}
            onDragLeave={() => setDragOverList(null)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOverList(null)
              try {
                const data = JSON.parse(e.dataTransfer.getData('text/plain'))
                if (data?.uid) reorderQueue(data.uid, 'A')
              } catch {}
            }}
            className={`rounded-lg border-2 border-dashed p-4 text-center text-base transition-colors ${
              dragOverList === 'A' ? 'border-accent bg-accent/10' : 'border-line text-muted'
            }`}
          >
            Scaletta vuota. Trascina qui un brano o aggiungilo dalla libreria.
          </div>
        ) : (
          <ul
            onDragOver={(e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = 'move'
            }}
            onDrop={(e) => {
              e.preventDefault()
              try {
                const data = JSON.parse(e.dataTransfer.getData('text/plain'))
                if (data?.uid) reorderQueue(data.uid, 'A')
              } catch {}
            }}
            className="max-h-72 space-y-1 overflow-y-auto pr-1"
          >
            {queueA.map((q, i) => (
              <Row
                key={q.uid}
                item={q}
                index={i}
                which="A"
                isDragging={draggingUid === q.uid}
                isDragOver={dragOverUid === q.uid}
                onDragStart={(e) => {
                  e.dataTransfer.setData(
                    'text/plain',
                    JSON.stringify({ uid: q.uid, source: 'A' }),
                  )
                  e.dataTransfer.effectAllowed = 'move'
                  setDraggingUid(q.uid)
                }}
                onDragEnd={() => {
                  setDraggingUid(null)
                  setDragOverUid(null)
                  setDragOverList(null)
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  e.dataTransfer.dropEffect = 'move'
                  if (dragOverUid !== q.uid) setDragOverUid(q.uid)
                }}
                onDragLeave={() => {
                  if (dragOverUid === q.uid) setDragOverUid(null)
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setDragOverUid(null)
                  setDraggingUid(null)
                  try {
                    const data = JSON.parse(e.dataTransfer.getData('text/plain'))
                    if (data?.uid) reorderQueue(data.uid, 'A', i)
                  } catch {}
                }}
              />
            ))}
          </ul>
        )}
      </Panel>

      <Panel
        title={`Riserva (${queueB.length})`}
        right={
          queueB.length > 0 ? (
            <Btn
              variant="ghost"
              title="Svuota riserva"
              onClick={() => clearQueue('B')}
            >
              <Trash2 />
            </Btn>
          ) : undefined
        }
      >
        {queueB.length === 0 ? (
          <div
            onDragOver={(e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = 'move'
              setDragOverList('B')
            }}
            onDragLeave={() => setDragOverList(null)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOverList(null)
              try {
                const data = JSON.parse(e.dataTransfer.getData('text/plain'))
                if (data?.uid) reorderQueue(data.uid, 'B')
              } catch {}
            }}
            className={`rounded-lg border-2 border-dashed p-4 text-center text-base transition-colors ${
              dragOverList === 'B' ? 'border-accent bg-accent/10' : 'border-line text-muted'
            }`}
          >
            Una seconda lista per i brani da tenere pronti. Puoi trascinare qui i brani.
          </div>
        ) : (
          <ul
            onDragOver={(e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = 'move'
            }}
            onDrop={(e) => {
              e.preventDefault()
              try {
                const data = JSON.parse(e.dataTransfer.getData('text/plain'))
                if (data?.uid) reorderQueue(data.uid, 'B')
              } catch {}
            }}
            className="max-h-72 space-y-1 overflow-y-auto pr-1"
          >
            {queueB.map((q, i) => (
              <Row
                key={q.uid}
                item={q}
                index={i}
                which="B"
                isDragging={draggingUid === q.uid}
                isDragOver={dragOverUid === q.uid}
                onDragStart={(e) => {
                  e.dataTransfer.setData(
                    'text/plain',
                    JSON.stringify({ uid: q.uid, source: 'B' }),
                  )
                  e.dataTransfer.effectAllowed = 'move'
                  setDraggingUid(q.uid)
                }}
                onDragEnd={() => {
                  setDraggingUid(null)
                  setDragOverUid(null)
                  setDragOverList(null)
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  e.dataTransfer.dropEffect = 'move'
                  if (dragOverUid !== q.uid) setDragOverUid(q.uid)
                }}
                onDragLeave={() => {
                  if (dragOverUid === q.uid) setDragOverUid(null)
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setDragOverUid(null)
                  setDraggingUid(null)
                  try {
                    const data = JSON.parse(e.dataTransfer.getData('text/plain'))
                    if (data?.uid) reorderQueue(data.uid, 'B', i)
                  } catch {}
                }}
              />
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
