import { Mic, MicOff, RotateCcw } from 'lucide-react'
import { engine, EQ_FREQS } from '../lib/engine'
import { applyMicFx, applySettingsToEngine, setPitch, setTempo } from '../lib/player'
import { DEFAULT_SETTINGS, useStore } from '../lib/store'
import type { Settings } from '../types'
import { useState } from 'react'
import { Btn, Panel, Slider, SubTabs, rangeProgressStyle } from './ui'

/** Combinazioni pronte per la voce: ognuna imposta tutti i controlli qui sotto. */
const MIC_PRESETS: { name: string; fx: Partial<Settings> }[] = [
  {
    name: 'Pulita',
    fx: {
      reverb: 0.1,
      reverbSize: 0.3,
      echo: 0,
      chorus: 0,
      micBass: 0,
      micTreble: 0,
      micComp: 0.3,
    },
  },
  {
    name: 'Sala concerti',
    fx: {
      reverb: 0.3,
      reverbSize: 0.5,
      echo: 0.1,
      echoTime: 0.25,
      echoFb: 0.2,
      chorus: 0,
      micBass: 2,
      micTreble: 2,
      micComp: 0.4,
    },
  },
  {
    name: 'Teatro',
    fx: {
      reverb: 0.5,
      reverbSize: 0.8,
      echo: 0.15,
      echoTime: 0.35,
      echoFb: 0.3,
      chorus: 0.1,
      micBass: 1,
      micTreble: 3,
      micComp: 0.4,
    },
  },
  {
    name: 'Voce doppia',
    fx: {
      reverb: 0.2,
      reverbSize: 0.4,
      echo: 0.1,
      chorus: 0.6,
      micBass: 0,
      micTreble: 2,
      micComp: 0.4,
    },
  },
  {
    name: 'Eco da stadio',
    fx: {
      reverb: 0.35,
      reverbSize: 0.9,
      echo: 0.5,
      echoTime: 0.45,
      echoFb: 0.5,
      chorus: 0,
      micBass: 0,
      micTreble: 2,
      micComp: 0.5,
    },
  },
]

function freqLabel(f: number): string {
  return f >= 1000 ? `${f / 1000}k` : `${f}`
}

type Section = 'brano' | 'eq' | 'voce' | 'effetti'
const SECTIONS: { id: Section; label: string }[] = [
  { id: 'brano', label: 'Brano' },
  { id: 'eq', label: 'Equalizzatore' },
  { id: 'voce', label: 'Microfono' },
  { id: 'effetti', label: 'Effetti voce' },
]

