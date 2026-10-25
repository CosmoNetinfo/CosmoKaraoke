import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { FolderPlus, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { previewSupported } from "../lib/player";
import { useStore } from "../lib/store";
import type { MonitorInfo } from "../types";
import { Btn, Panel, Slider } from "./ui";
import { UpdatesPanel, YtdlpPanel } from "./UpdatesPanel";

export function Settings() {
  const libraryPaths = useStore((s) => s.libraryPaths);
  const scanning = useStore((s) => s.scanning);
  const st = useStore((s) => s.settings);
  const patch = useStore((s) => s.patchSettings);
  const addLibraryPath = useStore((s) => s.addLibraryPath);
  const removeLibraryPath = useStore((s) => s.removeLibraryPath);
  const rescan = useStore((s) => s.rescan);
  const [monitors, setMonitors] = useState<MonitorInfo[]>([]);
  const [outputs, setOutputs] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    invoke<MonitorInfo[]>("list_monitors")
      .then(setMonitors)
      .catch(() => setMonitors([]));
    navigator.mediaDevices
      .enumerateDevices()
      .then((d) => setOutputs(d.filter((x) => x.kind === "audiooutput")))
      .catch(() => setOutputs([]));
  }, []);

  const pickFolder = async () => {
    const dir = await open({ directory: true, multiple: false });
    if (typeof dir === "string") await addLibraryPath(dir);
  };

  const pickDownloadDir = async () => {
    const dir = await open({ directory: true, multiple: false });
    if (typeof dir === "string") patch({ downloadDir: dir });
  };

  return (
    <div className="space-y-3 overflow-y-auto pr-1">
      <Panel
        title="Cartelle della libreria"
        right={
          <div className="flex gap-2">
            <Btn onClick={() => void rescan()} disabled={scanning}>
              <RefreshCw className={scanning ? "animate-spin" : ""} />{" "}
              Riscansiona
            </Btn>
            <Btn variant="primary" onClick={() => void pickFolder()}>
              <FolderPlus /> Aggiungi cartella
            </Btn>
          </div>
        }
      >
        {libraryPaths.length === 0 ? (
          <p className="text-base text-muted">
            Nessuna cartella. Aggiungi quella con i tuoi file MP3+CDG, video e
            MIDI/KAR.
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
                  title="Togli dalla libreria"
                >
                  <Trash2 />
                </Btn>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-base text-muted">
          Formati letti: MP3/WMA con file .cdg dallo stesso nome, video (MP4,
          MKV, AVI, FLV…) e audio semplice. I file MIDI/KAR compaiono in elenco
          ma la riproduzione arriverà in una versione successiva.
        </p>
      </Panel>

      <Panel title="Schermo testi (TV / secondo monitor)">
        <div className="space-y-3 text-base">
          <label className="flex items-center gap-3">
            <span className="w-32 shrink-0 text-text">Monitor</span>
            <select
              value={st.monitorIndex}
              onChange={(e) => patch({ monitorIndex: Number(e.target.value) })}
              className="flex-1 rounded-lg border-2 border-line bg-inset px-2 py-2 text-base"
            >
              <option value={-1}>
                Finestra normale (non a schermo intero)
              </option>
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
            Su questo sistema non è possibile scegliere l'uscita delle cuffie
            dall'app, quindi l'anteprima in cuffia non è disponibile.
          </p>
        )}
      </Panel>

      <Panel title="Download da YouTube">
        <div className="flex items-center gap-3 text-base">
          <span className="w-32 shrink-0 text-text">Cartella</span>
          <span className="min-w-0 flex-1 truncate text-muted">
            {st.downloadDir || "Cartella predefinita dell'app"}
          </span>
          <Btn onClick={() => void pickDownloadDir()}>Scegli…</Btn>
          {st.downloadDir && (
            <Btn variant="ghost" onClick={() => patch({ downloadDir: "" })}>
              Predefinita
            </Btn>
          )}
        </div>
        <p className="mt-2 text-base text-muted">
          Serve il programma esterno <b>yt-dlp</b>. Uso personale: rispetta i
          termini di YouTube e il diritto d'autore.
        </p>
        <YtdlpPanel />
      </Panel>
      <UpdatesPanel />
    </div>
  );
}
