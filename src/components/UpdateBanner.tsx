import { relaunch } from '@tauri-apps/plugin-process'
import { check, type Update } from '@tauri-apps/plugin-updater'
import { Download, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Btn } from './ui'

const SIX_HOURS = 6 * 60 * 60 * 1000

/** Controlla gli aggiornamenti all'avvio e ogni 6 ore. Non riavvia mai da solo. */
export function UpdateBanner() {
  const [update, setUpdate] = useState<Update | null>(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    const run = async () => {
      try {
        const u = await check()
        if (alive && u) setUpdate(u)
      } catch {
        /* nessuna rete o nessun rilascio ancora pubblicato: nessun avviso */
      }
    }
    void run()
    const t = setInterval(() => void run(), SIX_HOURS)
    return () => {
      alive = false
      clearInterval(t)
    }
  }, [])

  if (!update) return null

  const install = async () => {
    setBusy(true)
    setError('')
    try {
      let total = 0
      let done = 0
      await update.downloadAndInstall((ev) => {
        if (ev.event === 'Started') total = ev.data.contentLength ?? 0
        if (ev.event === 'Progress') {
          done += ev.data.chunkLength
          setProgress(total > 0 ? `${Math.round((done / total) * 100)}%` : '')
        }
      })
      await relaunch()
    } catch (e) {
      setError(`Aggiornamento non riuscito: ${String(e)}`)
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-3 bg-accent/25 px-4 py-2 text-base">
      <Download />
      <span className="flex-1">
        È disponibile la versione <b>{update.version}</b>. Aggiorna quando hai finito di cantare.
        {error && <span className="ml-2 text-danger">{error}</span>}
      </span>
      <Btn variant="primary" disabled={busy} onClick={() => void install()}>
        <RefreshCw className={busy ? 'animate-spin' : ''} />
        {busy ? `Aggiorno… ${progress}` : 'Aggiorna e riavvia'}
      </Btn>
    </div>
  )
}
