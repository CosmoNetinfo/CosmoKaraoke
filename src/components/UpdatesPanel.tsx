import { getVersion } from '@tauri-apps/api/app'
import { invoke } from '@tauri-apps/api/core'
import { relaunch } from '@tauri-apps/plugin-process'
import { check, type Update } from '@tauri-apps/plugin-updater'
import { CheckCircle2, Download, Loader2, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useStore } from '../lib/store'
import { Btn, Panel } from './ui'

/** Pannello «Aggiornamenti»: versione, ricerca manuale, installazione. */
export function UpdatesPanel() {
  const notify = useStore((s) => s.notify)
  const [version, setVersion] = useState('')
  const [checking, setChecking] = useState(false)
  const [update, setUpdate] = useState<Update | null>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState('')

  useEffect(() => {
    getVersion()
      .then(setVersion)
      .catch(() => setVersion(''))
  }, [])

  const search = async () => {
    setChecking(true)
    setMessage('')
    setUpdate(null)
    try {
      const u = await check()
      if (u) {
        setUpdate(u)
        setMessage(`È disponibile la versione ${u.version}.`)
      } else {
        setMessage("Hai già l'ultima versione. Non c'è niente da aggiornare.")
      }
    } catch {
      setMessage('Non riesco a controllare. Verifica la connessione a internet e riprova tra poco.')
    } finally {
      setChecking(false)
    }
  }

  const install = async () => {
    if (!update) return
    setBusy(true)
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
      notify(`Aggiornamento non riuscito: ${String(e)}`)
      setBusy(false)
    }
  }

  return (
    <Panel title="Aggiornamenti del programma">
      <div className="space-y-3 text-base">
        <p>
          Versione installata: <b>{version || '—'}</b>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Btn onClick={() => void search()} disabled={checking || busy}>
            {checking ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            Cerca aggiornamenti
          </Btn>
          {update && (
            <Btn variant="primary" onClick={() => void install()} disabled={busy}>
              <Download />
              {busy ? `Aggiorno… ${progress}` : 'Aggiorna e riavvia'}
            </Btn>
          )}
        </div>
        {message && (
          <p className="flex items-center gap-2">
            {!update && message.startsWith('Hai') && <CheckCircle2 className="text-accent" />}
            {message}
          </p>
        )}
        <p className="text-muted">
          Il programma controlla da solo all'apertura e ogni 6 ore. Non si riavvia mai senza il tuo
          permesso.
        </p>
      </div>
    </Panel>
  )
}

/** Gestione di yt-dlp: versione installata e pulsante per scaricarlo o aggiornarlo. */
export function YtdlpPanel() {
  const notify = useStore((s) => s.notify)
  const [version, setVersion] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    invoke<string>('ytdlp_check')
      .then(setVersion)
      .catch(() => setVersion(null))
  }, [])

  const install = async () => {
    setBusy(true)
    try {
      const v = await invoke<string>('ytdlp_install')
      setVersion(v)
      notify(`yt-dlp pronto (versione ${v})`)
    } catch (e) {
      notify(String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 text-base">
      <span>
        yt-dlp: <b>{version ? `versione ${version}` : 'non installato'}</b>
      </span>
      <Btn variant={version ? 'default' : 'primary'} disabled={busy} onClick={() => void install()}>
        {busy ? <Loader2 className="animate-spin" /> : <Download />}
        {version ? 'Aggiorna yt-dlp' : 'Scarica yt-dlp'}
      </Btn>
    </div>
  )
}
