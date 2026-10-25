import { mockIPC, mockWindows } from '@tauri-apps/api/mocks'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { Display } from './Display'
import './index.css'

if (typeof window !== 'undefined' && !('__TAURI_INTERNALS__' in window)) {
  mockWindows('main')
  mockIPC(
    (cmd) => {
      if (cmd === 'load_blob') return null
      if (cmd === 'load_library') return []
      if (cmd === 'get_live_server_info') {
        return {
          running: false,
          ip: '127.0.0.1',
          port: 5555,
          url: 'http://127.0.0.1:5555',
          config: {
            port: 5555,
            pin: null,
            roomName: 'CosmoKaraoke Live',
            allowBookings: true,
            autoApprove: false,
            maxPerSinger: 3,
            blockedWords: [],
          },
          pendingCount: 0,
          messageCount: 0,
        }
      }
      if (cmd === 'get_live_pending_bookings') return []
      if (cmd === 'get_live_messages') return []
      if (cmd === 'get_live_scores') return []
      return null
    },
    { shouldMockEvents: true },
  )
}

let isDisplay = false
try {
  isDisplay = getCurrentWindow().label === 'display'
} catch {
  isDisplay = false
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>{isDisplay ? <Display /> : <App />}</StrictMode>,
)
