import { Disc3, Pause, Play, Send, SkipForward, Square, Waves } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { engine } from '../lib/engine'
import { mixNext, playNext, seekTo, sendDisplayMessage, stopAll, togglePause } from '../lib/player'
import { useStore } from '../lib/store'
import { CdgCanvas } from './CdgCanvas'
import { Btn, fmtTime } from './ui'
import { convertFileSrc } from '@tauri-apps/api/core'

export function PlayerPanel() {
  const current = useStore((s) => s.current)
  const playing = useStore((s) => s.playing)
  const position = useStore((s) => s.position)
  const duration = useStore((s) => s.duration)
  const hasNext = useStore((s) => s.queueA.length > 0)
  const [text, setText] = useState('')
  const [seconds, setSeconds] = useState(10)
  const videoBox = useRef<HTMLDivElement>(null)

  // il video del motore audio viene mostrato qui dentro
  useEffect(() => {
    const box = videoBox.current
    if (!box) return
    box.appendChild(engine.media)
    return () => {
      engine.media.remove()
    }
  }, [])

  const getPos = useCallback(() => engine.position, [])
  const format = current?.song.format
  const cdgUrl = current?.song.cdg ? convertFileSrc(current.song.cdg) : null

  const send = () => {
    if (!text.trim()) return
    sendDisplayMessage(text.trim(), seconds)
    setText('')
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
        <div ref={videoBox} className={`absolute inset-0 ${format === 'video' ? '' : 'invisible'}`} />
        {format === 'cdg' && (
          <CdgCanvas url={cdgUrl} getPosition={getPos} className="absolute inset-0 h-full w-full object-contain" />
        )}
        {format !== 'cdg' && format !== 'video' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted">
            {format === 'audio' ? (
              <Waves style={{ width: '3.5rem', height: '3.5rem' }} />
            ) : (
              <Disc3 style={{ width: '3.5rem', height: '3.5rem' }} />
            )}
            <span className="text-base">{current ? 'Solo audio' : 'Nessun brano in riproduzione'}</span>
          </div>
        )}
      </div>

      <div className="min-h-[3.5rem]">
        <div className="text-xl font-bold">{current?.song.title ?? '—'}</div>
        <div className="text-base text-muted">
          {[current?.song.artist, current?.singer && `canta ${current.singer}`]
            .filter(Boolean)
            .join(' · ')}
        </div>
      </div>

      <div className="flex items-center gap-2 text-base tabular-nums text-muted">
        <span className="w-12 text-right">{fmtTime(position)}</span>
        <input
          type="range"
          min={0}
          max={Math.max(duration, 1)}
          step={0.5}
          value={Math.min(position, Math.max(duration, 1))}
          disabled={!current}
          onChange={(e) => seekTo(Number(e.target.value))}
          className="h-8 flex-1"
        />
        <span className="w-12">{fmtTime(duration)}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Btn variant="primary" className="min-w-40 flex-1" onClick={() => void togglePause()}>
          {playing ? <Pause /> : <Play />}
          {playing ? 'Pausa' : current ? 'Riprendi' : 'Avvia scaletta'}
        </Btn>
        <Btn onClick={stopAll} title="Ferma">
          <Square />
        </Btn>
        <Btn disabled={!hasNext} onClick={() => void playNext()} title="Passa subito al prossimo">
          <SkipForward /> Prossimo
        </Btn>
        <Btn
          disabled={!hasNext}
          onClick={() => void mixNext()}
          title="Dissolvenza del brano in corso e partenza del successivo"
        >
          Mix
        </Btn>
      </div>

      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Messaggio sullo schermo…"
          className="min-w-0 flex-1 rounded-lg border-2 border-line bg-inset px-3 py-2 text-base outline-none focus:border-accent"
        />
        <select
          value={seconds}
          onChange={(e) => setSeconds(Number(e.target.value))}
          className="rounded-lg border-2 border-line bg-inset px-2 text-base"
        >
          <option value={5}>5 s</option>
          <option value={10}>10 s</option>
          <option value={20}>20 s</option>
          <option value={0}>fisso</option>
        </select>
        <Btn onClick={send} title="Invia">
          <Send />
        </Btn>
        <Btn variant="ghost" onClick={() => sendDisplayMessage('', 1)} title="Togli il messaggio">
          Togli
        </Btn>
      </div>
    </div>
  )
}
