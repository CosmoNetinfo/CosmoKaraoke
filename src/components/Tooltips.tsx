import { useEffect, useRef, useState } from 'react'
import { hintForText } from '../lib/hints'
import { useStore } from '../lib/store'

interface Tip {
  text: string
  x: number
  y: number
}

const SELECTOR = 'button, label, select, summary, input, textarea, [data-tip]'

/** Testo da spiegare per un elemento: scritto a mano (data-tip), dal dizionario, o dal title. */
function tipFor(el: HTMLElement): string | null {
  const manual = el.getAttribute('data-tip')
  if (manual) return manual
  let text = ''
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    text = el.placeholder || el.closest('label')?.textContent || ''
  } else if (el instanceof HTMLSelectElement) {
    text = el.closest('label')?.textContent || el.options[0]?.textContent || ''
  } else {
    text = el.getAttribute('aria-label') || el.textContent || ''
  }
  return hintForText(text) ?? el.getAttribute('data-title')
}

/**
 * Fumetto di aiuto grande e leggibile: compare dopo un attimo che il mouse
 * (o la tastiera) si ferma su un comando. Sostituisce i piccoli suggerimenti del sistema.
 */
export function Tooltips() {
  const enabled = useStore((s) => s.settings.showHints)
  const [tip, setTip] = useState<Tip | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (!enabled) return
    const hide = () => {
      clearTimeout(timer.current)
      setTip(null)
    }
    const show = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return
      const el = target.closest<HTMLElement>(SELECTOR)
      if (!el) return hide()
      // i title nativi si spostano in data-title: così non compaiono due fumetti
      const t = el.getAttribute('title')
      if (t) {
        el.setAttribute('data-title', t)
        el.removeAttribute('title')
      }
      const text = tipFor(el)
      clearTimeout(timer.current)
      if (!text) return setTip(null)
      timer.current = setTimeout(() => {
        const r = el.getBoundingClientRect()
        setTip({ text, x: r.left + r.width / 2, y: r.bottom + 8 })
      }, 350)
    }
    const onOver = (e: MouseEvent) => show(e.target)
    const onFocus = (e: FocusEvent) => show(e.target)
    document.addEventListener('mouseover', onOver)
    document.addEventListener('focusin', onFocus)
    document.addEventListener('mousedown', hide)
    document.addEventListener('keydown', hide)
    document.addEventListener('scroll', hide, true)
    document.addEventListener('mouseleave', hide)
    return () => {
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('focusin', onFocus)
      document.removeEventListener('mousedown', hide)
      document.removeEventListener('keydown', hide)
      document.removeEventListener('scroll', hide, true)
      document.removeEventListener('mouseleave', hide)
      clearTimeout(timer.current)
    }
  }, [enabled])

  if (!enabled || !tip) return null

  const maxW = 24 * 16
  const left = Math.min(Math.max(tip.x - maxW / 2, 8), window.innerWidth - maxW - 8)
  const flip = tip.y > window.innerHeight - 140
  return (
    <div
      role="tooltip"
      style={{
        position: 'fixed',
        left,
        top: flip ? undefined : tip.y,
        bottom: flip ? window.innerHeight - tip.y + 40 : undefined,
        maxWidth: maxW,
        zIndex: 100,
        pointerEvents: 'none',
      }}
      className="rounded-xl border-2 border-accent bg-panel px-4 py-3 text-lg font-medium leading-snug text-text shadow-2xl"
    >
      {tip.text}
    </div>
  )
}
