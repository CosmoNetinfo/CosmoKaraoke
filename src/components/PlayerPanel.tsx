import { convertFileSrc } from '@tauri-apps/api/core'
import {
  Disc3,
  Mic,
  Music,
  Pause,
  Play,
  Send,
  SkipForward,
  Square,
  Waves,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { engine } from '../lib/engine'
import { karEngine } from '../lib/kar'
import { mixNext, playNext, seekTo, sendDisplayMessage, setPitch, setTempo, stopAll, togglePause } from '../lib/player'
import { useStore } from '../lib/store'
import { CdgCanvas } from './CdgCanvas'
import { KarDisplay } from './KarDisplay'
import { Btn, fmtTime } from './ui'

export function PlayerPanel() {
  const current = useStore((s) => s.current)
  const playing = useStore((s) => s.playing)
  const position = useStore((s) => s.position)
  const duration = useStore((s) => s.duration)
  const karLines = useStore((s) => s.karLines)
  const pitch = useStore((s) => s.settings.pitch)
  const tempo = useStore((s) => s.settings.tempo)
  const patchSettings = useStore((s) => s.patchSettings)
  const hasNext = useStore((s) => s.queueA.length > 0)

  const [text, setText] = useState('')
  const [seconds, setSeconds] = useState(10)
  const videoBox = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const box = videoBox.current
    if (!box) return
    box.appendChild(engine.media)
    return () => {
      engine.media.remove()
    }
  }, [])

  const getPos = useCallback(
    () => (current?.song.format === 'kar' ? karEngine.position : engine.position),
    [current],
  )
  const format = current?.song.format
  const cdgUrl = current?.song.cdg ? convertFileSrc(current.song.cdg) : null

  const send = () => {
    if (!text.trim()) return
    sendDisplayMessage(text.trim(), seconds)
    setText('')
  }

  const handleSetPitch = (newPitch: number) => {
    patchSettings({ pitch: newPitch })
    setPitch(newPitch)
  }

  const handleSetTempo = (newTempo: number) => {
    patchSettings({ tempo: newTempo })
    setTempo(newTempo)
  }

  return (
    <div className="space-y-3.5">
      {/* DECK SCREEN / VIDEO PREVIEW */}
      <div className="relative aspect-video overflow-hidden rounded-2xl border border-line/80 bg-black shadow-lg">
        <div
          ref={videoBox}
          className={`absolute inset-0 ${format === 'video' ? '' : 'invisible'}`}
        />
        {format === 'cdg' && (
          <CdgCanvas
            url={cdgUrl}
            getPosition={getPos}
            className="absolute inset-0 h-full w-full object-contain"
          />
        )}
        {format === 'kar' && karLines.length > 0 && (
          <KarDisplay
            lines={karLines}
            getPosition={getPos}
            textScale={0.8}
            className="absolute inset-0 h-full w-full"
          />
        )}
        {format !== 'cdg' && format !== 'video' && (format !== 'kar' || karLines.length === 0) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted">
            {format === 'audio' ? (
              <Waves className="h-12 w-12 text-accent-text" />
            ) : format === 'kar' ? (
              <Music className="h-12 w-12 text-emerald-400" />
            ) : (
              <Disc3 className="h-12 w-12 text-indigo-400" />
            )}
            <span className="text-sm font-medium">
              {current
                ? format === 'kar'
                  ? 'MIDI strumentale (senza testo)'
                  : 'Traccia solo audio'
                : 'In attesa di avvio scaletta'}
            </span>
          </div>
        )}

        {/* Badge formato in sovrimpressione video */}
        {current && (
          <div className="absolute top-2.5 right-2.5 rounded-lg border border-white/20 bg-black/60 px-2 py-0.5 text-xs font-black tracking-wider text-white uppercase backdrop-blur-xs">
            {format?.toUpperCase()}
          </div>
        )}
      </div>

      {/* TITOLO BRANO & CANTANTE OSPITE (DECK INFO) */}
      <div className="rounded-2xl border border-line bg-panel p-4 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="truncate text-xl font-extrabold tracking-tight text-text">
              {current?.song.title ?? 'Nessun brano'}
            </div>
            <div className="truncate text-sm font-medium text-muted">
              {current?.song.artist || 'Seleziona un brano dal catalogo per iniziare'}
            </div>
          </div>
        </div>

        {/* Badge Cantante al microfono */}
        {current?.singer ? (
          <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent-text">
            <Mic className="h-3.5 w-3.5 text-accent-text" />
            <span>Al microfono:</span>
            <span className="font-extrabold text-text">{current.singer}</span>
          </div>
        ) : current ? (
          <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted">
            <Mic className="h-3.5 w-3.5" />
            <span>Microfono aperto</span>
          </div>
        ) : null}

        {/* TEMPI E BARRA DI AVANZAMENTO DIGITALE */}
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-extrabold tabular-nums tracking-wider text-muted">
            <span className="text-accent-text">{fmtTime(position)}</span>
            <span>{fmtTime(duration)}</span>
          </div>
          
          <div className="relative flex items-center">
            <input
              type="range"
              min={0}
              max={Math.max(duration, 1)}
              step={0.5}
              value={Math.min(position, Math.max(duration, 1))}
              disabled={!current}
              onChange={(e) => seekTo(Number(e.target.value))}
              className="h-2 w-full cursor-pointer accent-accent"
            />
          </div>
        </div>

        {/* CONTROLLI TRASPORTO CONSOLLE */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          <Btn
            onClick={stopAll}
            title="Ferma"
            variant="default"
            className="flex flex-col items-center justify-center gap-1 p-2 text-xs font-bold"
          >
            <Square size={16} />
            <span>Stop</span>
          </Btn>

          <Btn
            variant="primary"
            className="col-span-2 flex items-center justify-center gap-2 text-sm font-black shadow-md shadow-accent/20"
            onClick={() => void togglePause()}
          >
            {playing ? <Pause size={18} /> : <Play size={18} />}
            <span>{playing ? 'Pausa' : current ? 'Riprendi' : 'Avvia'}</span>
          </Btn>

          <Btn
            disabled={!hasNext}
            onClick={() => void playNext()}
            title="Passa subito al prossimo"
            className="flex flex-col items-center justify-center gap-1 p-2 text-xs font-bold"
          >
            <SkipForward size={16} />
            <span>Salta</span>
          </Btn>
        </div>

        {/* REGOLATORI RAPIDI TONALITA' E VELOCITA' SOTTO IL PLAYER */}
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line/60 pt-3 text-xs">
          <div className="flex items-center justify-between rounded-xl border border-line bg-inset px-2.5 py-1.5">
            <span className="font-semibold text-muted">Tonalità:</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleSetPitch(Math.max(-6, pitch - 1))}
                className="h-5 w-5 rounded bg-btn font-bold hover:bg-btn-hover"
                title="Abbassa di un semitono"
              >
                -
              </button>
              <span className="w-8 text-center font-extrabold text-accent-text">
                {pitch > 0 ? `+${pitch}` : pitch}
              </span>
              <button
                onClick={() => handleSetPitch(Math.min(6, pitch + 1))}
                className="h-5 w-5 rounded bg-btn font-bold hover:bg-btn-hover"
                title="Alza di un semitono"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-line bg-inset px-2.5 py-1.5">
            <span className="font-semibold text-muted">Velocità:</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleSetTempo(Math.max(0.75, Number((tempo - 0.05).toFixed(2))))}
                className="h-5 w-5 rounded bg-btn font-bold hover:bg-btn-hover"
                title="Rallenta 5%"
              >
                -
              </button>
              <span className="w-10 text-center font-extrabold text-emerald-400">
                {Math.round(tempo * 100)}%
              </span>
              <button
                onClick={() => handleSetTempo(Math.min(1.3, Number((tempo + 0.05).toFixed(2))))}
                className="h-5 w-5 rounded bg-btn font-bold hover:bg-btn-hover"
                title="Accelera 5%"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* DISSOLVENZA CROSSFADE VELOCE */}
        <div className="mt-2 flex justify-end">
          <button
            disabled={!hasNext}
            onClick={() => void mixNext()}
            title="Dissolvenza del brano in corso e partenza del successivo"
            className="text-xs font-semibold text-accent-text hover:underline disabled:opacity-40"
          >
            ⚡ Mixa con dissolvenza al prossimo brano
          </button>
        </div>
      </div>

      {/* REGIA TV: INVIO MESSAGGIO RAPIDO A SCHERMO */}
      <div className="rounded-2xl border border-line bg-panel p-3 shadow-xs">
        <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
          📢 Messaggio sullo schermo TV
        </div>
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Scrivi annuncio (es. 'Tavolo 4 al microfono')..."
            className="min-w-0 flex-1 rounded-xl border border-line bg-inset px-3 py-1.5 text-sm outline-none focus:border-accent"
          />
          <select
            value={seconds}
            onChange={(e) => setSeconds(Number(e.target.value))}
            className="rounded-xl border border-line bg-inset px-2 text-xs font-semibold text-text"
          >
            <option value={5}>5 s</option>
            <option value={10}>10 s</option>
            <option value={20}>20 s</option>
            <option value={0}>fisso</option>
          </select>
          <Btn onClick={send} title="Invia messaggio a schermo" className="h-9 px-3 text-xs">
            <Send size={14} />
          </Btn>
          <Btn
            variant="ghost"
            onClick={() => sendDisplayMessage('', 1)}
            title="Togli il messaggio dalla TV"
            className="h-9 px-2 text-xs"
          >
            Cancella
          </Btn>
        </div>
      </div>
    </div>
  )
}
