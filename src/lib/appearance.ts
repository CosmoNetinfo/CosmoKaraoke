import type { Settings } from '../types'

export const FONT_OPTIONS: Array<{ id: Settings['fontFamily']; label: string; hint: string }> = [
  { id: 'atkinson', label: 'Atkinson Hyperlegible', hint: 'Lettere molto distinte, pensato per chi vede poco' },
  { id: 'lexend', label: 'Lexend', hint: 'Spaziatura pensata per facilitare la lettura' },
  { id: 'opendyslexic', label: 'OpenDyslexic', hint: 'Lettere con base pesante, per la dislessia' },
  { id: 'sistema', label: 'Carattere del computer', hint: 'Quello standard di Windows o Mac' },
]

export const THEME_OPTIONS: Array<{ id: Settings['theme']; label: string; bg: string; fg: string }> = [
  { id: 'scuro', label: 'Scuro', bg: '#0e1224', fg: '#f4f5fa' },
  { id: 'crema', label: 'Crema', bg: '#f6efd9', fg: '#1c180f' },
  { id: 'contrasto', label: 'Alto contrasto', bg: '#000000', fg: '#ffd400' },
]

/** Applica carattere, dimensioni e colori scelti alla finestra. */
export function applyAppearance(s: Settings): void {
  const root = document.documentElement
  root.dataset.theme = s.theme
  root.dataset.font = s.fontFamily
  root.style.setProperty('--ui-scale', String(s.uiScale))
  root.style.setProperty('--ls', `${s.letterSpacing}em`)
  root.style.setProperty('--lh', String(s.lineHeight))
}
