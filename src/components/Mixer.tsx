import { open } from "@tauri-apps/plugin-dialog";
import { Mic, MicOff, Plus, RotateCcw, Trash2 } from "lucide-react";
import { engine, EQ_FREQS } from "../lib/engine";
import { applyMicFx, applySettingsToEngine, playJingle } from "../lib/player";
import { DEFAULT_SETTINGS, useStore } from "../lib/store";
import type { Settings } from "../types";
import { Btn, Panel, Slider } from "./ui";

/** Combinazioni pronte per la voce: ognuna imposta tutti i controlli qui sotto. */
const MIC_PRESETS: { name: string; fx: Partial<Settings> }[] = [
  {
    name: "Pulita",
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
    name: "Sala concerti",
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
    name: "Teatro",
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
    name: "Voce doppia",
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
    name: "Eco da stadio",
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
];

function freqLabel(f: number): string {
  return f >= 1000 ? `${f / 1000}k` : `${f}`;
}

export function Mixer() {
  const st = useStore((s) => s.settings);
  const patch = useStore((s) => s.patchSettings);
  const jingles = useStore((s) => s.jingles);
  const notify = useStore((s) => s.notify);

  const setFx = (fx: Partial<Settings>) => {
    patch(fx);
    applyMicFx({ ...useStore.getState().settings, ...fx });
  };

  const toggleMic = async () => {
    const next = !st.micOn;
    try {
      await engine.setMic(next);
      patch({ micOn: next });
    } catch {
      notify(
        "Non riesco ad accendere il microfono: controlla i permessi del sistema.",
      );
      patch({ micOn: false });
    }
  };

  const addJingles = async () => {
    const files = await open({
      multiple: true,
      filters: [
        { name: "Audio", extensions: ["mp3", "wav", "ogg", "m4a", "flac"] },
      ],
    });
    if (!files) return;
    const list = (Array.isArray(files) ? files : [files]).map((p) => ({
      id: crypto.randomUUID(),
      path: p,
      name: (p.split(/[\\/]/).pop() ?? p).replace(/\.[^.]+$/, ""),
    }));
    useStore.setState((s) => ({ jingles: [...s.jingles, ...list] }));
  };

  const reset = () => {
    patch({
      eq: DEFAULT_SETTINGS.eq,
      pitch: 0,
      tempo: 1,
      vocalOff: false,
    });
    applySettingsToEngine();
  };

  return (
    <div className="space-y-3 overflow-y-auto pr-1">
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
              patch({ volume: v });
              engine.setVolume(v);
            }}
          />
          <Slider
            label="Tonalità"
            min={-12}
            max={12}
            step={1}
            value={st.pitch}
            display={`${st.pitch > 0 ? "+" : ""}${st.pitch}`}
            onChange={(v) => {
              patch({ pitch: v });
              engine.setPitch(v);
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
              patch({ tempo: v });
              engine.setTempo(v);
            }}
          />
          <div className="flex flex-wrap items-center gap-2 text-base">
            <span className="w-32 shrink-0 text-text">Uscita audio</span>
            {([false, true] as const).map((mono) => (
              <Btn
                key={String(mono)}
                variant={st.outputMono === mono ? "primary" : "default"}
                aria-pressed={st.outputMono === mono}
                onClick={() => {
                  patch({ outputMono: mono });
                  engine.setOutputMono(mono);
                }}
              >
                {mono ? "Mono" : "Stereo"}
              </Btn>
            ))}
            <span className="text-muted">
              — Mono se l'impianto ha un solo altoparlante
            </span>
          </div>
          <label className="flex items-center gap-2 text-base">
            <input
              type="checkbox"
              checked={st.vocalOff}
              onChange={(e) => {
                patch({ vocalOff: e.target.checked });
                engine.setVocalRemoval(e.target.checked);
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
                {st.eq[i] > 0 ? "+" : ""}
                {st.eq[i]}
              </span>
              <input
                type="range"
                min={-12}
                max={12}
                step={1}
                value={st.eq[i]}
                onChange={(e) => {
                  const db = Number(e.target.value);
                  const eq = st.eq.map((v, k) => (k === i ? db : v));
                  patch({ eq });
                  engine.setEq(i, db);
                }}
                className="h-24 w-4"
                style={{ writingMode: "vertical-lr", direction: "rtl" }}
              />
              <span className="text-base text-muted">{freqLabel(f)}</span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel
        title="Microfono"
        right={
          <Btn
            variant={st.micOn ? "danger" : "default"}
            onClick={() => void toggleMic()}
          >
            {st.micOn ? <Mic /> : <MicOff />}
            {st.micOn ? "Acceso" : "Spento"}
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
              patch({ micVol: v });
              engine.setMicVolume(v);
            }}
          />
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
            display={
              st.reverbSize < 0.34
                ? "Stanza"
                : st.reverbSize < 0.67
                  ? "Sala"
                  : "Chiesa"
            }
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
            display={`${st.micBass > 0 ? "+" : ""}${st.micBass} dB`}
            onChange={(v) => setFx({ micBass: v })}
          />
          <Slider
            label="Acuti"
            min={-12}
            max={12}
            step={1}
            value={st.micTreble}
            display={`${st.micTreble > 0 ? "+" : ""}${st.micTreble} dB`}
            onChange={(v) => setFx({ micTreble: v })}
          />
          <Slider
            label="Livellatore voce"
            min={0}
            max={1}
            step={0.05}
            value={st.micComp}
            display={
              st.micComp === 0 ? "Spento" : `${Math.round(st.micComp * 100)}%`
            }
            onChange={(v) => setFx({ micComp: v })}
          />
          <p className="text-base text-muted">
            Per evitare il fischio, usa le cuffie oppure tieni il microfono
            lontano dalle casse.
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
          <p className="text-base text-muted">
            Aggiungi dei suoni: li lanci con un clic o con i tasti 1–9.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {jingles.map((j, i) => (
              <div key={j.id} className="flex gap-1">
                <Btn
                  className="min-w-0 flex-1 justify-start"
                  onClick={() => playJingle(j.path)}
                >
                  <span className="rounded bg-inset px-1.5 text-base text-muted">
                    {i < 9 ? i + 1 : "·"}
                  </span>
                  <span className="truncate">{j.name}</span>
                </Btn>
                <Btn
                  variant="ghost"
                  title="Rimuovi"
                  onClick={() =>
                    useStore.setState((s) => ({
                      jingles: s.jingles.filter((x) => x.id !== j.id),
                    }))
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
  );
}
