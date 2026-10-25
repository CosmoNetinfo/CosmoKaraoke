import { emit, listen } from '@tauri-apps/api/event'
import { useCallback, useEffect, useRef, useState } from 'react'
import { CdgCanvas } from './components/CdgCanvas'
import { KarDisplay } from './components/KarDisplay'
import type { KarLine } from './lib/kar'
import type { DisplayMessage, DisplayState } from './types'

/** Finestra a schermo intero per la TV / il secondo monitor: mostra solo testi e messaggi. */
export function Display() {
  const [st, setSt] = useState<DisplayState | null>(null)
  const [message, setMessage] = useState('')
  const [karLines, setKarLines] = useState<KarLine[]>([])
  const [, tick] = useState(0)
  const base = useRef({ pos: 0, at: performance.now(), playing: false, tempo: 1 })
  const videoRef = useRef<HTMLVideoElement>(null)
  const msgTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const getPos = useCallback(() => {
    const b = base.current
    return b.playing ? b.pos + ((performance.now() - b.at) / 1000) * b.tempo : b.pos
  }, [])

  useEffect(() => {
    document.body.style.margin = '0'
    document.body.style.overflow = 'hidden'
    let alive = true
    const unlisten: Array<() => void> = []

    const setup = async () => {
      const u1 = await listen<DisplayState>('display:state', (e) => {
        const p = e.payload
        base.current = {
          pos: p.position,
          at: performance.now(),
          playing: p.playing,
          tempo: p.tempo,
        }
        if (p.kind !== 'kar') setKarLines([])
        setSt(p)
      })
      const u2 = await listen<DisplayMessage>('display:message', (e) => {
        setMessage(e.payload.text)
        clearTimeout(msgTimer.current)
        if (e.payload.seconds > 0) {
          msgTimer.current = setTimeout(() => setMessage(''), e.payload.seconds * 1000)
        }
      })
      const u3 = await listen<KarLine[]>('display:kar', (e) => {
        setKarLines(e.payload ?? [])
      })
      if (!alive) {
        u1()
        u2()
        u3()
        return
      }
      unlisten.push(u1, u2, u3)
      await emit('display:ready')
    }
    void setup()

    const timer = setInterval(() => tick((n) => n + 1), 500)
    const onUnload = () => void emit('display:closed')
    window.addEventListener('beforeunload', onUnload)

    return () => {
      alive = false
      unlisten.forEach((u) => u())
      clearInterval(timer)
      window.removeEventListener('beforeunload', onUnload)
    }
  }, [])

  // sincronizza il video con il brano in corso
  useEffect(() => {
    const v = videoRef.current
    if (!v || !st || st.kind !== 'video') return
    v.muted = true
    v.playbackRate = st.tempo
    if (Math.abs(v.currentTime - getPos()) > 0.25) v.currentTime = getPos()
    if (st.playing && v.paused) void v.play().catch(() => {})
    if (!st.playing && !v.paused) v.pause()
  }, [st, getPos])

  const pos = getPos()
  const k = st?.textScale ?? 1.3
  const kind = st?.kind ?? 'idle'
  const remaining = st && st.duration > 0 ? st.duration - pos : Infinity
  const showSinger = !!st?.singer && kind !== 'idle' && pos < 12
  const isNoLyricsKar = kind === 'kar' && karLines.length === 0
  const showNext = !!st?.next && (kind === 'idle' || kind === 'audio' || isNoLyricsKar || remaining < 25)

  if (st?.black) return <div style={{ position: 'fixed', inset: 0, background: '#000' }} />

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background:
          st?.bgImage && (kind === 'idle' || kind === 'audio' || isNoLyricsKar)
            ? `center / cover no-repeat url("${st.bgImage}"), ${st?.bg ?? '#0b1020'}`
            : (st?.bg ?? '#0b1020'),
        color: '#fff',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {kind === 'cdg' && (
        <CdgCanvas
          url={st?.cdgUrl ?? null}
          getPosition={getPos}
          className={`h-full w-full ${st?.stretch ? 'object-fill' : 'object-contain'}`}
        />
      )}
      {kind === 'video' && st?.mediaUrl && (
        <video
          ref={videoRef}
          src={st.mediaUrl}
          crossOrigin="anonymous"
          muted
          style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
        />
      )}
      {kind === 'kar' && karLines.length > 0 && (
        <KarDisplay
          lines={karLines}
          getPosition={getPos}
          textScale={k}
          className="h-full w-full"
        />
      )}
      {(kind === 'idle' || kind === 'audio' || isNoLyricsKar) && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '4vw',
            gap: '1.5vw',
            textShadow: '0 0.3vw 1.2vw #000, 0 0 0.4vw #000',
          }}
        >
          <div style={{ fontSize: `${5 * k}vw`, fontWeight: 700, lineHeight: 1.2 }}>
            {kind === 'idle' ? 'CosmoKaraoke' : st?.title}
          </div>
          {(kind === 'audio' || kind === 'kar') && st?.artist && (
            <div style={{ fontSize: `${3 * k}vw`, opacity: 0.95 }}>{st.artist}</div>
          )}
          {kind === 'idle' && (
            <div style={{ fontSize: `${2.2 * k}vw`, opacity: 0.85 }}>Scegli un brano e canta!</div>
          )}
        </div>
      )}

      {showSinger && (
        <div
          style={{
            position: 'absolute',
            top: '2.5vh',
            left: '2.5vw',
            padding: '1vh 2vw',
            borderRadius: 999,
            background: 'rgba(0,0,0,0.85)',
            border: '0.4vh solid #fff',
            fontSize: `${3.4 * k}vh`,
            fontWeight: 700,
          }}
        >
          Canta: {st?.singer}
        </div>
      )}

      {showNext && (
        <div
          style={{
            position: 'absolute',
            bottom: message ? `${9 + 8 * k}vh` : '2.5vh',
            right: '2.5vw',
            padding: '1vh 2vw',
            borderRadius: 999,
            background: 'rgba(0,0,0,0.85)',
            border: '0.4vh solid #fff',
            fontSize: `${3 * k}vh`,
            fontWeight: 700,
          }}
        >
          Prossimo: {st?.next}
        </div>
      )}

      {message && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            padding: '2vh 3vw',
            background: 'rgba(250, 204, 21, 0.95)',
            color: '#111',
            fontSize: `${5 * k}vh`,
            fontWeight: 800,
            lineHeight: 1.15,
            textAlign: 'center',
          }}
        >
          {message}
        </div>
      )}
    </div>
  )
}
