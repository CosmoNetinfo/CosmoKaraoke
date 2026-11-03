import { Minus, Plus, SlidersHorizontal, Type, X } from 'lucide-react'
import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'
import { FONT_OPTIONS, THEME_OPTIONS } from '../lib/appearance'
import { useStore } from '../lib/store'
import { Btn, rangeProgressStyle } from './ui'

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
const SCALE_MIN = 0.75
const SCALE_MAX = 2
const ACCENT_OPTIONS = [
  { name: 'Viola cosmo', value: '#a76df2' },
  { name: 'Blu studio', value: '#4e83ff' },
  { name: 'Turchese', value: '#16b8a6' },
  { name: 'Corallo', value: '#e76573' },
  { name: 'Ambra', value: '#e4ad4d' },
  { name: 'Verde lime', value: '#83c95d' },
]

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

  const setScale = (v: number) => patch({ uiScale: Math.round(clamp(v, SCALE_MIN, SCALE_MAX) * 100) / 100 })

  return (
    <div ref={box} className="relative">
      <Btn onClick={() => setOpen((o) => !o)} aria-expanded={open} title="Aspetto: Standard o Professionale, colore e dimensione">
        <Type /> Aa
      </Btn>

      {open && (
        <div
          role="dialog"
          aria-label="Aspetto dell'app"
          className="absolute right-0 top-full z-50 mt-2 max-h-[calc(100vh-5rem)] w-[min(92vw,30rem)] space-y-4 overflow-y-auto rounded-2xl border border-line bg-panel p-4 shadow-2xl"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Aspetto</h2>
            <Btn variant="ghost" onClick={() => setOpen(false)} title="Chiudi">
              <X />
            </Btn>
          </div>

          <div>
            <div className="mb-2 font-medium">Stile dell'interfaccia</div>
            <div className="design-mode-picker grid grid-cols-2 gap-2">
              <button
                onClick={() => patch({ designMode: 'standard', skinId: 'custom' })}
                aria-pressed={st.designMode === 'standard'}
                className={`design-mode-card ${st.designMode === 'standard' ? 'is-selected' : ''}`}
              >
                <span className="design-mode-icon"><Type /></span>
                <span><b>Standard</b><small>Colori e temi regolabili</small></span>
              </button>
              <button
                onClick={() => patch({ designMode: 'professional', skinId: 'custom' })}
                aria-pressed={st.designMode === 'professional'}
                className={`design-mode-card ${st.designMode === 'professional' ? 'is-selected' : ''}`}
              >
                <span className="design-mode-icon"><SlidersHorizontal /></span>
                <span><b>Professionale</b><small>Regia broadcast</small></span>
              </button>
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between gap-3">
              <div>
                <div className="font-medium">Dimensione dell'interfaccia</div>
                <div className="text-sm text-muted">Regolabile dal 75% al 200%</div>
              </div>
              <div className="text-lg font-bold tabular-nums">{Math.round(st.uiScale * 100)}%</div>
            </div>
            <div className="flex items-center gap-2">
              <Btn onClick={() => setScale(st.uiScale - 0.1)} title="Riduci l'interfaccia" disabled={st.uiScale <= SCALE_MIN}>
                <Minus />
              </Btn>
              <input
                type="range"
                min={SCALE_MIN}
                max={SCALE_MAX}
                step={0.05}
                value={st.uiScale}
                style={rangeProgressStyle(st.uiScale, SCALE_MIN, SCALE_MAX)}
                aria-label="Dimensione dell'interfaccia"
                onChange={(e) => setScale(Number(e.target.value))}
                className="range-control h-8 flex-1"
              />
              <Btn onClick={() => setScale(st.uiScale + 0.1)} title="Ingrandisci l'interfaccia" disabled={st.uiScale >= SCALE_MAX}>
                <Plus />
              </Btn>
            </div>
          </div>

          {st.designMode === 'standard' && <div>
            <div className="mb-1 font-medium">Colore principale</div>
            <div className="accent-picker flex flex-wrap items-center gap-2">
              {ACCENT_OPTIONS.map((accent) => (
                <button
                  key={accent.value}
                  onClick={() => patch({ accentColor: accent.value, skinId: 'custom' })}
                  aria-label={accent.name}
                  aria-pressed={st.accentColor === accent.value}
                  title={accent.name}
                  className={`accent-swatch ${st.accentColor === accent.value ? 'is-selected' : ''}`}
                  style={{ '--swatch-color': accent.value } as CSSProperties}
                />
              ))}
              <label className="accent-custom-color" title="Scegli un colore personalizzato">
                <input
                  type="color"
                  value={st.accentColor}
                  aria-label="Scegli un colore personalizzato"
                  onChange={(e) => patch({ accentColor: e.target.value, skinId: 'custom' })}
                />
                <span>Altro</span>
              </label>
            </div>
          </div>}

          {st.designMode === 'standard' && <div>
            <div className="mb-1 font-medium">Tema</div>
            <div className="grid grid-cols-3 gap-2">
              {THEME_OPTIONS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => patch({ theme: t.id, skinId: 'custom' })}
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
          </div>}

          {st.designMode === 'standard' && <div>
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
          </div>}

          {st.designMode === 'standard' && <div className="space-y-2">
            <label className="flex items-center gap-3">
              <span className="w-36 shrink-0 font-medium">Spazio tra lettere</span>
              <input
                type="range"
                min={0}
                max={0.14}
                step={0.02}
                value={st.letterSpacing}
                style={rangeProgressStyle(st.letterSpacing, 0, 0.14)}
                onChange={(e) => patch({ letterSpacing: Number(e.target.value) })}
                className="range-control h-8 flex-1"
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
                style={rangeProgressStyle(st.lineHeight, 1.3, 2)}
                onChange={(e) => patch({ lineHeight: Number(e.target.value) })}
                className="range-control h-8 flex-1"
              />
            </label>
          </div>}
        </div>
      )}
    </div>
  )
}
