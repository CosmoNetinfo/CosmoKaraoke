import { Minus, Plus, Type, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { FONT_OPTIONS, THEME_OPTIONS } from '../lib/appearance'
import { useStore } from '../lib/store'
import { Btn } from './ui'

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

/** Menu rapido "Aa": carattere, dimensione del testo e colori, sempre a portata di mano. */
export function AccessibilityMenu() {
  const st = useStore((s) => s.settings)
  const patch = useStore((s) => s.patchSettings)
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const setScale = (v: number) => patch({ uiScale: Math.round(clamp(v, 1, 2) * 100) / 100 })

  return (
    <div ref={box} className="relative">
      <Btn onClick={() => setOpen((o) => !o)} aria-expanded={open} title="Aspetto: carattere, dimensione e colori">
        <Type /> Aa
      </Btn>

      {open && (
        <div
          role="dialog"
          aria-label="Aspetto dell'app"
          className="absolute right-0 top-full z-50 mt-2 w-[min(92vw,26rem)] space-y-4 rounded-xl border-2 border-line bg-panel p-4 shadow-2xl"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Aspetto</h2>
            <Btn variant="ghost" onClick={() => setOpen(false)} title="Chiudi">
              <X />
            </Btn>
          </div>

          <div>
            <div className="mb-1 font-medium">Dimensione del testo</div>
            <div className="flex items-center gap-2">
              <Btn onClick={() => setScale(st.uiScale - 0.1)} title="Più piccolo" disabled={st.uiScale <= 1}>
                <Minus />
              </Btn>
              <div className="flex-1 text-center text-lg font-bold">{Math.round(st.uiScale * 100)}%</div>
              <Btn onClick={() => setScale(st.uiScale + 0.1)} title="Più grande" disabled={st.uiScale >= 2}>
                <Plus />
              </Btn>
            </div>
          </div>

          <div>
            <div className="mb-1 font-medium">Colori</div>
            <div className="grid grid-cols-3 gap-2">
              {THEME_OPTIONS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => patch({ theme: t.id })}
                  aria-pressed={st.theme === t.id}
                  className={`rounded-lg border-2 p-2 text-center text-base font-bold ${
                    st.theme === t.id ? 'border-accent' : 'border-line'
                  }`}
                  style={{ background: t.bg, color: t.fg }}
                >
                  Abc
                  <div className="text-base font-medium">{t.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1 font-medium">Carattere</div>
            <div className="space-y-1.5">
              {FONT_OPTIONS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => patch({ fontFamily: f.id })}
                  aria-pressed={st.fontFamily === f.id}
                  className={`w-full rounded-lg border-2 px-3 py-2 text-left ${
                    st.fontFamily === f.id ? 'border-accent bg-row' : 'border-line'
                  }`}
                >
                  <div className="font-bold">{f.label}</div>
                  <div className="text-base text-muted">{f.hint}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-3">
              <span className="w-36 shrink-0 font-medium">Spazio tra lettere</span>
              <input
                type="range"
                min={0}
                max={0.14}
                step={0.02}
                value={st.letterSpacing}
                onChange={(e) => patch({ letterSpacing: Number(e.target.value) })}
                className="h-8 flex-1"
              />
            </label>
            <label className="flex items-center gap-3">
              <span className="w-36 shrink-0 font-medium">Spazio tra righe</span>
              <input
                type="range"
                min={1.3}
                max={2}
                step={0.1}
                value={st.lineHeight}
                onChange={(e) => patch({ lineHeight: Number(e.target.value) })}
                className="h-8 flex-1"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  )
}
