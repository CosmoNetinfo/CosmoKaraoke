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

export type Skin = {
  id: string
  name: string
  family: 'Standard' | 'Professionale' | 'Casa' | 'Premium'
  design: Settings['designMode']
  theme: Settings['theme']
  accent: string
  accentText: string
  colors: [string, string, string]
  surfaces: { bg: string; header: string; panel: string; row: string; rowHover: string; inset: string; btn: string; btnHover: string; line: string; text: string; muted: string }
}

export const SKINS: Skin[] = [
  { id: 'cosmo-night', name: 'Cosmo Notte', family: 'Standard', design: 'standard', theme: 'scuro', accent: '#547cf4', accentText: '#57c7ef', colors: ['#0c1220','#172033','#547cf4'], surfaces: { bg:'#0c1220',header:'#141d2d',panel:'#182235',row:'#202d42',rowHover:'#2a3a52',inset:'#0a101b',btn:'#26344a',btnHover:'#33445e',line:'#35445b',text:'#eff4fc',muted:'#aab8cc' } },
  { id: 'pearl-studio', name: 'Studio Perla', family: 'Standard', design: 'standard', theme: 'crema', accent: '#2863bd', accentText: '#28599b', colors: ['#e8edf2','#f8fafc','#2863bd'], surfaces: { bg:'#e9edf1',header:'#dfe5eb',panel:'#f7f9fb',row:'#edf1f5',rowHover:'#e0e7ee',inset:'#ffffff',btn:'#e0e6ed',btnHover:'#d1dbe5',line:'#b9c4d0',text:'#1e2934',muted:'#536273' } },
  { id: 'pro-broadcast', name: 'Broadcast Grafite', family: 'Professionale', design: 'professional', theme: 'scuro', accent: '#e5b04d', accentText: '#79e1cb', colors: ['#10161b','#1b252d','#e5b04d'], surfaces: { bg:'#10161b',header:'#182129',panel:'#202b34',row:'#283540',rowHover:'#344451',inset:'#0b1116',btn:'#2c3944',btnHover:'#3a4a56',line:'#4b5d69',text:'#ffffff',muted:'#d1dbe1' } },
  { id: 'pro-blueprint', name: 'Control Room Blu', family: 'Professionale', design: 'professional', theme: 'scuro', accent: '#58a6ff', accentText: '#c1e1ff', colors: ['#0d1a2a','#182b40','#58a6ff'], surfaces: { bg:'#0d1a2a',header:'#14263a',panel:'#1c3046',row:'#243b54',rowHover:'#304b66',inset:'#091522',btn:'#2a435d',btnHover:'#395674',line:'#42617e',text:'#ffffff',muted:'#d3deea' } },
  { id: 'home-lounge', name: 'Salotto', family: 'Casa', design: 'standard', theme: 'scuro', accent: '#b77a69', accentText: '#e9bca9', colors: ['#211917','#332522','#b77a69'], surfaces: { bg:'#211917',header:'#2b211f',panel:'#382b28',row:'#44332f',rowHover:'#543e39',inset:'#191312',btn:'#483632',btnHover:'#59423d',line:'#634b44',text:'#f7eee9',muted:'#c8b2a8' } },
  { id: 'home-party', name: 'Festa', family: 'Casa', design: 'standard', theme: 'scuro', accent: '#cf5799', accentText: '#71d8d0', colors: ['#1b1021','#2a1732','#cf5799'], surfaces: { bg:'#1b1021',header:'#24132b',panel:'#2d1a36',row:'#3a2145',rowHover:'#4a2a57',inset:'#140b19',btn:'#3c2546',btnHover:'#50315d',line:'#5b3b67',text:'#f8f0fb',muted:'#c4afcc' } },
  { id: 'home-daylight', name: 'Casa Chiara', family: 'Casa', design: 'standard', theme: 'crema', accent: '#3479b8', accentText: '#235d91', colors: ['#e6eff6','#f8fbff','#3479b8'], surfaces: { bg:'#e6eff6',header:'#d5e4ef',panel:'#f8fbff',row:'#eaf2f8',rowHover:'#dceaf4',inset:'#ffffff',btn:'#d8e7f2',btnHover:'#c7dbea',line:'#a5bdcf',text:'#172b3d',muted:'#405a70' } },
  { id: 'premium-stage', name: 'Stage Black', family: 'Premium', design: 'professional', theme: 'scuro', accent: '#d4af62', accentText: '#b7e9df', colors: ['#080b0e','#11181d','#d4af62'], surfaces: { bg:'#080b0e',header:'#10161b',panel:'#171f24',row:'#202a30',rowHover:'#2b373e',inset:'#05080a',btn:'#222d33',btnHover:'#303d44',line:'#46565e',text:'#ffffff',muted:'#d4dcdf' } },
]

export const CUSTOM_SKIN_ID = 'custom'
export function skinById(id: string): Skin | undefined { return SKINS.find((skin) => skin.id === id) }

function textOnColor(hex: string): string {
  const color = hex.replace('#', '')
  const rgb = color.length === 3
    ? color.split('').map((part) => parseInt(part + part, 16))
    : [0, 2, 4].map((offset) => parseInt(color.slice(offset, offset + 2), 16))
  const linear = rgb.map((channel) => {
    const value = channel / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  const luminance = 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]
  const whiteContrast = 1.05 / (luminance + 0.05)
  const darkContrast = (luminance + 0.05) / 0.05
  return darkContrast >= whiteContrast ? '#101820' : '#ffffff'
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

  const skin = skinById(s.skinId)
  if (skin) {
    root.dataset.skin = skin.id
    for (const [key, value] of Object.entries({ bg: skin.surfaces.bg, header: skin.surfaces.header, panel: skin.surfaces.panel, row: skin.surfaces.row, 'row-hover': skin.surfaces.rowHover, inset: skin.surfaces.inset, btn: skin.surfaces.btn, 'btn-hover': skin.surfaces.btnHover, line: skin.surfaces.line, text: skin.surfaces.text, muted: skin.surfaces.muted })) root.style.setProperty(`--${key}`, value)
  } else root.dataset.skin = 'custom'
  const accent = skin?.accent ?? s.accentColor
  root.style.setProperty('--accent', accent)
  root.style.setProperty('--accent-hover', `color-mix(in srgb, ${accent} 82%, white)`)
  root.style.setProperty('--accent-text', skin?.accentText ?? (s.designMode === 'professional' ? '#72d8c1' : accent))
  root.style.setProperty('--glow', `color-mix(in srgb, ${accent} 20%, transparent)`)
  if (textOnColor(accent) === '#201a10') {
    root.style.setProperty('--on-accent', '#201a10')
  } else {
    root.style.setProperty('--on-accent', textOnColor(accent))
  }
}
