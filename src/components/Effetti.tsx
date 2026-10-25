import { convertFileSrc } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'
import {
  ImagePlus,
  Music,
  Pause,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  SkipForward,
  Trash2,
  Volume2,
} from 'lucide-react'
import { useState } from 'react'
import {
  bgNextTrack,
  bgPlay,
  bgStop,
  effectList,
  playJingle,
  pushDisplay,
  setBgVolume,
} from '../lib/player'
import { useStore } from '../lib/store'
import type { Jingle } from '../types'
import { Btn, Panel, Slider, SubTabs } from './ui'

type Section = 'effetti' | 'stacchetti' | 'sottofondo' | 'sfondo'
const SECTIONS: { id: Section; label: string }[] = [
  { id: 'effetti', label: 'Effetti sonori' },
  { id: 'stacchetti', label: 'Stacchetti' },
  { id: 'sottofondo', label: 'Sottofondo' },
  { id: 'sfondo', label: 'Sfondo TV' },
]

const AUDIO_EXT = ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac', 'wma']

function toJingles(files: string | string[] | null): Jingle[] {
  if (!files) return []
  return (Array.isArray(files) ? files : [files]).map((p) => ({
    id: crypto.randomUUID(),
    path: p,
    name: (p.split(/[\\/]/).pop() ?? p).replace(/\.[^.]+$/, ''),
  }))
}

async function pickAudio(): Promise<Jingle[]> {
  const files = await open({ multiple: true, filters: [{ name: 'Audio', extensions: AUDIO_EXT }] })
  return toJingles(files)
}

