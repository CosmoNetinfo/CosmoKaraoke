import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import {
  Film,
  Library as LibraryIcon,
  Mic,
  Monitor,
  MonitorOff,
  QrCode,
  Settings as SettingsIcon,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react'
import { useEffect } from 'react'
import { AccessibilityMenu } from './components/AccessibilityMenu'
import { Effetti } from './components/Effetti'
import { Library } from './components/Library'
import { LivePanel } from './components/LivePanel'
import { Mixer } from './components/Mixer'
import { NowPlaying } from './components/NowPlaying'
import { PlayerPanel } from './components/PlayerPanel'
import { Playlists } from './components/Playlists'
import { Settings } from './components/Settings'
import { Tooltips } from './components/Tooltips'
import { Btn } from './components/ui'
import { UpdateBanner } from './components/UpdateBanner'
import { YouTube } from './components/YouTube'
import { applyAppearance } from './lib/appearance'
import {
  effectList,
  initPlayer,
  mixNext,
  pushDisplay,
  stopAllSounds,
  togglePause,
} from './lib/player'
import { useStore, type Tab } from './lib/store'

const TABS: Array<{ id: Tab; label: string; icon: typeof LibraryIcon; color?: string }> = [
  { id: 'library', label: 'Libreria', icon: LibraryIcon, color: 'text-accent-text' },
  { id: 'youtube', label: 'YouTube', icon: Film, color: 'text-red-400' },
  { id: 'mixer', label: 'Audio', icon: SlidersHorizontal, color: 'text-cyan-400' },
  { id: 'effects', label: 'Effetti', icon: Sparkles, color: 'text-amber-400' },
  { id: 'live', label: 'Live', icon: QrCode, color: 'text-emerald-400' },
  { id: 'settings', label: 'Impostazioni', icon: SettingsIcon, color: 'text-muted' },
]

export default function App() {
  const tab = useStore((s) => s.tab)
  const hydrated = useStore((s) => s.hydrated)
  const livePendingCount = useStore((s) => s.livePendingCount)
  const toast = useStore((s) => s.toast)
  const displayOpen = useStore((s) => s.displayOpen)
  const displayBlack = useStore((s) => s.displayBlack)
  const monitorIndex = useStore((s) => s.settings.monitorIndex)
  const patch = useStore((s) => s.patch)
  const notify = useStore((s) => s.notify)

  useEffect(() => {
    let alive = true
    const unlisten: Array<() => void> = []
    const boot = async () => {
      await useStore.getState().hydrate()
      try {
        await initPlayer()
      } catch (e) {
        notify(`Audio non disponibile: ${String(e)}`)
      }
      const a = await listen('display:ready', () => patch({ displayOpen: true }))
      const b = await listen('display:closed', () => patch({ displayOpen: false }))
      if (!alive) {
        a()
        b()
        return
      }
      unlisten.push(a, b)
    }
    void boot()
    return () => {
      alive = false
      unlisten.forEach((u) => u())
    }
  }, [patch, notify])

  // carattere, dimensione e colori scelti
  const settings = useStore((s) => s.settings)
  useEffect(() => {
    applyAppearance(settings)
  }, [settings])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      const inInput =
        el &&
        (el.tagName === 'INPUT' ||
          el.tagName === 'TEXTAREA' ||
          el.tagName === 'SELECT' ||
          el.isContentEditable)

      if (e.code === 'Space' && !inInput) {
        e.preventDefault()
        void togglePause()
        return
      }
      if (e.code === 'KeyM' && !inInput && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        void mixNext()
        return
      }
      if (e.code === 'Escape') {
        stopAllSounds()
        return
      }
      if (e.key >= '1' && e.key <= '8' && !inInput && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const idx = Number(e.key) - 1
        const item = effectList()[idx]
        if (item) {
          e.preventDefault()
          item.run()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const toggleDisplay = async () => {
    try {
      if (displayOpen) {
        await invoke('close_display')
        patch({ displayOpen: false })
      } else {
        await invoke('open_display', { monitor: monitorIndex >= 0 ? monitorIndex : null })
      }
    } catch (e) {
      notify(`Schermo testi: ${String(e)}`)
    }
  }

  const toggleBlack = () => {
    patch({ displayBlack: !displayBlack })
    queueMicrotask(pushDisplay)
  }

  if (!hydrated) {
    return (
      <div className="flex h-full items-center justify-center text-lg font-bold text-muted">
        Caricamento CosmoKaraoke…
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-bg text-text selection:bg-accent selection:text-on-accent">
      <UpdateBanner />
      <NowPlaying />
      <Tooltips />

      {/* TOP HEADER MODERNO */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-header px-4 py-2.5 shadow-sm">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-hover text-on-accent shadow-xs">
            <Mic className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-text">
              Cosmo<span className="text-accent-text">Karaoke</span>
            </h1>
          </div>
        </div>

        {/* Tab centrali sagomate */}
        <nav className="flex flex-wrap items-center gap-1 rounded-xl border border-line bg-inset p-1">
          {TABS.map((t) => {
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => patch({ tab: t.id })}
                className={`relative inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-bold transition-all ${
                  active
                    ? 'bg-accent text-on-accent shadow-xs'
                    : 'text-muted hover:bg-btn hover:text-text'
                }`}
              >
                <t.icon className={`h-4 w-4 ${active ? 'text-on-accent' : t.color}`} />
                <span>{t.label}</span>
                {t.id === 'live' && livePendingCount > 0 && (
                  <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[11px] font-black text-on-danger">
                    {livePendingCount}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Azioni rapide di destra */}
        <div className="flex items-center gap-2">
          <AccessibilityMenu />

          <Btn
            variant={displayBlack ? 'danger' : 'default'}
            onClick={toggleBlack}
            disabled={!displayOpen}
            className="text-xs font-bold"
            title="Oscura momentaneamente lo schermo dei testi"
          >
            Schermo nero
          </Btn>

          <Btn
            variant={displayOpen ? 'danger' : 'primary'}
            onClick={() => void toggleDisplay()}
            className="text-xs font-bold"
          >
            {displayOpen ? <MonitorOff className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
            <span>{displayOpen ? 'Chiudi TV' : 'Apri TV testi'}</span>
          </Btn>
        </div>
      </header>

      {/* CORPO PRINCIPALE A 2 COLONNE ADATTIVE */}
      <main className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 xl:grid-cols-[minmax(0,1fr)_minmax(26rem,32rem)] xl:overflow-hidden">
        {/* Pannello sinistro: Contenuto della Scheda Attiva */}
        <div className="min-h-[28rem] xl:min-h-0 xl:overflow-hidden">
          {tab === 'library' && <Library />}
          {tab === 'youtube' && <YouTube />}
          {tab === 'mixer' && <Mixer />}
          {tab === 'effects' && <Effetti />}
          {tab === 'live' && <LivePanel />}
          {tab === 'settings' && <Settings />}
        </div>

        {/* Pannello destro: Deck Now Playing & Scalette A/B */}
        <aside className="min-h-0 space-y-4 xl:overflow-y-auto xl:pr-1.5">
          <PlayerPanel />
          <Playlists />
        </aside>
      </main>

      {/* TOAST NOTIFICHE POPUP */}
      {toast && (
        <div className="pointer-events-none fixed bottom-5 left-1/2 z-50 max-w-xl -translate-x-1/2 rounded-xl border border-accent/40 bg-panel/95 px-5 py-3 text-sm font-bold text-text shadow-2xl backdrop-blur-md">
          {toast}
        </div>
      )}
    </div>
  )
}
