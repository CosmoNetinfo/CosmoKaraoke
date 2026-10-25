import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import {
  Library as LibraryIcon,
  Monitor,
  MonitorOff,
  SlidersHorizontal,
  Settings as SettingsIcon,
  Film,
  Sparkles,
  QrCode,
} from 'lucide-react'
import { useEffect } from 'react'
import { Library } from './components/Library'
import { Effetti } from './components/Effetti'
import { NowPlaying } from './components/NowPlaying'
import { Tooltips } from './components/Tooltips'
import { Mixer } from './components/Mixer'
import { PlayerPanel } from './components/PlayerPanel'
import { Playlists } from './components/Playlists'
import { Settings } from './components/Settings'
import { LivePanel } from './components/LivePanel'
import { UpdateBanner } from './components/UpdateBanner'
import { AccessibilityMenu } from './components/AccessibilityMenu'
import { Btn } from './components/ui'
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
  const patch = useStore((s) => s.patch)
  const notify = useStore((s) => s.notify)

  // avvio: dati salvati, motore audio, eventi dallo schermo testi
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

  // scorciatoie da tastiera
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) return
      if (e.code === 'Space') {
        e.preventDefault()
        void togglePause()
      } else if (e.key === 'm') {
        void mixNext()
      } else if (e.key === 'Escape') {
        stopAllSounds()
      } else if (/^[1-9]$/.test(e.key)) {
        effectList()[Number(e.key) - 1]?.run()
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
      <div className="flex h-full items-center justify-center text-lg text-muted">Caricamento…</div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <UpdateBanner />
      <NowPlaying />
      <Tooltips />

      <header className="flex flex-wrap items-center gap-3 border-b-2 border-line bg-header px-4 py-2">
        <h1 className="text-2xl font-bold">
          Cosmo<span className="text-accent-text">Karaoke</span>
        </h1>
        <nav className="ml-2 flex flex-wrap gap-1.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => patch({ tab: t.id })}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm ${
                tab === t.id ? 'bg-accent text-on-accent' : 'text-text hover:bg-btn'
              }`}
            >
              <t.icon size={15} /> {t.label}
              {t.id === 'live' && livePendingCount > 0 && (
                <span className="ml-1 rounded-full bg-accent px-1.5 py-0.5 text-xs font-bold text-on-accent">
                  {livePendingCount}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="ml-auto flex flex-wrap gap-2">
          <AccessibilityMenu />
          <Btn
            variant={displayBlack ? 'danger' : 'default'}
            onClick={toggleBlack}
            disabled={!displayOpen}
          >
            Schermo nero
          </Btn>
          <Btn variant={displayOpen ? 'danger' : 'primary'} onClick={() => void toggleDisplay()}>
            {displayOpen ? <MonitorOff /> : <Monitor />}
            {displayOpen ? 'Chiudi schermo testi' : 'Apri schermo testi'}
          </Btn>
        </div>
      </header>

      <main className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 xl:grid-cols-[minmax(0,1fr)_minmax(24rem,30rem)] xl:overflow-hidden">
        <div className="min-h-[28rem] xl:min-h-0 xl:overflow-hidden">
          {tab === 'library' && <Library />}
          {tab === 'youtube' && <YouTube />}
          {tab === 'mixer' && <Mixer />}
          {tab === 'effects' && <Effetti />}
          {tab === 'live' && <LivePanel />}
          {tab === 'settings' && <Settings />}
        </div>
        <aside className="min-h-0 space-y-4 xl:overflow-y-auto xl:pr-2">
          <PlayerPanel />
          <Playlists />
        </aside>
      </main>

      {toast && (
        <div className="pointer-events-none fixed bottom-4 left-1/2 z-50 max-w-xl -translate-x-1/2 rounded-lg border-2 border-line bg-panel px-5 py-3 text-base font-medium shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  )
}
