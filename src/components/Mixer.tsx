import { open } from '@tauri-apps/plugin-dialog'
import { Mic, MicOff, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { engine, EQ_FREQS } from '../lib/engine'
import { applySettingsToEngine, playJingle } from '../lib/player'
import { DEFAULT_SETTINGS, useStore } from '../lib/store'
import { Btn, Panel, Slider } from './ui'

function freqLabel(f: number): string {
  return f >= 1000 ? `${f / 1000}k` : `${f}`
}

export function Mixer() {
  const st = useStore((s) => s.settings)
  const patch = useStore((s) => s.patchSettings)
  const jingles = useStore((s) => s.jingles)
  const notify = useStore((s) => s.notify)

  const toggleMic = async () => {
    const next = !st.micOn
    try {
      await engine.setMic(next)
      patch({ micOn: next })
    } catch {
      notify('Non riesco ad accendere il microfono: controlla i permessi del sistema.')
      patch({ micOn: false })
    }
  }

  const addJingles = async () => {
    const files = await open({
      multiple: true,
      filters: [{ name: 'Audio', extensions: ['mp3', 'wav', 'ogg', 'm4a', 'flac'] }],
    })
    if (!files) return
    const list = (Array.isArray(files) ? files : [files]).map((p) => ({
      id: crypto.randomUUID(),
      path: p,
      name: (p.split(/[\\/]/).pop() ?? p).replace(/\.[^.]+$/, ''),
    }))
    useStore.setState((s) => ({ jingles: [...s.jingles, ...list] }))
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
    <div className="space-y-3 overflow-y-auto pr-1">
      <Panel
        title="Brano"
        right={
          <Btn variant="ghost" onClick={reset} title="Riporta tonalità, velocità ed equalizzatore a zero">
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
              engine.setPitch(v)
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
              engine.setTempo(v)
            }}
          />
          <label className="flex items-center gap-2 text-base">
            <input
              type="checkbox"
              checked={st.vocalOff}
              onChange={(e) => {
                patch({ vocalOff: e.target.checked })
                engine.setVocalRemoval(e.target.checked)
              }}
            />
            Togli la voce (devocalizzatore)
            <span className="text-base text-muted">
              — funziona meglio sui brani in stereo con la voce al centro
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

      <Panel title="Equalizzatore">
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
                onChange={(e) => {
                  const db = Number(e.target.value)
                  const eq = st.eq.map((v, k) => (k === i ? db : v))
                  patch({ eq })
                  engine.setEq(i, db)
                }}
                className="h-24 w-4"
                style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
              />
              <span className="text-base text-muted">{freqLabel(f)}</span>
            </div>
          ))}
        </div>
      </Panel>

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
          <Slider
            label="Eco"
            min={0}
            max={0.8}
            step={0.05}
            value={st.echo}
            display={`${Math.round(st.echo * 100)}%`}
            onChange={(v) => {
              patch({ echo: v })
              engine.setEcho(v)
            }}
          />
          <p className="text-base text-muted">
            Per evitare il fischio, usa le cuffie oppure tieni il microfono lontano dalle casse.
          </p>
        </div>
      </Panel>

      <Panel
        title="Jingle e applausi"
        right={
          <Btn onClick={() => void addJingles()}>
            <Plus /> Aggiungi
          </Btn>
        }
      >
        {jingles.length === 0 ? (
          <p className="text-base text-muted">Aggiungi dei suoni: li lanci con un clic o con i tasti 1–9.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {jingles.map((j, i) => (
              <div key={j.id} className="flex gap-1">
                <Btn className="min-w-0 flex-1 justify-start" onClick={() => playJingle(j.path)}>
                  <span className="rounded bg-inset px-1.5 text-base text-muted">{i < 9 ? i + 1 : '·'}</span>
                  <span className="truncate">{j.name}</span>
                </Btn>
                <Btn
                  variant="ghost"
                  title="Rimuovi"
                  onClick={() =>
                    useStore.setState((s) => ({ jingles: s.jingles.filter((x) => x.id !== j.id) }))
                  }
                >
                  <Trash2 />
                </Btn>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}
