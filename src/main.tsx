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
