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

const TABS: Array<{ id: Tab; label: string; icon: typeof LibraryIcon }> = [
  { id: 'library', label: 'Libreria', icon: LibraryIcon },
  { id: 'youtube', label: 'YouTube', icon: Film },
  { id: 'mixer', label: 'Audio', icon: SlidersHorizontal },
  { id: 'effects', label: 'Effetti', icon: Sparkles },
  { id: 'live', label: 'Live', icon: QrCode },
  { id: 'settings', label: 'Impostazioni', icon: SettingsIcon },
]

export default function App() {
  const tab = useStore((s) => s.tab)
  const hydrated = useStore((s) => s.hydrated)
  const livePendingCount = useStore((s) => s.livePendingCount)
  const toast = useStore((s) => s.toast)
  const displayOpen = useStore((s) => s.displayOpen)
  const displayBlack = useStore((s) => s.displayBlack)
  const monitorIndex = useStore((s) => s.settings.monitorIndex)
  const current = useStore((s) => s.current)
  const queueCount = useStore((s) => s.queueA.length)
  const playing = useStore((s) => s.playing)
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
    queueMicrotask(pushDisplay)
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
      if (e.key >= '1' && e.key <= '9' && !inInput && !e.ctrlKey && !e.metaKey && !e.altKey) {
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
    <div className="app-shell flex h-full flex-col bg-bg text-text selection:bg-accent selection:text-on-accent">
      <UpdateBanner />
      <NowPlaying />
      <Tooltips />

      <header className="app-topbar flex flex-wrap items-center justify-between gap-3 px-5 py-3">
        <div className="flex min-w-fit items-center gap-3">
          <div className="brand-mark flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-hover text-on-accent">
            <Mic className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <h1 className="text-xl font-black tracking-tight text-text">Cosmo<span className="text-accent-text">Karaoke</span></h1>
            <div className="mt-1 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-muted">Live control room</div>
          </div>
        </div>

        <nav aria-label="Sezioni principali" className="app-nav flex flex-wrap items-center gap-1 rounded-2xl p-1">
          {TABS.map((t) => {
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => patch({ tab: t.id })}
                aria-current={active ? 'page' : undefined}
                className={`relative inline-flex min-h-11 items-center gap-2 rounded-xl px-3.5 py-1.5 text-base font-bold transition-all ${
                  active
                    ? 'bg-accent text-on-accent shadow-xs'
                    : 'text-muted hover:bg-btn hover:text-text'
                }`}
              >
                <t.icon className={`h-4 w-4 ${active ? 'text-on-accent' : 'text-accent-text'}`} />
                <span>{t.label}</span>
                {t.id === 'live' && livePendingCount > 0 && (
                <span className="ml-1 inline-flex min-h-6 min-w-6 items-center justify-center rounded-full bg-danger px-1.5 text-base font-black text-on-danger">
                    {livePendingCount}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <AccessibilityMenu />

          <Btn
            variant={displayBlack ? 'danger' : 'default'}
            onClick={toggleBlack}
            disabled={!displayOpen}
            className="text-base font-bold"
            title="Oscura momentaneamente lo schermo dei testi"
          >
            Schermo nero
          </Btn>

          <Btn
            variant={displayOpen ? 'danger' : 'primary'}
            onClick={() => void toggleDisplay()}
            className="text-base font-bold"
          >
            {displayOpen ? <MonitorOff className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
            <span>{displayOpen ? 'Chiudi TV' : 'Apri TV testi'}</span>
          </Btn>
        </div>
      </header>

      <div className="session-bar flex flex-wrap items-center justify-between gap-3 px-5 py-2.5">
        <div className="flex items-center gap-3">
          <span className={`live-indicator h-2.5 w-2.5 rounded-full ${playing ? 'is-live' : ''}`} />
          <span aria-live="polite" className="text-sm font-extrabold tracking-wide">{playing ? 'IN RIPRODUZIONE' : current ? 'IN PAUSA' : 'REGIA PRONTA'}</span>
          <span className="h-4 w-px bg-line" />
          <span className="max-w-[26rem] truncate text-sm text-muted">{current?.song.title ?? 'Seleziona un brano per iniziare la serata'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-muted">
          <span className="rounded-full border border-line bg-panel px-3 py-1">{queueCount} {queueCount === 1 ? 'brano' : 'brani'} in scaletta</span>
          <span className="rounded-full border border-line bg-panel px-3 py-1">{displayOpen ? 'TV collegata' : 'TV non avviata'}</span>
        </div>
      </div>

      <main className="app-workspace grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto p-5 xl:grid-cols-[minmax(0,1fr)_minmax(27rem,31rem)] xl:overflow-hidden">
        <div className="min-h-[28rem] xl:min-h-0 xl:overflow-hidden">
          {tab === 'library' && <Library />}
          {tab === 'youtube' && <YouTube />}
          {tab === 'mixer' && <Mixer />}
          {tab === 'effects' && <Effetti />}
          {tab === 'live' && <LivePanel />}
          {tab === 'settings' && <Settings />}
        </div>

        <aside className="app-rail min-h-0 space-y-4 xl:overflow-y-auto xl:pr-1.5">
          <PlayerPanel />
          <Playlists />
        </aside>
      </main>

      {/* TOAST NOTIFICHE POPUP */}
      {toast && (
        <div className="pointer-events-none fixed bottom-5 left-1/2 z-50 max-w-xl -translate-x-1/2 rounded-xl border border-accent/40 bg-panel/95 px-5 py-3 text-base font-bold text-text shadow-2xl backdrop-blur-md">
          {toast}
        </div>
      )}
    </div>
  )
}
