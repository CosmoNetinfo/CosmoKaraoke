import { ArrowLeftRight, ChevronDown, ChevronUp, Play, Trash2, UserPlus, X } from 'lucide-react'
import { useState } from 'react'
import { startPlayback } from '../lib/player'
import { useStore } from '../lib/store'
import type { QueueItem } from '../types'
import { Btn, Panel } from './ui'

function Row({ item, index, which }: { item: QueueItem; index: number; which: 'A' | 'B' }) {
  const singers = useStore((s) => s.singers)
  const moveInQueue = useStore((s) => s.moveInQueue)
  const transfer = useStore((s) => s.transfer)
  const removeFromQueue = useStore((s) => s.removeFromQueue)
  const setSingerOf = useStore((s) => s.setSingerOf)

  return (
    <li className="flex items-center gap-1.5 rounded-lg bg-row px-2.5 py-2">
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
    </li>
  )
}

export function Playlists() {
  const singers = useStore((s) => s.singers)
  const active = useStore((s) => s.activeSinger)
  const queueA = useStore((s) => s.queueA)
  const queueB = useStore((s) => s.queueB)
  const addSinger = useStore((s) => s.addSinger)
  const removeSinger = useStore((s) => s.removeSinger)
  const patch = useStore((s) => s.patch)
  const [name, setName] = useState('')

  const add = () => {
    addSinger(name)
    setName('')
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
                <button onClick={() => patch({ activeSinger: n })} title="Usa per i prossimi brani">
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

      <Panel title={`Scaletta (${queueA.length})`}>
        {queueA.length === 0 ? (
          <p className="text-base text-muted">Vuota. Aggiungi brani dalla libreria.</p>
        ) : (
          <ul className="space-y-1">
            {queueA.map((q, i) => (
              <Row key={q.uid} item={q} index={i} which="A" />
            ))}
          </ul>
        )}
      </Panel>

      <Panel title={`Riserva (${queueB.length})`}>
        {queueB.length === 0 ? (
          <p className="text-base text-muted">Una seconda lista per i brani da tenere pronti.</p>
        ) : (
          <ul className="space-y-1">
            {queueB.map((q, i) => (
              <Row key={q.uid} item={q} index={i} which="B" />
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
