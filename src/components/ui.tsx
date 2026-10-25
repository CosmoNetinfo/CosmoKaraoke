import type { ButtonHTMLAttributes, ReactNode } from 'react'

export function fmtTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function Btn({
  children,
  className = '',
  variant = 'default',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: 'default' | 'primary' | 'danger' | 'ghost'
}) {
  const styles = {
    default: 'bg-btn hover:bg-btn-hover text-text border border-line',
    primary: 'bg-accent hover:bg-accent-hover text-on-accent border border-transparent',
    danger: 'bg-danger hover:bg-danger-hover text-on-danger border border-transparent',
    ghost: 'bg-transparent hover:bg-btn text-text border border-transparent',
  }[variant]
  return (
    <button
      aria-label={rest['aria-label'] ?? rest.title}
      {...rest}
      className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-base font-medium disabled:cursor-not-allowed disabled:opacity-40 ${styles} ${className}`}
    >
      {children}
    </button>
  )
}

export function Panel({
  title,
  children,
  right,
  className = '',
}: {
  title?: string
  children: ReactNode
  right?: ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-xl border border-line bg-panel shadow-sm ${className}`}>
      {title && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2.5">
          <h2 className="text-lg font-bold text-text">{title}</h2>
          {right}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  )
}

export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  display: string
}) {
  return (
    <label className="flex flex-wrap items-center gap-x-3 gap-y-1 text-base">
      <span className="w-40 shrink-0 font-medium text-text">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-8 min-w-32 flex-1"
      />
      <span className="w-16 text-right font-bold tabular-nums text-text">{display}</span>
    </label>
  )
}