const EQ_PRESETS = [
  { name: 'Neutro', values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { name: 'Voce chiara', values: [-2, -1, 0, 1, 3, 3, 2, 1, 0, -1] },
  { name: 'Caldo', values: [3, 2, 1, 0, -1, -1, 0, 1, 2, 2] },
  { name: 'Bassi', values: [4, 3, 2, 1, 0, 0, 0, 0, 0, 0] },
  { name: 'Brillante', values: [-1, 0, 0, 0, 0, 1, 2, 3, 3, 2] },
]

export function Mixer() {
  const [section, setSection] = useState<Section>('brano')
  const st = useStore((s) => s.settings)
  const patch = useStore((s) => s.patchSettings)
  const current = useStore((s) => s.current)
  const isKar = current?.song.format === 'kar'
  const notify = useStore((s) => s.notify)

  const setFx = (fx: Partial<Settings>) => {
    patch(fx)
    applyMicFx({ ...useStore.getState().settings, ...fx })
  }

  const toggleMic = async () => {
    const next = !st.micOn
    try {
      await engine.setMic(next)
      patch({ micOn: next, ...(next ? { micInApp: true } : {}) })
    } catch {
      notify('Non riesco ad accendere il microfono: controlla i permessi del sistema.')
      patch({ micOn: false })
    }
  }

  const reset = () => {
    patch({
      eq: DEFAULT_SETTINGS.eq,
      pitch: 0,
      tempo: 1,
      vocalOff: false,
    })
    applySettingsToEngine()
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <SubTabs
        tabs={SECTIONS}
        value={section}
        onChange={setSection}
      />
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-2">
        {section === 'brano' && (
          <Panel
            title="Brano"
            right={
              <Btn
                variant="ghost"
                onClick={reset}
                title="Riporta tonalità, velocità ed equalizzatore a zero"
              >
                <RotateCcw /> Azzera
              </Btn>
            }
          >
            <div className="space-y-3">
              <Slider
                label="Volume"
                min={0}
                max={1}
                step={0.01}
                value={st.volume}
                display={`${Math.round(st.volume * 100)}%`}
                onChange={(v) => {
                  patch({ volume: v })
                  engine.setVolume(v)
                }}
              />
              <Slider
                label="Tonalità"
                min={-12}
                max={12}
                step={1}
                value={st.pitch}
                display={`${st.pitch > 0 ? '+' : ''}${st.pitch}`}
                onChange={(v) => {
                  patch({ pitch: v })
                  setPitch(v)
                }}
              />
              <Slider
                label="Velocità"
                min={0.5}
                max={1.5}
                step={0.01}
                value={st.tempo}
                display={`${Math.round(st.tempo * 100)}%`}
                onChange={(v) => {
                  patch({ tempo: v })
                  setTempo(v)
                }}
              />
              <div className="flex flex-wrap items-center gap-2 text-base">
                <span className="w-32 shrink-0 text-text">Uscita audio</span>
                {([false, true] as const).map((mono) => (
                  <Btn
                    key={String(mono)}
                    variant={st.outputMono === mono ? 'primary' : 'default'}
                    aria-pressed={st.outputMono === mono}
                    onClick={() => {
                      patch({ outputMono: mono })
                      engine.setOutputMono(mono)
                    }}
                  >
                    {mono ? 'Mono' : 'Stereo'}
                  </Btn>
                ))}
                <span className="text-muted">— Mono se l'impianto ha un solo altoparlante</span>
              </div>
              <label className={`flex items-center gap-2 text-base ${isKar ? 'cursor-not-allowed opacity-50' : ''}`}>
                <input
                  type="checkbox"
                  checked={st.vocalOff}
                  disabled={isKar}
                  onChange={(e) => {
                    patch({ vocalOff: e.target.checked })
                    engine.setVocalRemoval(e.target.checked)
                  }}
                />
                Togli la voce (devocalizzatore)
                <span className="text-base text-muted">
                  {isKar
                    ? '— non disponibile per i file MIDI/KAR (senza traccia vocale registrata)'
                    : '— funziona meglio sui brani in stereo con la voce al centro'}
                </span>
              </label>
              <Slider
                label="Dissolvenza «Mix»"
                min={1}
                max={10}
                step={1}
                value={st.fadeSec}
                display={`${st.fadeSec} s`}
                onChange={(v) => patch({ fadeSec: v })}
              />
            </div>
          </Panel>
        )}

        {section === 'eq' && (
          <Panel title="Equalizzatore a 10 bande" right={
            <label className="flex items-center gap-2 text-sm font-semibold text-muted">Preset
              <select value={EQ_PRESETS.find((preset) => preset.values.every((v, i) => v === st.eq[i]))?.name ?? 'Personalizzato'} onChange={(e) => {
                const preset = EQ_PRESETS.find((p) => p.name === e.target.value)
                if (!preset) return
                patch({ eq: preset.values })
                preset.values.forEach((value, index) => engine.setEq(index, value))
              }} className="rounded-lg border border-line bg-inset px-2 py-1.5 text-text">
                {!EQ_PRESETS.some((preset) => preset.values.every((v, i) => v === st.eq[i])) && <option>Personalizzato</option>}
                {EQ_PRESETS.map((preset) => <option key={preset.name}>{preset.name}</option>)}
              </select>
            </label>
          }>
            <div className="flex items-end justify-between gap-1">
              {EQ_FREQS.map((f, i) => (
                <div key={f} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-base tabular-nums text-muted">
                    {st.eq[i] > 0 ? '+' : ''}
                    {st.eq[i]}
                  </span>
                  <input
                    type="range"
                    min={-12}
                    max={12}
                    step={1}
                    value={st.eq[i]}
                    style={{ ...rangeProgressStyle(st.eq[i], -12, 12), writingMode: 'vertical-lr', direction: 'rtl' }}
                    onChange={(e) => {
                      const db = Number(e.target.value)
                      const eq = st.eq.map((v, k) => (k === i ? db : v))
                      patch({ eq })
                      engine.setEq(i, db)
                    }}
                    className="range-control range-vertical h-24 w-4"
                  />
                  <span className="text-base text-muted">{freqLabel(f)}</span>
                </div>
              ))}
            </div>
          </Panel>
        )}

        {section === 'voce' && (
          <Panel
            title="Microfono"
            right={
              <Btn variant={st.micOn ? 'danger' : 'default'} onClick={() => void toggleMic()}>
                {st.micOn ? <Mic /> : <MicOff />}
                {st.micOn ? 'Acceso' : 'Spento'}
              </Btn>
            }
          >
            <div className="space-y-3">
              <Slider
                label="Volume voce"
                min={0}
                max={2}
                step={0.05}
                value={st.micVol}
                display={`${Math.round(st.micVol * 100)}%`}
                onChange={(v) => {
                  patch({ micVol: v })
                  engine.setMicVolume(v)
                }}
              />
              <p className="text-base text-muted">
                Per evitare il fischio, usa le cuffie oppure tieni il microfono lontano dalle casse.
              </p>
            </div>
          </Panel>
        )}

        {section === 'effetti' && (
          <Panel
            title="Effetti della voce"
            right={
              <Btn variant={st.micOn ? 'danger' : 'default'} onClick={() => void toggleMic()}>
                {st.micOn ? <Mic /> : <MicOff />}
                {st.micOn ? 'Acceso' : 'Spento'}
              </Btn>
            }
          >
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-base">
                <span className="w-32 shrink-0 text-text">Effetto pronto</span>
                {MIC_PRESETS.map((p) => (
                  <Btn key={p.name} onClick={() => setFx(p.fx)}>
                    {p.name}
                  </Btn>
                ))}
              </div>

              <h3 className="pt-1 text-base font-bold text-text">Riverbero</h3>
              <Slider
                label="Quantità"
                min={0}
                max={1}
                step={0.05}
                value={st.reverb}
                display={`${Math.round(st.reverb * 100)}%`}
                onChange={(v) => setFx({ reverb: v })}
              />
              <Slider
                label="Grandezza sala"
                min={0}
                max={1}
                step={0.05}
                value={st.reverbSize}
                display={st.reverbSize < 0.34 ? 'Stanza' : st.reverbSize < 0.67 ? 'Sala' : 'Chiesa'}
                onChange={(v) => setFx({ reverbSize: v })}
              />

              <h3 className="pt-1 text-base font-bold text-text">Eco</h3>
              <Slider
                label="Quantità"
                min={0}
                max={0.8}
                step={0.05}
                value={st.echo}
                display={`${Math.round(st.echo * 100)}%`}
                onChange={(v) => setFx({ echo: v })}
              />
              <Slider
                label="Distanza"
                min={0.1}
                max={0.8}
                step={0.02}
                value={st.echoTime}
                display={`${Math.round(st.echoTime * 1000)} ms`}
                onChange={(v) => setFx({ echoTime: v })}
              />
              <Slider
                label="Ripetizioni"
                min={0}
                max={0.7}
                step={0.05}
                value={st.echoFb}
                display={`${Math.round((st.echoFb / 0.7) * 100)}%`}
                onChange={(v) => setFx({ echoFb: v })}
              />

              <h3 className="pt-1 text-base font-bold text-text">Voce</h3>
              <Slider
                label="Voce doppia (coro)"
                min={0}
                max={1}
                step={0.05}
                value={st.chorus}
                display={`${Math.round(st.chorus * 100)}%`}
                onChange={(v) => setFx({ chorus: v })}
              />
              <Slider
                label="Bassi"
                min={-12}
                max={12}
                step={1}
                value={st.micBass}
                display={`${st.micBass > 0 ? '+' : ''}${st.micBass} dB`}
                onChange={(v) => setFx({ micBass: v })}
              />
              <Slider
                label="Acuti"
                min={-12}
                max={12}
                step={1}
                value={st.micTreble}
                display={`${st.micTreble > 0 ? '+' : ''}${st.micTreble} dB`}
                onChange={(v) => setFx({ micTreble: v })}
              />
              <Slider
                label="Livellatore voce"
                min={0}
                max={1}
                step={0.05}
                value={st.micComp}
                display={st.micComp === 0 ? 'Spento' : `${Math.round(st.micComp * 100)}%`}
                onChange={(v) => setFx({ micComp: v })}
              />
            </div>
          </Panel>
        )}
      </div>
    </div>
  )
}
