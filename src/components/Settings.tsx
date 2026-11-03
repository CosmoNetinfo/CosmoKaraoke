import { invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'
import { Check, FolderPlus, ImagePlus, RefreshCw, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { engine } from '../lib/engine'
import { previewSupported, pushDisplay } from '../lib/player'
import { useStore } from '../lib/store'
import { SKINS } from '../lib/appearance'
import type { MonitorInfo } from '../types'
import { Guida } from './Guida'
import { Btn, Panel, Slider, SubTabs } from './ui'
import { UpdatesPanel, YtdlpPanel } from './UpdatesPanel'

type Section = 'cartelle' | 'schermo' | 'audio' | 'cuffie' | 'youtube' | 'aspetto' | 'aggiornamenti' | 'guida'
const SECTIONS: { id: Section; label: string }[] = [
  { id: 'cartelle', label: 'Cartelle' },
  { id: 'schermo', label: 'Schermo TV' },
  { id: 'audio', label: 'Audio' },
  { id: 'cuffie', label: 'Cuffie' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'aspetto', label: 'Aspetto' },
  { id: 'aggiornamenti', label: 'Aggiornamenti' },
  { id: 'guida', label: 'Guida' },
]

export function Settings() {
  const [section, setSection] = useState<Section>('cartelle')
  const libraryPaths = useStore((s) => s.libraryPaths)
  const scanning = useStore((s) => s.scanning)
  const scanProgress = useStore((s) => s.scanProgress)
  const scanSummary = useStore((s) => s.scanSummary)
  const scanIssue = useStore((s) => s.scanIssue)
  const st = useStore((s) => s.settings)
  const patch = useStore((s) => s.patchSettings)
  const addLibraryPath = useStore((s) => s.addLibraryPath)
  const removeLibraryPath = useStore((s) => s.removeLibraryPath)
  const rescan = useStore((s) => s.rescan)
  const [monitors, setMonitors] = useState<MonitorInfo[]>([])
  const [outputs, setOutputs] = useState<MediaDeviceInfo[]>([])

  useEffect(() => {
    invoke<MonitorInfo[]>('list_monitors')
      .then(setMonitors)
      .catch(() => setMonitors([]))
    navigator.mediaDevices
      .enumerateDevices()
      .then((d) => setOutputs(d.filter((x) => x.kind === 'audiooutput')))
      .catch(() => setOutputs([]))
  }, [])

  const pickFolder = async () => {
    const dir = await open({ directory: true, multiple: false })
    if (typeof dir === 'string') await addLibraryPath(dir)
  }

  const pickDownloadDir = async () => {
    const dir = await open({ directory: true, multiple: false })
    if (typeof dir === 'string') patch({ downloadDir: dir })
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <SubTabs tabs={SECTIONS} value={section} onChange={setSection} />
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-2">
        {section === 'guida' && <Guida />}
        {section === 'aspetto' && (
          <Panel title="Skin e layout">
            <p className="mb-4 text-base text-muted">Ogni preset cambia la palette e mantiene i controlli leggibili. I layout Professionali mantengono la navigazione laterale e la regia inferiore.</p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {SKINS.map((skin) => {
                const selected = st.skinId === skin.id
                return (
                  <button key={skin.id} type="button" onClick={() => patch({ skinId: skin.id, designMode: skin.design, theme: skin.theme, accentColor: skin.accent })} aria-pressed={selected} className={`skin-card text-left ${selected ? 'is-selected' : ''}`}>
                    <div className="skin-card-preview" style={{ background: skin.colors[0], borderColor: skin.colors[1] }}>
                      {skin.design === 'professional' && <div className="skin-preview-sidebar" style={{ background: skin.colors[1] }} />}
                      <div className={`skin-preview-content ${skin.design === 'standard' ? 'is-standard' : ''}`}>
                        {skin.design === 'standard' && <span className="skin-preview-nav" style={{ background: skin.colors[1], borderLeft: `1rem solid ${skin.accent}` }} />}
                        <span style={{ background: skin.colors[1] }} />
                        <span style={{ background: skin.accent, width: '58%' }} />
                        <span style={{ background: skin.colors[2], width: '78%' }} />
                      </div>
                    </div>
                    <div className="mt-3 flex items-start justify-between gap-2">
                      <span><span className="block font-bold text-text">{skin.name}</span><span className="text-sm text-muted">{skin.family} · {skin.design === 'professional' ? 'Regia' : 'Standard'}</span></span>
                      {selected && <Check className="mt-1 h-4 w-4 shrink-0 text-accent-text" aria-label="Selezionata" />}
                    </div>
                  </button>
                )
              })}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
              <label className="text-base font-semibold" htmlFor="custom-accent">Colore personalizzato</label>
              <input id="custom-accent" type="color" value={st.accentColor} onChange={(e) => patch({ skinId: 'custom', accentColor: e.target.value })} className="h-10 w-16 rounded border border-line bg-inset" />
              <span className="text-sm text-muted">La modifica del colore mantiene l’ultimo layout scelto.</span>
            </div>
          </Panel>
        )}
        {section === 'cartelle' && (
          <Panel
            title="Cartelle della libreria"
            right={
              <div className="flex gap-2">
                <Btn onClick={() => void rescan()} disabled={scanning}>
                  <RefreshCw className={scanning ? 'animate-spin' : ''} /> Riscansiona
                </Btn>
                <Btn variant="primary" onClick={() => void pickFolder()} disabled={scanning}>
                  <FolderPlus /> Aggiungi cartella
                </Btn>
              </div>
            }
          >
            {scanning && scanProgress && (
              <div className="mb-4 rounded-xl border border-line bg-inset p-4" role="status" aria-live="polite">
                <p className="text-base font-semibold text-text">
                  Scansione in corso: {scanProgress.scannedFiles.toLocaleString('it-IT')} file analizzati,
                  {' '}{scanProgress.foundSongs.toLocaleString('it-IT')} brani trovati.
                </p>
                <div
                  className="mt-3 h-3 overflow-hidden rounded-full bg-row"
                  role="progressbar"
                  aria-label="Avanzamento della scansione della libreria"
                  aria-valuetext={`${scanProgress.scannedFiles} file analizzati`}
                >
                  <div className="h-full w-1/3 animate-pulse rounded-full bg-accent" />
                </div>
                {scanProgress.unreadablePaths > 0 && (
                  <p className="mt-2 text-base text-danger">
                    {scanProgress.unreadablePaths} percorsi non accessibili. La libreria precedente sarà mantenuta.
                  </p>
                )}
              </div>
            )}
            {!scanning && scanSummary && (
              <p className="mb-3 text-base text-accent-text" role="status" aria-live="polite">{scanSummary}</p>
            )}
            {!scanning && scanIssue && (
              <p className="mb-3 rounded-lg border border-danger bg-inset p-3 text-base text-danger" role="alert">
                {scanIssue}
              </p>
            )}
            {libraryPaths.length === 0 ? (
              <p className="text-base text-muted">
                Nessuna cartella. Aggiungi quella con i tuoi file MP3+CDG, video e MIDI/KAR.
              </p>
            ) : (
              <ul className="space-y-1">
                {libraryPaths.map((p) => (
                  <li
                    key={p}
                    className="flex items-center gap-2 rounded bg-row px-2 py-1.5 text-base"
                  >
                    <span className="min-w-0 flex-1 truncate">{p}</span>
                    <Btn
                      variant="ghost"
                      onClick={() => void removeLibraryPath(p)}
                      disabled={scanning}
                      title="Togli dalla libreria"
                    >
                      <Trash2 />
                    </Btn>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-base text-muted">
              Formati letti: MP3/WMA con file .cdg dallo stesso nome, video (MP4, MKV, AVI, FLV…),
              MIDI/KAR (con testi sincronizzati) e audio semplice.
            </p>
          </Panel>
        )}

        {section === 'schermo' && (
          <Panel title="Schermo testi (TV / secondo monitor)">
            <div className="space-y-3 text-base">
              <label className="flex items-center gap-3">
                <span className="w-32 shrink-0 text-text">Monitor</span>
                <select
                  value={st.monitorIndex}
                  onChange={(e) => patch({ monitorIndex: Number(e.target.value) })}
                  className="flex-1 rounded-lg border-2 border-line bg-inset px-2 py-2 text-base"
                >
                  <option value={-1}>Finestra normale (non a schermo intero)</option>
                  {monitors.map((m) => (
                    <option key={m.index} value={m.index}>
                      {m.name} — {m.width}×{m.height}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-3">
                <span className="w-32 shrink-0 text-text">Colore di sfondo</span>
                <input
                  type="color"
                  value={st.displayBg}
                  onChange={(e) => patch({ displayBg: e.target.value })}
                  className="h-10 w-16 rounded border-2 border-line bg-transparent"
                />
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <span className="w-32 shrink-0 text-text">Immagine di sfondo</span>
                <Btn
                  onClick={() =>
                    void open({
                      multiple: false,
                      filters: [
                        {
                          name: 'Immagini',
                          extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'],
                        },
                      ],
                    }).then((f) => {
                      if (typeof f === 'string') {
                        patch({ displayImage: f })
                        queueMicrotask(pushDisplay)
                      }
                    })
                  }
                >
                  <ImagePlus /> {st.displayImage ? 'Cambia immagine' : 'Scegli immagine'}
                </Btn>
                {st.displayImage && (
                  <Btn
                    variant="ghost"
                    onClick={() => {
                      patch({ displayImage: '' })
                      queueMicrotask(pushDisplay)
                    }}
                  >
                    <Trash2 /> Togli
                  </Btn>
                )}
              </div>
              <Slider
                label="Grandezza testi"
                min={1}
                max={2.2}
                step={0.1}
                value={st.displayTextScale}
                display={`${Math.round(st.displayTextScale * 100)}%`}
                onChange={(v) => patch({ displayTextScale: v })}
              />
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={st.displayStretch}
                  onChange={(e) => patch({ displayStretch: e.target.checked })}
                />
                <span>Allarga i testi del karaoke fino ai bordi dello schermo</span>
              </label>
            </div>
          </Panel>
        )}

        {section === 'audio' && (
          <Panel title="Audio e microfono">
            <div className="space-y-3 text-base">
              <p>
                L'audio del programma esce dall'uscita scelta nelle impostazioni del computer (su
                Mac: Impostazioni di Sistema → Suono → Uscita). Se hai un mixer collegato, scegli
                quello.
              </p>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={st.micInApp}
                  onChange={async (e) => {
                    const enabled = e.target.checked
                    if (!enabled) {
                      if (st.micOn) await engine.setMic(false)
                      patch({ micInApp: false, micOn: false })
                      return
                    }
                    try {
                      await engine.setMic(true)
                      patch({ micInApp: true, micOn: true })
                    } catch {
                      patch({ micInApp: false, micOn: false })
                    }
                  }}
                />
                <span>Usa il microfono dentro il programma (con riverbero ed effetti)</span>
              </label>
              <p className="text-muted">
                Lascia spento se il microfono è collegato al mixer: gli effetti li fa il mixer e il
                programma non chiederà il permesso del microfono.
              </p>
            </div>
          </Panel>
        )}

        {section === 'cuffie' && (
          <Panel title="Anteprima in cuffia">
            {previewSupported() ? (
              <label className="flex items-center gap-3 text-base">
                <span className="w-32 shrink-0 text-text">Uscita cuffie</span>
                <select
                  value={st.headphonesId}
                  onChange={(e) => patch({ headphonesId: e.target.value })}
                  className="flex-1 rounded-lg border-2 border-line bg-inset px-2 py-2 text-base"
                >
                  <option value="">— scegli —</option>
                  {outputs.map((o, i) => (
                    <option key={o.deviceId} value={o.deviceId}>
                      {o.label || `Uscita audio ${i + 1}`}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <p className="text-base text-muted">
                Su questo sistema non è possibile scegliere l'uscita delle cuffie dall'app, quindi
                l'anteprima in cuffia non è disponibile.
              </p>
            )}
          </Panel>
        )}

        {section === 'youtube' && (
          <Panel title="Download da YouTube">
            <div className="flex items-center gap-3 text-base">
              <span className="w-32 shrink-0 text-text">Cartella</span>
              <span className="min-w-0 flex-1 truncate text-muted">
                {st.downloadDir || "Cartella predefinita dell'app"}
              </span>
              <Btn onClick={() => void pickDownloadDir()}>Scegli…</Btn>
              {st.downloadDir && (
                <Btn variant="ghost" onClick={() => patch({ downloadDir: '' })}>
                  Predefinita
                </Btn>
              )}
            </div>
            <p className="mt-2 text-base text-muted">
              Serve il programma esterno <b>yt-dlp</b>. Uso personale: rispetta i termini di YouTube
              e il diritto d'autore.
            </p>
            <YtdlpPanel />
          </Panel>
        )}
        {section === 'aggiornamenti' && <UpdatesPanel />}
      </div>
    </div>
  )
}