/** Elenco di file con pulsante «Aggiungi» e cestino per ciascuno. */
function FileList({
  items,
  onAdd,
  onRemove,
  onTest,
  empty,
}: {
  items: Jingle[]
  onAdd: () => void
  onRemove: (id: string) => void
  onTest?: (j: Jingle) => void
  empty: string
}) {
  return (
    <div className="space-y-2">
      <Btn variant="primary" onClick={onAdd}>
        <Plus /> Aggiungi file audio
      </Btn>
      {items.length === 0 ? (
        <p className="text-base text-muted">{empty}</p>
      ) : (
        <ul className="space-y-1">
          {items.map((j) => (
            <li key={j.id} className="flex items-center gap-2 rounded bg-row px-2 py-1.5 text-base">
              <Music className="shrink-0 text-accent-text" />
              <span className="min-w-0 flex-1 truncate">{j.name}</span>
              {onTest && (
                <Btn variant="ghost" title="Prova" onClick={() => onTest(j)}>
                  <Play />
                </Btn>
              )}
              <Btn variant="ghost" title="Togli" onClick={() => onRemove(j.id)}>
                <Trash2 />
              </Btn>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function Effetti() {
  const [section, setSection] = useState<Section>('effetti')
  const st = useStore((s) => s.settings)
  const patch = useStore((s) => s.patchSettings)
  const jingles = useStore((s) => s.jingles)
  const interludes = useStore((s) => s.interludes)
  const bgTracks = useStore((s) => s.bgTracks)
  const bgOn = useStore((s) => s.bgOn)
  const bgTitle = useStore((s) => s.bgTitle)

  const [edit, setEdit] = useState(false)
  const slots = effectList()

  const removeSlot = (e: { key: string; builtin: boolean }) => {
    if (e.builtin) patch({ hiddenEffects: [...st.hiddenEffects, e.key] })
    else useStore.setState((s) => ({ jingles: s.jingles.filter((j) => j.id !== e.key) }))
  }

  const pickImage = async () => {
    const f = await open({
      multiple: false,
      filters: [{ name: 'Immagini', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'] }],
    })
    if (typeof f === 'string') {
      patch({ displayImage: f })
      queueMicrotask(pushDisplay)
    }
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <SubTabs tabs={SECTIONS} value={section} onChange={setSection} />
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-2">
        {section === 'effetti' && (
          <>
            <Panel title="Effetti sonori">
              <div className="space-y-3">
                <Slider
                  label="Volume effetti"
                  min={0}
                  max={1}
                  step={0.05}
                  value={st.fxVolume}
                  display={`${Math.round(st.fxVolume * 100)}%`}
                  onChange={(v) => patch({ fxVolume: v })}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Btn variant={edit ? 'primary' : 'default'} onClick={() => setEdit((v) => !v)}>
                    <Pencil /> {edit ? 'Fatto' : 'Togli effetti'}
                  </Btn>
                  {st.hiddenEffects.length > 0 && (
                    <Btn onClick={() => patch({ hiddenEffects: [] })}>
                      <RotateCcw /> Rimetti quelli tolti ({st.hiddenEffects.length})
                    </Btn>
                  )}
                  {edit && (
                    <span className="text-base text-muted">
                      Premi il cestino rosso accanto a un effetto per toglierlo.
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-4">
                  {slots.map((e, i) => (
                    <div key={e.key} className="flex gap-1">
                      <Btn
                        className="min-h-16 min-w-0 flex-1 justify-start text-lg"
                        onClick={e.run}
                      >
                        <Volume2 className="shrink-0" />
                        <span className="min-w-0 flex-1 truncate text-left">{e.name}</span>
                        {i < 9 && (
                          <kbd className="rounded bg-inset px-1.5 text-base text-muted">
                            {i + 1}
                          </kbd>
                        )}
                      </Btn>
                      {edit && (
                        <Btn
                          variant="danger"
                          className="min-h-16"
                          title={`Togli «${e.name}»`}
                          onClick={() => removeSlot(e)}
                        >
                          <Trash2 />
                        </Btn>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-base text-muted">
                  I tasti da 1 a 9 della tastiera fanno partire i primi nove effetti. Gli effetti
                  del programma si possono togliere e rimettere quando vuoi.
                </p>
              </div>
            </Panel>
            <Panel title="I tuoi effetti (applausi, fischi, voci…)">
              <FileList
                items={jingles}
                empty="Nessun effetto tuo. Aggiungi file audio brevi: compariranno tra i pulsanti, prima di quelli del programma."
                onAdd={() =>
                  void pickAudio().then((l) =>
                    useStore.setState((s) => ({ jingles: [...s.jingles, ...l] })),
                  )
                }
                onRemove={(id) =>
                  useStore.setState((s) => ({ jingles: s.jingles.filter((j) => j.id !== id) }))
                }
                onTest={(j) => playJingle(j.path, j.name)}
              />
            </Panel>
          </>
        )}

        {section === 'stacchetti' && (
          <Panel title="Stacchetti musicali tra un brano e l'altro">
            <div className="space-y-3 text-base">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={st.interludeOn}
                  onChange={(e) => patch({ interludeOn: e.target.checked })}
                />
                <span>Metti uno stacchetto tra un brano e l'altro</span>
              </label>
              <Slider
                label="Ogni quanti brani"
                min={1}
                max={5}
                step={1}
                value={st.interludeEvery}
                display={st.interludeEvery === 1 ? 'Ogni brano' : `Ogni ${st.interludeEvery} brani`}
                onChange={(v) => patch({ interludeEvery: v })}
              />
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={st.interludeRandom}
                  onChange={(e) => patch({ interludeRandom: e.target.checked })}
                />
                <span>Scegli lo stacchetto a caso (altrimenti uno dopo l'altro)</span>
              </label>
              <FileList
                items={interludes}
                empty="Nessuno stacchetto. Aggiungi qualche musichetta di pochi secondi."
                onAdd={() =>
                  void pickAudio().then((l) =>
                    useStore.setState((s) => ({ interludes: [...s.interludes, ...l] })),
                  )
                }
                onRemove={(id) =>
                  useStore.setState((s) => ({
                    interludes: s.interludes.filter((j) => j.id !== id),
                  }))
                }
                onTest={(j) => playJingle(j.path, j.name)}
              />
              <p className="text-muted">
                Lo stacchetto parte da solo quando un brano finisce e ce n'è un altro in scaletta.
                Se premi «Prossimo» non parte.
              </p>
            </div>
          </Panel>
        )}

        {section === 'sottofondo' && (
          <Panel
            title="Musica di sottofondo"
            right={
              <div className="flex gap-2">
                <Btn
                  variant={bgOn ? 'danger' : 'primary'}
                  onClick={() => (bgOn ? bgStop() : void bgPlay())}
                >
                  {bgOn ? <Pause /> : <Play />}
                  {bgOn ? 'Ferma sottofondo' : 'Avvia sottofondo'}
                </Btn>
                <Btn title="Brano successivo" disabled={!bgOn} onClick={bgNextTrack}>
                  <SkipForward />
                </Btn>
              </div>
            }
          >
            <div className="space-y-3 text-base">
              {bgOn && bgTitle && (
                <p>
                  In riproduzione: <b>{bgTitle}</b>
                </p>
              )}
              <Slider
                label="Volume sottofondo"
                min={0}
                max={1}
                step={0.05}
                value={st.bgVolume}
                display={`${Math.round(st.bgVolume * 100)}%`}
                onChange={setBgVolume}
              />
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={st.bgAuto}
                  onChange={(e) => patch({ bgAuto: e.target.checked })}
                />
                <span>Riprendi da solo quando finisce la scaletta</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={st.bgShuffle}
                  onChange={(e) => patch({ bgShuffle: e.target.checked })}
                />
                <span>Brani in ordine casuale</span>
              </label>
              <FileList
                items={bgTracks}
                empty="Nessun brano di sottofondo. Aggiungi qualsiasi canzone: suona mentre nessuno canta."
                onAdd={() =>
                  void pickAudio().then((l) =>
                    useStore.setState((s) => ({ bgTracks: [...s.bgTracks, ...l] })),
                  )
                }
                onRemove={(id) =>
                  useStore.setState((s) => ({ bgTracks: s.bgTracks.filter((j) => j.id !== id) }))
                }
              />
              <p className="text-muted">
                Quando parte un brano il sottofondo si abbassa e si ferma da solo.
              </p>
            </div>
          </Panel>
        )}

        {section === 'sfondo' && (
          <Panel title="Sfondo della TV">
            <div className="space-y-3 text-base">
              <p>
                L'immagine si vede sulla TV quando non c'è un brano con i testi (all'avvio, tra un
                brano e l'altro, durante gli stacchetti e il sottofondo).
              </p>
              <div className="flex flex-wrap gap-2">
                <Btn variant="primary" onClick={() => void pickImage()}>
                  <ImagePlus /> Scegli immagine
                </Btn>
                {st.displayImage && (
                  <Btn
                    onClick={() => {
                      patch({ displayImage: '' })
                      queueMicrotask(pushDisplay)
                    }}
                  >
                    <Trash2 /> Togli immagine
                  </Btn>
                )}
              </div>
              {st.displayImage ? (
                <img
                  src={convertFileSrc(st.displayImage)}
                  alt="Anteprima dello sfondo"
                  className="aspect-video w-full max-w-xl rounded-lg border-2 border-line object-cover"
                />
              ) : (
                <p className="text-muted">Nessuna immagine: si vede solo il colore di sfondo.</p>
              )}
            </div>
          </Panel>
        )}
      </div>
    </div>
  )
}
