import type { ReactNode } from 'react'
import './journey.css'

export function JourneyPage({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return <div className={`jr mx-auto min-h-[80vh] px-4 py-8 ${wide ? 'max-w-5xl' : 'max-w-2xl'}`}>{children}</div>
}

export function GradientCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`from-cyan via-violet to-amber h-full rounded-2xl bg-gradient-to-r p-[1.5px] ${className}`}>
      <div className="bg-void h-full rounded-2xl p-6 sm:p-8">{children}</div>
    </div>
  )
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-cyan/60 mb-2 font-mono text-xs tracking-widest">{children}</p>
}

export function Pips({ value, max = 5, label }: { value: number; max?: number; label?: string }) {
  return (
    <span className="inline-flex items-center gap-1" role="img" aria-label={label ?? `Difficulty ${value} of ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={`h-2 w-2 rounded-full ${i < value ? 'bg-amber' : 'bg-white/10'}`} />
      ))}
    </span>
  )
}

export function Ring({ value, size = 120, label }: { value: number; size?: number; label: string }) {
  const r = size / 2 - 8
  const c = 2 * Math.PI * r
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="8" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#2de2e6"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * value) / 100}
          style={{ transition: 'stroke-dashoffset 1.2s ease-out', filter: 'drop-shadow(0 0 6px #2de2e6)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl font-bold text-white">{value}</span>
        <span className="text-fog/50 font-mono text-[10px] uppercase tracking-widest">{label}</span>
      </div>
    </div>
  )
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
      <span>{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="text-cyan font-mono text-xs underline">
          RETRY
        </button>
      )}
    </div>
  )
}

export function Loading({ text = 'Loading your journey...' }: { text?: string }) {
  return <div className="text-cyan flex min-h-[50vh] animate-pulse items-center justify-center font-mono text-sm">{text}</div>
}

export const primaryBtn =
  'from-cyan to-violet text-void font-display rounded-lg bg-gradient-to-r px-6 py-2.5 font-bold transition hover:shadow-[0_0_20px_rgba(45,226,230,0.5)] disabled:cursor-not-allowed disabled:opacity-40'
export const ghostBtn =
  'border-panel-border text-fog/80 hover:border-cyan/40 hover:text-white rounded-lg border px-5 py-2.5 font-mono text-sm transition disabled:opacity-40'
