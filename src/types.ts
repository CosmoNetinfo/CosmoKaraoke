export type Format = 'cdg' | 'kar' | 'video' | 'audio'

export interface Song {
  id: string
  path: string
  title: string
  artist: string
  format: Format
  ext: string
  cdg: string | null
  /** brano preso da YouTube: finché non è scaricato il file non c'è */
  ytId?: string
  yt?: 'downloading' | 'error'
}

export interface QueueItem {
  uid: string
  song: Song
  singer: string
  /** stacchetto musicale tra due brani: non è un brano da cantare */
  interlude?: boolean
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
  micInApp: boolean
  fxVolume: number
  showHints: boolean
  /** effetti interni nascosti dall'utente (id) */
  hiddenEffects: string[]
  interludeOn: boolean
  interludeEvery: number
  interludeRandom: boolean
  bgVolume: number
  bgAuto: boolean
  bgShuffle: boolean
  displayImage: string
  volume: number
  micOn: boolean
  micVol: number
  echo: number
  echoTime: number
  echoFb: number
  reverb: number
  reverbSize: number
  chorus: number
  micBass: number
  micTreble: number
  micComp: number
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
  kind: 'idle' | 'cdg' | 'video' | 'audio' | 'kar'
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
  bgImage: string | null
  textScale: number
  stretch: boolean
}

export interface DisplayMessage {
  text: string
  seconds: number
}
