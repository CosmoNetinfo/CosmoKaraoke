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
  { id: 'pro-broadcast', name: 'Broadcast', family: 'Professionale', design: 'professional', theme: 'scuro', accent: '#e5b04d', accentText: '#66d2b4', colors: ['#11171a','#1c2428','#e5b04d'], surfaces: { bg:'#11171a',header:'#192125',panel:'#20282c',row:'#252f33',rowHover:'#303d41',inset:'#101619',btn:'#303a3e',btnHover:'#3a474c',line:'#465358',text:'#eef2f1',muted:'#aeb9b7' } },
  { id: 'pro-blueprint', name: 'Control Room', family: 'Professionale', design: 'professional', theme: 'scuro', accent: '#4ea1ff', accentText: '#84d4ff', colors: ['#0d1724','#14263a','#4ea1ff'], surfaces: { bg:'#0d1724',header:'#122033',panel:'#192a3d',row:'#20364b',rowHover:'#2a435a',inset:'#09121d',btn:'#233a51',btnHover:'#304d68',line:'#36516b',text:'#f0f6fc',muted:'#a8bed2' } },
  { id: 'home-lounge', name: 'Salotto', family: 'Casa', design: 'standard', theme: 'scuro', accent: '#b77a69', accentText: '#e9bca9', colors: ['#211917','#332522','#b77a69'], surfaces: { bg:'#211917',header:'#2b211f',panel:'#382b28',row:'#44332f',rowHover:'#543e39',inset:'#191312',btn:'#483632',btnHover:'#59423d',line:'#634b44',text:'#f7eee9',muted:'#c8b2a8' } },
  { id: 'home-party', name: 'Festa', family: 'Casa', design: 'standard', theme: 'scuro', accent: '#cf5799', accentText: '#71d8d0', colors: ['#1b1021','#2a1732','#cf5799'], surfaces: { bg:'#1b1021',header:'#24132b',panel:'#2d1a36',row:'#3a2145',rowHover:'#4a2a57',inset:'#140b19',btn:'#3c2546',btnHover:'#50315d',line:'#5b3b67',text:'#f8f0fb',muted:'#c4afcc' } },
  { id: 'premium-stage', name: 'Stage Black', family: 'Premium', design: 'professional', theme: 'scuro', accent: '#d4af62', accentText: '#a9dbd1', colors: ['#090c0d','#131819','#d4af62'], surfaces: { bg:'#090c0d',header:'#111617',panel:'#191f20',row:'#202727',rowHover:'#2b3433',inset:'#080b0c',btn:'#252d2d',btnHover:'#343e3d',line:'#3c4947',text:'#f4f2ec',muted:'#b5b6ae' } },
]

export const CUSTOM_SKIN_ID = 'custom'
export function skinById(id: string): Skin | undefined { return SKINS.find((skin) => skin.id === id) }

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
