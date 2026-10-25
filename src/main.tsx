import { getCurrentWindow } from '@tauri-apps/api/window'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { Display } from './Display'
import './index.css'

let isDisplay = false
try {
  isDisplay = getCurrentWindow().label === 'display'
} catch {
  isDisplay = false
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>{isDisplay ? <Display /> : <App />}</StrictMode>,
)
