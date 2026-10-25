/**
 * Decoder per i file CD+G (karaoke su CD).
 *
 * Ogni file è una sequenza di pacchetti da 24 byte, letti a 300 pacchetti al secondo:
 *  byte 0      comando (valore & 0x3F == 9 per i comandi grafici)
 *  byte 1      istruzione
 *  byte 2-3    parità Q
 *  byte 4-19   dati (16 byte)
 *  byte 20-23  parità P
 * Lo schermo è 300x216 pixel a 16 colori; l'area centrale 288x192 è quella "visibile",
 * il resto è il bordo.
 */
export const CDG_W = 300
export const CDG_H = 216
const PACKET_SIZE = 24
const PACKETS_PER_SECOND = 300
const BORDER_X = 6
const BORDER_Y = 12

const CMD_MEMORY_PRESET = 1
const CMD_BORDER_PRESET = 2
const CMD_TILE_NORMAL = 6
const CMD_SCROLL_PRESET = 20
const CMD_SCROLL_COPY = 24
const CMD_LOAD_LOW = 30
const CMD_LOAD_HIGH = 31
const CMD_TILE_XOR = 38

export class CdgDecoder {
  private data = new Uint8Array(0)
  private pos = 0
  private pixels = new Uint8Array(CDG_W * CDG_H)
  private palette = new Uint8Array(16 * 3)
  private border = 0
  private image = new ImageData(CDG_W, CDG_H)
  private dirty = true

  get loaded(): boolean {
    return this.data.length > 0
  }

  /** Durata approssimativa della grafica, in secondi. */
  get duration(): number {
    return this.data.length / PACKET_SIZE / PACKETS_PER_SECOND
  }

  load(buffer: ArrayBuffer): void {
    this.data = new Uint8Array(buffer)
    this.reset()
  }

  clear(): void {
    this.data = new Uint8Array(0)
    this.reset()
  }

  private reset(): void {
    this.pos = 0
    this.pixels.fill(0)
    this.palette.fill(0)
    this.border = 0
    this.dirty = true
  }

  /** Porta la grafica all'istante indicato (in secondi). Se si torna indietro, riparte da capo. */
  seek(seconds: number): void {
    if (!this.loaded) return
    const total = Math.floor(this.data.length / PACKET_SIZE)
    const target = Math.min(Math.max(0, Math.floor(seconds * PACKETS_PER_SECOND)), total)
    if (target < this.pos) this.reset()
    while (this.pos < target) {
      this.exec(this.pos)
      this.pos++
    }
  }

  private exec(index: number): void {
    const o = index * PACKET_SIZE
    const d = this.data
    if ((d[o] & 0x3f) !== 9) return
    const inst = d[o + 1] & 0x3f
    const p = o + 4 // inizio dei 16 byte di dati

    switch (inst) {
      case CMD_MEMORY_PRESET:
        this.pixels.fill(d[p] & 0x0f)
        this.dirty = true
        break
      case CMD_BORDER_PRESET:
        this.border = d[p] & 0x0f
        this.dirty = true
        break
      case CMD_TILE_NORMAL:
        this.tile(p, false)
        break
      case CMD_TILE_XOR:
        this.tile(p, true)
        break
      case CMD_SCROLL_PRESET:
        this.scroll(p, false)
        break
      case CMD_SCROLL_COPY:
        this.scroll(p, true)
        break
      case CMD_LOAD_LOW:
        this.loadPalette(p, 0)
        break
      case CMD_LOAD_HIGH:
        this.loadPalette(p, 8)
        break
      default:
        break // colore trasparente e altri comandi: ignorati
    }
  }

  private loadPalette(p: number, base: number): void {
    for (let i = 0; i < 8; i++) {
      const hi = this.data[p + i * 2] & 0x3f
      const lo = this.data[p + i * 2 + 1] & 0x3f
      const color = (hi << 6) | lo // 12 bit: RRRR GGGG BBBB
      const r = (color >> 8) & 0x0f
      const g = (color >> 4) & 0x0f
      const b = color & 0x0f
      const k = (base + i) * 3
      this.palette[k] = r * 17
      this.palette[k + 1] = g * 17
      this.palette[k + 2] = b * 17
    }
    this.dirty = true
  }

  private tile(p: number, xor: boolean): void {
    const d = this.data
    const color0 = d[p] & 0x0f
    const color1 = d[p + 1] & 0x0f
    const row = (d[p + 2] & 0x1f) * 12
    const col = (d[p + 3] & 0x3f) * 6
    for (let i = 0; i < 12; i++) {
      const bits = d[p + 4 + i] & 0x3f
      const y = row + i
      if (y >= CDG_H) continue
      for (let j = 0; j < 6; j++) {
        const x = col + j
        if (x >= CDG_W) continue
        const color = (bits >> (5 - j)) & 1 ? color1 : color0
        const idx = y * CDG_W + x
        this.pixels[idx] = xor ? this.pixels[idx] ^ color : color
      }
    }
    this.dirty = true
  }

  private scroll(p: number, copy: boolean): void {
    const d = this.data
    const color = d[p] & 0x0f
    const hCmd = (d[p + 1] & 0x30) >> 4
    const vCmd = (d[p + 2] & 0x30) >> 4
    const dx = hCmd === 1 ? 6 : hCmd === 2 ? -6 : 0
    const dy = vCmd === 1 ? 12 : vCmd === 2 ? -12 : 0
    if (dx === 0 && dy === 0) return

    const next = new Uint8Array(CDG_W * CDG_H)
    for (let y = 0; y < CDG_H; y++) {
      for (let x = 0; x < CDG_W; x++) {
        let sx = x - dx
        let sy = y - dy
        if (copy) {
          sx = (sx + CDG_W) % CDG_W
          sy = (sy + CDG_H) % CDG_H
          next[y * CDG_W + x] = this.pixels[sy * CDG_W + sx]
        } else if (sx < 0 || sx >= CDG_W || sy < 0 || sy >= CDG_H) {
          next[y * CDG_W + x] = color
        } else {
          next[y * CDG_W + x] = this.pixels[sy * CDG_W + sx]
        }
      }
    }
    this.pixels = next
    this.dirty = true
  }

  /** Disegna il fotogramma corrente sul canvas, solo se è cambiato. */
  render(ctx: CanvasRenderingContext2D): void {
    if (!this.dirty) return
    const out = this.image.data
    const pal = this.palette
    for (let y = 0; y < CDG_H; y++) {
      const inBorderY = y < BORDER_Y || y >= CDG_H - BORDER_Y
      for (let x = 0; x < CDG_W; x++) {
        const inBorder = inBorderY || x < BORDER_X || x >= CDG_W - BORDER_X
        const c = inBorder ? this.border : this.pixels[y * CDG_W + x]
        const k = c * 3
        const o = (y * CDG_W + x) * 4
        out[o] = pal[k]
        out[o + 1] = pal[k + 1]
        out[o + 2] = pal[k + 2]
        out[o + 3] = 255
      }
    }
    ctx.putImageData(this.image, 0, 0)
    this.dirty = false
  }
}
