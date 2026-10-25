import { useEffect, useRef } from 'react'
import { CDG_H, CDG_W, CdgDecoder } from '../lib/cdg'

interface Props {
  url: string | null
  /** Restituisce l'istante corrente del brano, in secondi. */
  getPosition: () => number
  className?: string
}

/** Disegna la grafica di un file CD+G sincronizzata con il tempo del brano. */
export function CdgCanvas({ url, getPosition, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const posRef = useRef(getPosition)
  posRef.current = getPosition

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const decoder = new CdgDecoder()
    let alive = true
    let raf = 0

    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, CDG_W, CDG_H)

    if (url) {
      fetch(url)
        .then((r) => r.arrayBuffer())
        .then((buf) => {
          if (alive) decoder.load(buf)
        })
        .catch(() => {
          /* file grafico non leggibile: resta lo schermo nero */
        })
    }

    const loop = () => {
      if (decoder.loaded) {
        decoder.seek(posRef.current())
        decoder.render(ctx)
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      alive = false
      cancelAnimationFrame(raf)
    }
  }, [url])

  return <canvas ref={canvasRef} width={CDG_W} height={CDG_H} className={className} />
}
