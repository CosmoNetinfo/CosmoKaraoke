export type Format = 'cdg' | 'kar' | 'video' | 'audio'

export interface Song {
  id: string
  path: string
  title: string
  artist: string
  format: Format
  ext: string
  cdg: string | null
}

export interface QueueItem {
  uid: string
  song: Song
  singer: string
}

export interface YtItem {
  id: string
  title: string
  channel: string
  duration: number | null
}

export interface MonitorInfo {
  index: number
  name: string
  width: number
  height: number
  x: number
  y: number
}

export interface Jingle {
  id: string
  name: string
  path: string
}

export interface Settings {
  fadeSec: number
  downloadDir: string
  monitorIndex: number
  displayBg: string
  headphonesId: string
  eq: number[]
  pitch: number
  tempo: number
  vocalOff: boolean
  outputMono: boolean
  volume: number
  micOn: boolean
  micVol: number
  echo: number
  fontFamily: 'atkinson' | 'lexend' | 'opendyslexic' | 'sistema'
  theme: 'scuro' | 'crema' | 'contrasto'
  uiScale: number
  letterSpacing: number
  lineHeight: number
  displayTextScale: number
  displayStretch: boolean
}

/** Stato inviato dalla finestra di controllo allo schermo testi. */
export interface DisplayState {
  kind: 'idle' | 'cdg' | 'video' | 'audio'
  mediaUrl: string | null
  cdgUrl: string | null
  title: string
  artist: string
  singer: string
  next: string
  playing: boolean
  position: number
  duration: number
  tempo: number
  black: boolean
  bg: string
  textScale: number
  stretch: boolean
}

export interface DisplayMessage {
  text: string
  seconds: number
}
