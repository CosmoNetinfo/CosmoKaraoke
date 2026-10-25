import { Square, Volume2 } from 'lucide-react'
import { bgStop, playNext, stopAllSounds, stopSound } from '../lib/player'
import { useStore } from '../lib/store'
import { Btn } from './ui'

/**
 * Striscia sempre visibile sotto l'intestazione: mostra tutto ciò che sta suonando
 * oltre al brano (effetti, stacchetto, sottofondo) con un pulsante per fermare ciascuno.
 * Quando non suona niente, non si vede.
 */
export function NowPlaying() {
  const fx = useStore((s) => s.activeFx)
  const current = useStore((s) => s.current)
  const bgOn = useStore((s) => s.bgOn)
  const bgTitle = useStore((s) => s.bgTitle)

  const interlude = current?.interlude ? current : null
  const total = fx.length + (interlude ? 1 : 0) + (bgOn ? 1 : 0)
  if (total === 0) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-wrap items-center gap-2 border-b-2 border-line bg-accent/20 px-4 py-2 text-base"
    >
      <span className="flex items-center gap-2 font-bold">
        <Volume2 /> Sta suonando:
      </span>

      {interlude && (
        <span className="flex items-center gap-2 rounded-lg bg-panel px-2 py-1">
          <span className="max-w-[18rem] truncate">{interlude.song.title}</span>
          <Btn variant="danger" onClick={() => void playNext()}>
            <Square /> Salta stacchetto
          </Btn>
        </span>
      )}

      {fx.map((x) => (
        <span key={x.id} className="flex items-center gap-2 rounded-lg bg-panel px-2 py-1">
          <span className="max-w-[16rem] truncate">{x.name}</span>
          <Btn variant="danger" onClick={() => stopSound(x.id)}>
            <Square /> Ferma
          </Btn>
        </span>
      ))}

      {bgOn && (
        <span className="flex items-center gap-2 rounded-lg bg-panel px-2 py-1">
          <span className="max-w-[18rem] truncate">
            Sottofondo{bgTitle ? `: ${bgTitle}` : ''}
            {current && !interlude ? ' (in pausa mentre canti)' : ''}
          </span>
          <Btn variant="danger" onClick={bgStop}>
            <Square /> Ferma
          </Btn>
        </span>
      )}

      {fx.length + (interlude ? 1 : 0) > 1 && (
        <Btn variant="danger" className="ml-auto" onClick={stopAllSounds}>
          <Square /> Ferma tutti gli effetti
        </Btn>
      )}
    </div>
  )
}
