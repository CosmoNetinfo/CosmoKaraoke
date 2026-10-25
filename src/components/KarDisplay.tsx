import { Music } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { KarLine } from '../lib/kar'

interface Props {
  lines: KarLine[]
  getPosition: () => number
  textScale?: number
  className?: string
}

export function KarDisplay({ lines, getPosition, textScale = 1.0, className = '' }: Props) {
  const [, tick] = useState(0)
  const posRef = useRef(getPosition)
  posRef.current = getPosition

  useEffect(() => {
    let alive = true
    let raf = 0
    const loop = () => {
      if (!alive) return
      tick((n) => (n + 1) % 1000000)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      alive = false
      cancelAnimationFrame(raf)
    }
  }, [])

  const pos = posRef.current()

  if (lines.length === 0) {
    return (
      <div
        className={`flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center ${className}`}
      >
        <Music
          className="text-muted"
          style={{ width: `${3.5 * textScale}rem`, height: `${3.5 * textScale}rem` }}
        />
        <div
          className="font-bold text-text"
          style={{ fontSize: `${1.4 * textScale}rem`, lineHeight: 1.3 }}
        >
          Brano musicale MIDI
        </div>
        <div
          className="text-muted"
          style={{ fontSize: `${1.1 * textScale}rem` }}
        >
          Traccia strumentale senza testo sincronizzato
        </div>
      </div>
    )
  }

  // Trova l'indice della riga attiva
  let activeIndex = -1
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]
    if (pos >= l.startTime - 0.2 && pos <= l.endTime + 0.3) {
      activeIndex = i
      break
    }
    if (pos < l.startTime) {
      // Non siamo ancora alla riga, ma possiamo mostrarla come prossima
      if (activeIndex === -1) activeIndex = Math.max(0, i - 1)
      break
    }
  }

  if (activeIndex === -1) {
    activeIndex = lines.length - 1
  }

  const prevLine = activeIndex > 0 ? lines[activeIndex - 1] : null
  const curLine = lines[activeIndex]
  const nextLine = activeIndex + 1 < lines.length ? lines[activeIndex + 1] : null

  // Se siamo prima dell'inizio della prima riga
  const firstStart = lines[0].startTime
  const isIntro = pos < firstStart

  return (
    <div
      className={`relative flex h-full w-full flex-col items-center justify-center overflow-hidden p-6 text-center select-none ${className}`}
    >
      {isIntro && (
        <div className="mb-4 flex flex-col items-center gap-2">
          <div
            className="font-bold text-accent-text animate-pulse"
            style={{ fontSize: `${1.5 * textScale}rem` }}
          >
            Preparati a cantare…
          </div>
          <div
            className="font-bold tabular-nums text-text"
            style={{ fontSize: `${2.2 * textScale}rem` }}
          >
            {Math.max(0, Math.ceil(firstStart - pos))}
          </div>
        </div>
      )}

      {/* Riga precedente */}
      {prevLine && !isIntro && (
        <div
          className="mb-2 max-w-4xl text-muted opacity-50 transition-opacity"
          style={{
            fontSize: `${1.1 * textScale}rem`,
            lineHeight: 1.4,
          }}
        >
          {prevLine.text}
        </div>
      )}

      {/* Riga corrente con evidenziazione sillaba per sillaba */}
      <div
        className="my-3 max-w-5xl font-bold transition-all"
        style={{
          fontSize: `${1.8 * textScale}rem`,
          lineHeight: 1.35,
        }}
      >
        {curLine.syllables.map((syl, sIdx) => {
          const isSung = pos >= syl.time + syl.duration
          const isCurrent = pos >= syl.time && pos < syl.time + syl.duration

          return (
            <span
              key={sIdx}
              className={`transition-colors duration-75 ${
                isCurrent
                  ? 'bg-accent text-on-accent rounded px-1'
                  : isSung
                    ? 'text-accent-text'
                    : 'text-text'
              }`}
            >
              {syl.text}
            </span>
          )
        })}
      </div>

      {/* Riga successiva */}
      {nextLine && (
        <div
          className="mt-3 max-w-4xl font-medium text-muted opacity-80"
          style={{
            fontSize: `${1.25 * textScale}rem`,
            lineHeight: 1.4,
          }}
        >
          {nextLine.text}
        </div>
      )}
    </div>
  )
}
