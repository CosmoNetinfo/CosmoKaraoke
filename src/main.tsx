import { getCurrentWindow } from '@tauri-apps/api/window'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { Display } from './Display'
import './index.css'

const isDisplay = getCurrentWindow().label === 'display'

createRoot(document.getElementById('root')!).render(
  <StrictMode>{isDisplay ? <Display /> : <App />}</StrictMode>,
)
