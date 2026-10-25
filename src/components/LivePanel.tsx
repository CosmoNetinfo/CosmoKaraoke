import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { open as openUrl } from '@tauri-apps/plugin-shell'
import {
  Check,
  Copy,
  ExternalLink,
  MessageSquare,
  Music,
  Power,
  QrCode,
  Settings as SettingsIcon,
  ShieldAlert,
  Star,
  Trash2,
  Tv,
  X,
} from 'lucide-react'
import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import { sendDisplayMessage } from '../lib/player'
import { useStore } from '../lib/store'
import { queueYoutube } from '../lib/youtube'
import type {
  LiveBookingRequest,
  LiveConfig,
  LiveMessage,
  LiveServerInfo,
  LiveSingerScore,
  Song,
} from '../types'
import { Btn } from './ui'

type LiveSubTab = 'qr' | 'bookings' | 'messages' | 'votes' | 'rules'

export function LivePanel() {
  const notify = useStore((s) => s.notify)
  const songs = useStore((s) => s.songs)
  const enqueue = useStore((s) => s.enqueue)
  const livePendingCount = useStore((s) => s.livePendingCount)
  const liveMessageCount = useStore((s) => s.liveMessageCount)
  const patch = useStore((s) => s.patch)

  const [subTab, setSubTab] = useState<LiveSubTab>('qr')
  const [info, setInfo] = useState<LiveServerInfo | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [pendingBookings, setPendingBookings] = useState<LiveBookingRequest[]>([])
  const [messages, setMessages] = useState<LiveMessage[]>([])
  const [scores, setScores] = useState<LiveSingerScore[]>([])

  // Form config
  const [roomName, setRoomName] = useState('CosmoKaraoke Live')
  const [port, setPort] = useState(5555)
  const [pin, setPin] = useState('')
  const [allowBookings, setAllowBookings] = useState(true)
  const [autoApprove, setAutoApprove] = useState(false)
  const [maxPerSinger, setMaxPerSinger] = useState(3)
  const [blockedWords, setBlockedWords] = useState('')

  const refreshAll = async () => {
    try {
      const serverInfo = await invoke<LiveServerInfo>('get_live_server_info')
      setInfo(serverInfo)
      setRoomName(serverInfo.config.roomName)
      setPort(serverInfo.port)
      setPin(serverInfo.config.pin ?? '')
      setAllowBookings(serverInfo.config.allowBookings)
      setAutoApprove(serverInfo.config.autoApprove)
      setMaxPerSinger(serverInfo.config.maxPerSinger)
      setBlockedWords(serverInfo.config.blockedWords.join(', '))

      if (serverInfo.running && serverInfo.url) {
        const dataUrl = await QRCode.toDataURL(serverInfo.url, {
          width: 320,
          margin: 1,
          color: { dark: '#000000', light: '#ffffff' },
        })
        setQrDataUrl(dataUrl)
      } else {
        setQrDataUrl('')
      }

      const pending = await invoke<LiveBookingRequest[]>('get_live_pending_bookings')
      setPendingBookings(pending)
      patch({ livePendingCount: pending.length })

      const msgs = await invoke<LiveMessage[]>('get_live_messages')
      setMessages(msgs)
      patch({ liveMessageCount: msgs.length })

      const sc = await invoke<LiveSingerScore[]>('get_live_scores')
      setScores(sc)
    } catch {
      /* browser testing mock fallback */
    }
  }

  useEffect(() => {
    void refreshAll()

    let alive = true
    const unlisteners: Array<() => void> = []

    const setupListeners = async () => {
      try {
        const u1 = await listen<LiveBookingRequest>('live:new_pending_booking', (ev) => {
          if (!alive) return
          setPendingBookings((prev) => [ev.payload, ...prev])
          notify(`Richiesta da ${ev.payload.singer}: ${ev.payload.title}`)
          patch({ livePendingCount: (useStore.getState().livePendingCount || 0) + 1 })
        })
        const u2 = await listen<LiveBookingRequest>('live:auto_booking', (ev) => {
          if (!alive) return
          const req = ev.payload
          if (req.format === 'youtube') {
            queueYoutube(
              { id: req.songId, title: req.title, channel: req.artist, duration: null },
              'A',
              req.singer,
            )
          } else {
            const found = songs.find((s) => s.id === req.songId)
            if (found) {
              enqueue(found, 'A', req.singer)
            } else {
              const fallbackSong: Song = {
                id: req.songId,
                path: req.songId,
                title: req.title,
                artist: req.artist,
                format: 'cdg',
                ext: 'mp3',
                cdg: null,
              }
              enqueue(fallbackSong, 'A', req.singer)
            }
          }
          notify(`Nuova prenotazione (automatica) da ${req.singer}: ${req.title}`)
        })
        const u3 = await listen<LiveMessage>('live:new_message', (ev) => {
          if (!alive) return
          setMessages((prev) => [ev.payload, ...prev])
          notify(`Nuova dedica da ${ev.payload.singer}: "${ev.payload.text}"`)
          patch({ liveMessageCount: (useStore.getState().liveMessageCount || 0) + 1 })
        })
        const u4 = await listen('live:new_vote', () => {
          if (!alive) return
          void invoke<LiveSingerScore[]>('get_live_scores')
            .then(setScores)
            .catch(() => {})
        })
        unlisteners.push(u1, u2, u3, u4)
      } catch {
        /* browser mock fallback */
      }
    }

    void setupListeners()

    return () => {
      alive = false
      unlisteners.forEach((u) => u())
    }
  }, [enqueue, notify, patch, songs])

  const toggleServer = async () => {
    try {
      if (info?.running) {
        await invoke('stop_live_server')
        notify('Server Live spento')
      } else {
        const res = await invoke<LiveServerInfo>('start_live_server', { port: Number(port) })
        notify(`Server Live avviato: ${res.url}`)
      }
      await refreshAll()
    } catch (e) {
      notify(`Errore avvio server: ${String(e)}`)
    }
  }

  const saveConfig = async () => {
    try {
      const cfg: LiveConfig = {
        port: Number(port),
        pin: pin.trim() ? pin.trim() : null,
        roomName: roomName.trim() || 'CosmoKaraoke Live',
        allowBookings,
        autoApprove,
        maxPerSinger: Number(maxPerSinger) || 3,
        blockedWords: blockedWords
          .split(',')
          .map((w) => w.trim())
          .filter(Boolean),
      }
      await invoke('update_live_config', { config: cfg })
      notify('Impostazioni Live salvate')
      await refreshAll()
    } catch (e) {
      notify(`Errore salvataggio: ${String(e)}`)
    }
  }

  const copyUrl = () => {
    if (info?.url) {
      navigator.clipboard.writeText(info.url).then(
        () => notify('Indirizzo copiato negli appunti!'),
        () => notify(`Indirizzo: ${info.url}`),
      )
    }
  }

  const openInBrowser = async () => {
    if (info?.url) {
      try {
        await openUrl(info.url)
      } catch {
        window.open(info.url, '_blank')
      }
    }
  }

  const handleApprove = async (req: LiveBookingRequest, to: 'A' | 'B') => {
    try {
      await invoke('approve_booking', { id: req.id })
      setPendingBookings((prev) => prev.filter((b) => b.id !== req.id))
      patch({ livePendingCount: Math.max(0, livePendingCount - 1) })

      if (req.format === 'youtube') {
        queueYoutube(
          { id: req.songId, title: req.title, channel: req.artist, duration: null },
          to,
          req.singer,
        )
      } else {
        const found = songs.find((s) => s.id === req.songId)
        if (found) {
          enqueue(found, to, req.singer)
        } else {
          const fallbackSong: Song = {
            id: req.songId,
            path: req.songId,
            title: req.title,
            artist: req.artist,
            format: 'cdg',
            ext: 'mp3',
            cdg: null,
          }
          enqueue(fallbackSong, to, req.singer)
        }
      }
      notify(`Prenotazione di ${req.singer} aggiunta in ${to === 'A' ? 'scaletta' : 'riserva'}`)
    } catch (e) {
      notify(`Errore approvazione: ${String(e)}`)
    }
  }

  const handleReject = async (id: string) => {
    try {
      await invoke('reject_booking', { id })
      setPendingBookings((prev) => prev.filter((b) => b.id !== id))
      patch({ livePendingCount: Math.max(0, livePendingCount - 1) })
      notify('Prenotazione rifiutata')
    } catch (e) {
      notify(`Errore rifiuto: ${String(e)}`)
    }
  }

  const handleSendTv = (msg: LiveMessage) => {
    sendDisplayMessage(`${msg.singer}: ${msg.text}`, 10)
    notify(`Messaggio di ${msg.singer} inviato sullo schermo TV per 10 secondi`)
  }

  const handleDeleteMsg = async (id: string) => {
    try {
      await invoke('delete_live_message', { id })
      setMessages((prev) => prev.filter((m) => m.id !== id))
      patch({ liveMessageCount: Math.max(0, liveMessageCount - 1) })
      notify('Messaggio eliminato')
    } catch (e) {
      notify(`Errore eliminazione: ${String(e)}`)
    }
  }

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Intestazione e stato del server */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-panel p-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-full ${
              info?.running ? 'bg-success/20 text-success' : 'bg-panel-muted text-muted'
            }`}
          >
            <Power className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">
                {info?.running ? 'Server Live attivo' : 'Server Live spento'}
              </span>
              <span
                className={`inline-block h-3 w-3 rounded-full ${
                  info?.running ? 'bg-success' : 'bg-muted'
                }`}
              />
            </div>
            <div className="text-sm text-muted">
              {info?.running
                ? `${info.url} · ${info.ip}`
                : 'Accendi il server per permettere le prenotazioni dal cellulare'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Btn
            onClick={toggleServer}
            variant={info?.running ? 'danger' : 'primary'}
            className="min-h-[2.75rem] px-5"
          >
            <Power className="mr-2 h-5 w-5" />
            {info?.running ? 'Spegni server' : 'Accendi server'}
          </Btn>
        </div>
      </div>

      {/* Barra sottomenu */}
      <div className="flex gap-1 border-b border-border bg-panel px-2 pt-1">
        <button
          onClick={() => setSubTab('qr')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2 font-bold ${
            subTab === 'qr'
              ? 'border-accent text-accent'
              : 'border-transparent text-muted hover:text-text'
          }`}
        >
          <QrCode className="h-5 w-5" />
          <span>QR Code e Link</span>
        </button>

        <button
          onClick={() => setSubTab('bookings')}
          className={`relative flex items-center gap-2 border-b-2 px-4 py-2 font-bold ${
            subTab === 'bookings'
              ? 'border-accent text-accent'
              : 'border-transparent text-muted hover:text-text'
          }`}
        >
          <Music className="h-5 w-5" />
          <span>Prenotazioni</span>
          {pendingBookings.length > 0 && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-on-accent">
              {pendingBookings.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setSubTab('messages')}
          className={`relative flex items-center gap-2 border-b-2 px-4 py-2 font-bold ${
            subTab === 'messages'
              ? 'border-accent text-accent'
              : 'border-transparent text-muted hover:text-text'
          }`}
        >
          <MessageSquare className="h-5 w-5" />
          <span>Dediche e messaggi</span>
          {messages.length > 0 && (
            <span className="rounded-full bg-panel-muted px-2 py-0.5 text-xs font-bold text-text">
              {messages.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setSubTab('votes')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2 font-bold ${
            subTab === 'votes'
              ? 'border-accent text-accent'
              : 'border-transparent text-muted hover:text-text'
          }`}
        >
          <Star className="h-5 w-5" />
          <span>Classifica voti</span>
        </button>

        <button
          onClick={() => setSubTab('rules')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2 font-bold ${
            subTab === 'rules'
              ? 'border-accent text-accent'
              : 'border-transparent text-muted hover:text-text'
          }`}
        >
          <SettingsIcon className="h-5 w-5" />
          <span>Regole e filtri</span>
        </button>
      </div>

      {/* Contenuto sottoschede */}
      <div className="flex-1 overflow-y-auto">
        {/* SUBTAB 1: QR CODE */}
        {subTab === 'qr' && (
          <div className="flex flex-col gap-4">
            {info?.running ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col items-center justify-center rounded-lg bg-panel p-5 text-center">
                  <div className="text-base font-bold text-muted">
                    Inquadra con la fotocamera del telefono:
                  </div>
                  {qrDataUrl ? (
                    <div className="my-3 rounded-lg bg-white p-3 shadow-md">
                      <img src={qrDataUrl} alt="QR Code" className="h-56 w-56 object-contain" />
                    </div>
                  ) : (
                    <div className="my-6 text-muted">Generazione codice QR...</div>
                  )}
                  <div className="text-xl font-extrabold text-accent">{info.url}</div>
                  <div className="mt-1 text-sm text-muted">
                    Funziona su tutti gli smartphone collegati allo stesso Wi-Fi. Nessuna app da
                    installare.
                  </div>
                </div>

                <div className="flex flex-col justify-between gap-3 rounded-lg bg-panel p-5">
                  <div>
                    <h3 className="text-lg font-bold">Accesso veloce e controlli</h3>
                    <p className="mt-1 text-sm text-muted">
                      Condividi l&apos;indirizzo o aprilo per testare l&apos;interfaccia mobile.
                    </p>

                    <div className="mt-4 flex flex-col gap-2">
                      <Btn onClick={copyUrl} variant="default" className="justify-start">
                        <Copy className="mr-2 h-5 w-5" />
                        Copia indirizzo del server
                      </Btn>

                      <Btn onClick={openInBrowser} variant="default" className="justify-start">
                        <ExternalLink className="mr-2 h-5 w-5" />
                        Apri interfaccia mobile nel browser
                      </Btn>
                    </div>

                    <div className="mt-6 rounded border border-border bg-panel-muted p-3">
                      <div className="text-sm font-bold text-text">Dettagli di sala</div>
                      <div className="mt-1 flex justify-between text-sm">
                        <span className="text-muted">Nome locale:</span>
                        <span className="font-semibold">{info.config.roomName}</span>
                      </div>
                      <div className="mt-1 flex justify-between text-sm">
                        <span className="text-muted">PIN di sicurezza:</span>
                        <span className="font-semibold">{info.config.pin || 'Nessuno (libero)'}</span>
                      </div>
                      <div className="mt-1 flex justify-between text-sm">
                        <span className="text-muted">Stato prenotazioni:</span>
                        <span className="font-semibold text-accent">
                          {info.config.allowBookings ? 'Aperte' : 'Chiuse'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg bg-panel p-10 text-center">
                <QrCode className="h-16 w-16 text-muted" />
                <h3 className="mt-3 text-xl font-bold">Il server Live non è ancora attivo</h3>
                <p className="mt-1 max-w-md text-muted">
                  Premi il pulsante «Accendi server» in alto a destra per creare il punto di accesso
                  Wi-Fi e visualizzare il codice QR per gli ospiti del locale.
                </p>
                <div className="mt-4">
                  <Btn onClick={toggleServer} variant="primary">
                    <Power className="mr-2 h-5 w-5" />
                    Accendi server adesso
                  </Btn>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SUBTAB 2: PRENOTAZIONI */}
        {subTab === 'bookings' && (
          <div className="flex flex-col gap-3">
            {pendingBookings.length === 0 ? (
              <div className="rounded-lg bg-panel p-8 text-center text-muted">
                <Music className="mx-auto h-12 w-12 opacity-50" />
                <div className="mt-2 text-lg font-bold text-text">
                  Nessuna prenotazione in attesa
                </div>
                <div className="mt-1 text-sm">
                  Quando un ospite prenota un brano dal proprio telefono, la richiesta apparirà qui.
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm text-muted">
                  <span>{pendingBookings.length} richieste in attesa di approvazione:</span>
                </div>
                {pendingBookings.map((b) => (
                  <div
                    key={b.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-panel p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-extrabold text-accent">{b.singer}</span>
                        {b.format === 'youtube' && (
                          <span className="rounded bg-red-600 px-1.5 py-0.5 text-xs font-bold text-white uppercase">
                            YouTube
                          </span>
                        )}
                        <span className="text-xs text-muted">
                          {new Date(b.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="text-lg font-bold text-text">
                        {b.title} <span className="font-normal text-muted">· {b.artist}</span>
                      </div>
                      {b.note && (
                        <div className="mt-1 text-sm italic text-muted">
                          Nota: &laquo;{b.note}&raquo;
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Btn
                        onClick={() => void handleApprove(b, 'A')}
                        variant="primary"
                        className="px-3 text-sm"
                      >
                        <Check className="mr-1 h-4 w-4" />
                        In scaletta
                      </Btn>

                      <Btn
                        onClick={() => void handleApprove(b, 'B')}
                        variant="default"
                        className="px-3 text-sm"
                      >
                        <Check className="mr-1 h-4 w-4" />
                        In riserva
                      </Btn>

                      <Btn
                        onClick={() => void handleReject(b.id)}
                        variant="danger"
                        className="px-3 text-sm"
                      >
                        <X className="mr-1 h-4 w-4" />
                        Rifiuta
                      </Btn>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SUBTAB 3: MESSAGGI */}
        {subTab === 'messages' && (
          <div className="flex flex-col gap-3">
            {messages.length === 0 ? (
              <div className="rounded-lg bg-panel p-8 text-center text-muted">
                <MessageSquare className="mx-auto h-12 w-12 opacity-50" />
                <div className="mt-2 text-lg font-bold text-text">Nessun messaggio ricevuto</div>
                <div className="mt-1 text-sm">
                  Le dediche e i messaggi inviati dagli ospiti dal proprio cellulare appariranno qui.
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm text-muted">
                  <span>{messages.length} dediche inviate dagli ospiti:</span>
                </div>
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-panel p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-accent">{m.singer}</span>
                        <span className="text-xs text-muted">
                          {new Date(m.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="mt-1 text-base text-text">&laquo;{m.text}&raquo;</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Btn
                        onClick={() => handleSendTv(m)}
                        variant="default"
                        className="px-3 text-sm"
                      >
                        <Tv className="mr-1.5 h-4 w-4" />
                        Mostra sulla TV
                      </Btn>

                      <Btn
                        onClick={() => void handleDeleteMsg(m.id)}
                        variant="danger"
                        className="px-3 text-sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Btn>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SUBTAB 4: VOTI */}
        {subTab === 'votes' && (
          <div className="flex flex-col gap-3">
            {scores.length === 0 ? (
              <div className="rounded-lg bg-panel p-8 text-center text-muted">
                <Star className="mx-auto h-12 w-12 opacity-50" />
                <div className="mt-2 text-lg font-bold text-text">Nessun voto registrato</div>
                <div className="mt-1 text-sm">
                  I voti assegnati dal pubblico (da 1 a 5 stelle) per i cantanti durante le
                  esibizioni compariranno qui.
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="text-sm font-semibold text-muted">
                  Classifica dei cantanti più votati dal pubblico:
                </div>
                {scores.map((sc, index) => (
                  <div
                    key={sc.singer}
                    className="flex items-center justify-between rounded-lg border border-border bg-panel p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full font-bold ${
                          index === 0
                            ? 'bg-amber-400 text-slate-900'
                            : index === 1
                              ? 'bg-slate-300 text-slate-900'
                              : index === 2
                                ? 'bg-amber-700 text-white'
                                : 'bg-panel-muted text-muted'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span className="text-lg font-bold text-text">{sc.singer}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center text-amber-400">
                        <Star className="mr-1 h-5 w-5 fill-current" />
                        <span className="text-lg font-extrabold">{sc.average.toFixed(1)}</span>
                        <span className="text-sm text-muted">/5</span>
                      </div>
                      <span className="text-xs text-muted">({sc.count} voti)</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SUBTAB 5: REGOLE E FILTRI */}
        {subTab === 'rules' && (
          <div className="flex flex-col gap-4 rounded-lg bg-panel p-5">
            <h3 className="text-lg font-bold">Impostazioni e sicurezza della sala</h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-bold text-muted">Nome sala / evento:</label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="mt-1 w-full rounded border border-border bg-bg px-3 py-2 text-text"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-muted">Porta di rete:</label>
                <input
                  type="number"
                  value={port}
                  onChange={(e) => setPort(Number(e.target.value))}
                  className="mt-1 w-full rounded border border-border bg-bg px-3 py-2 text-text"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-muted">
                  PIN di sala (opzionale, vuoto = libero):
                </label>
                <input
                  type="text"
                  value={pin}
                  placeholder="Es. 1234"
                  onChange={(e) => setPin(e.target.value)}
                  className="mt-1 w-full rounded border border-border bg-bg px-3 py-2 text-text"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-muted">
                  Limite prenotazioni per cantante:
                </label>
                <input
                  type="number"
                  value={maxPerSinger}
                  min={1}
                  max={20}
                  onChange={(e) => setMaxPerSinger(Number(e.target.value))}
                  className="mt-1 w-full rounded border border-border bg-bg px-3 py-2 text-text"
                />
              </div>
            </div>

            <div className="mt-2 flex flex-col gap-3 border-t border-border pt-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={allowBookings}
                  onChange={(e) => setAllowBookings(e.target.checked)}
                  className="h-5 w-5 accent-accent"
                />
                <span className="font-bold text-text">
                  Consenti nuove prenotazioni dal cellulare
                </span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={autoApprove}
                  onChange={(e) => setAutoApprove(e.target.checked)}
                  className="h-5 w-5 accent-accent"
                />
                <span className="font-bold text-text">
                  Accetta automaticamente (inserisce direttamente in fondo alla scaletta)
                </span>
              </label>
            </div>

            <div className="mt-2 border-t border-border pt-4">
              <label className="block text-sm font-bold text-muted">
                <ShieldAlert className="mr-1 inline h-4 w-4 text-accent" />
                Filtro parole vietate nelle dediche (separate da virgola):
              </label>
              <textarea
                value={blockedWords}
                onChange={(e) => setBlockedWords(e.target.value)}
                placeholder="parolaccia1, insulto2..."
                rows={2}
                className="mt-1 w-full rounded border border-border bg-bg px-3 py-2 text-text"
              />
            </div>

            <div className="mt-2 flex justify-end">
              <Btn onClick={saveConfig} variant="primary">
                Salva regole
              </Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
