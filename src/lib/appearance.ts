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

function textOnColor(hex: string): string {
  const color = hex.replace('#', '')
  const rgb = color.length === 3
    ? color.split('').map((part) => parseInt(part + part, 16))
    : [0, 2, 4].map((offset) => parseInt(color.slice(offset, offset + 2), 16))
  const luminance = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000
  return luminance > 155 ? '#201a10' : '#ffffff'
}

/** Applica carattere, dimensioni e colori scelti alla finestra. */
export function applyAppearance(s: Settings): void {
  const root = document.documentElement
  root.dataset.theme = s.theme
  root.dataset.design = s.designMode
  root.dataset.font = s.fontFamily
  root.style.setProperty('--ui-scale', String(s.uiScale))
  root.style.setProperty('--ls', `${s.letterSpacing}em`)
  root.style.setProperty('--lh', String(s.lineHeight))

  const accent = s.designMode === 'professional' ? '#e4ad4d' : s.accentColor
  root.style.setProperty('--accent', accent)
  root.style.setProperty('--accent-hover', `color-mix(in srgb, ${accent} 82%, white)`)
  root.style.setProperty('--accent-text', s.designMode === 'professional' ? '#72d8c1' : accent)
  root.style.setProperty('--glow', `color-mix(in srgb, ${accent} 20%, transparent)`)
  if (s.designMode === 'professional') {
    root.style.setProperty('--on-accent', '#201a10')
  } else {
    root.style.setProperty('--on-accent', textOnColor(accent))
  }
}
