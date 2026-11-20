import type { ReactNode } from 'react'
import './auth.css'
import { authLabel } from './authStyles'

const BOOT = ['> securing connection...', '> loading arena modules...', '> awaiting player...']
const PERKS = [
  ['🎮', 'Learn DSA by playing', 'Interactive Breach games for every topic'],
  ['🗺️', 'A roadmap built for you', 'Based on your level, goal and daily time'],
  ['📈', 'Progress that is real', 'Only quizzes, games and practice move it'],
]

type ShellProps = { eyebrow: string; title: string; subtitle: string; children: ReactNode; footer: ReactNode }

/** Shared two-panel layout for Login and Signup. The form side stays plain and readable. */
export default function AuthShell({ eyebrow, title, subtitle, children, footer }: ShellProps) {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-10">
      <div className="au-card from-cyan/70 via-violet/60 to-amber/60 grid w-full max-w-4xl rounded-2xl bg-gradient-to-br p-[1.5px] md:grid-cols-[1fr_1.1fr]">
        <aside className="au-scan bg-panel relative hidden overflow-hidden rounded-l-2xl p-8 md:block" aria-hidden="true">
          <div className="bg-cyan/10 absolute -bottom-24 -left-16 h-64 w-64 rounded-full blur-3xl" />
          <p className="text-cyan/70 mb-6 font-mono text-xs">{'// arena.access'}</p>
          <h2 className="font-display mb-2 text-3xl leading-tight font-bold text-white">
            Enter the <span className="text-cyan">Arena</span>
          </h2>
          <p className="text-fog/60 mb-6 text-sm">Learn Data Structures and Algorithms the way you learn a game: one level at a time.</p>
          <div className="text-fog/50 mb-8 space-y-1 font-mono text-xs">
            {BOOT.map((l, i) => (
              <p key={l} className="au-line" style={{ animationDelay: `${0.3 + i * 0.35}s` }}>{l}</p>
            ))}
          </div>
          <ul className="relative space-y-4">
            {PERKS.map(([icon, t, d], i) => (
              <li key={t} className="au-line flex gap-3" style={{ animationDelay: `${1.2 + i * 0.2}s` }}>
                <span className="border-panel-border bg-void flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border">{icon}</span>
                <span>
                  <span className="block text-sm font-semibold text-white">{t}</span>
                  <span className="text-fog/50 text-xs">{d}</span>
                </span>
              </li>
            ))}
          </ul>
        </aside>

        <div className="bg-void rounded-2xl p-6 sm:p-8 md:rounded-l-none">
          <p className="text-cyan/60 mb-2 font-mono text-xs">{eyebrow}</p>
          <h1 className="font-display mb-1 text-3xl font-bold text-white">{title}</h1>
          <p className="text-fog/60 mb-6 text-sm">{subtitle}</p>
          {children}
          <div className="text-fog/60 mt-6 text-center text-sm">{footer}</div>
        </div>
      </div>
    </div>
  )
}

type FieldProps = { label: string; htmlFor: string; error?: string; hint?: ReactNode; children: ReactNode }

export function Field({ label, htmlFor, error, hint, children }: FieldProps) {
  return (
    <div className="mb-4">
      <label htmlFor={htmlFor} className={authLabel}>{label}</label>
      {children}
      {error ? <p id={`${htmlFor}-err`} role="alert" className="mt-1.5 text-xs text-red-300">{error}</p> : hint}
    </div>
  )
}
