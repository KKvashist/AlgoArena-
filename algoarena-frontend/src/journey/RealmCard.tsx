import { Link } from 'react-router-dom'
import type { RealmView } from './types'
import { fmtMinutes, realmMissionPath } from './paths'
import { Pips } from './ui'
import { resourcePath, resourcesFor } from './resources'

const PRIORITY = {
  high: { label: 'HIGH PRIORITY', cls: 'text-red-300 border-red-400/40 bg-red-400/10' },
  medium: { label: 'MEDIUM PRIORITY', cls: 'text-amber border-amber/40 bg-amber/10' },
  low: { label: 'LOW PRIORITY', cls: 'text-fog/60 border-white/10 bg-white/5' },
} as const

const STATE: Record<RealmView['state'], { label: string; cls: string }> = {
  completed: { label: 'COMPLETED', cls: 'text-emerald-300 border-emerald-400/40 bg-emerald-400/10' },
  unlocked: { label: 'UNLOCKED', cls: 'text-cyan border-cyan/40 bg-cyan/10' },
  locked: { label: 'LOCKED', cls: 'text-fog/50 border-white/10 bg-white/5' },
  'coming-soon': { label: 'COMING SOON', cls: 'text-violet border-violet/30 bg-violet/10' },
}

export default function RealmCard({ realm }: { realm: RealmView }) {
  const st = STATE[realm.state]
  const dim = realm.state === 'locked' || realm.state === 'coming-soon'
  const playable = realm.state === 'unlocked' || realm.state === 'completed'
  const res = resourcesFor(realm.topicSlug)
  const pr = realm.priority ? PRIORITY[realm.priority] : null

  return (
    <li className="relative pl-16" data-realm={realm.id} data-state={realm.state}>
      <span className={`absolute left-0 top-3 flex h-14 w-14 items-center justify-center rounded-full border-2 bg-void text-2xl ${realm.state === 'completed' ? 'border-emerald-400' : realm.recommended ? 'border-cyan jr-glow' : 'border-white/15'} ${dim ? 'opacity-50 grayscale' : ''}`}>
        {realm.state === 'completed' ? '✅' : realm.state === 'locked' ? '🔒' : realm.icon}
      </span>

      <div className={`rounded-2xl border p-4 transition ${realm.recommended ? 'border-cyan/60 bg-cyan/5' : 'border-panel-border bg-panel'} ${dim ? 'opacity-70' : ''}`}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-fog/40 font-mono text-[11px] tracking-widest">REALM {String(realm.order).padStart(2, '0')}</p>
            <h3 className="font-display text-lg font-bold text-white">{realm.title}</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {pr && playable && <span data-testid="priority" className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] tracking-widest ${pr.cls}`}>{pr.label}</span>}
            <span className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] tracking-widest ${st.cls}`}>{st.label}</span>
          </div>
        </div>
        <p className="text-fog/60 mt-1 text-sm">{realm.blurb}</p>

        <div className="text-fog/60 mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-xs">
          <span className="flex items-center gap-2">{realm.difficultyLabel} <Pips value={realm.difficulty} /></span>
          {realm.topicSlug && <span>⏱ {realm.state === 'completed' ? fmtMinutes(realm.minutes) : `${fmtMinutes(realm.remainingMinutes)} left`}</span>}
          {realm.track === 'fast' && realm.topicSlug && <span className="text-amber">⚡ FAST TRACK</span>}
          {realm.recommended && <span className="text-cyan">★ RECOMMENDED NEXT</span>}
        </div>

        {realm.topicSlug && (
          <div className="mt-3">
            <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="from-cyan to-violet h-full rounded-full bg-gradient-to-r transition-all duration-700" style={{ width: `${realm.percent}%` }} /></div>
            <p className="text-fog/50 mt-1 font-mono text-[11px]">{realm.percent}% complete</p>
          </div>
        )}

        {realm.reason && playable && realm.state !== 'completed' && <p className="text-fog/70 mt-2 text-sm" data-testid="reason">💡 {realm.reason}</p>}

        {realm.topicSlug && res.known && (
          <div className="mt-3" data-testid="resources">
            <p className="text-fog/40 mb-1.5 font-mono text-[11px] tracking-widest">{playable ? 'STUDY RESOURCES' : 'RESOURCES (UNLOCK TO OPEN)'}</p>
            <div className="flex flex-wrap gap-2">
              {res.items.map((r) => {
                const focus = realm.focus.includes(r.key)
                const cls = `rounded-lg border px-2.5 py-1.5 text-xs ${focus ? 'border-cyan/50 bg-cyan/10 text-cyan' : 'border-white/10 text-fog/70'}`
                const body = (<><span className="mr-1">{r.icon}</span>{r.label}<span className="text-fog/40 ml-1 font-mono text-[10px]">{r.available ? r.detail : 'not available yet'}</span>{focus && <span className="ml-1 font-mono text-[10px]">★</span>}</>)
                return r.available && playable && realm.topicSlug
                  ? <Link key={r.key} to={resourcePath(realm.topicSlug, r)} data-res={r.key} className={`${cls} hover:bg-white/5`}>{body}</Link>
                  : <span key={r.key} data-res={r.key} className={`${cls} ${r.available ? '' : 'opacity-50'}`}>{body}</span>
              })}
            </div>
            {realm.focus.length > 0 && playable && <p className="text-fog/40 mt-1 text-[11px]">★ = where you should spend your time on this topic</p>}
          </div>
        )}
        {realm.state === 'coming-soon' && <p className="text-fog/50 mt-2 text-xs" data-testid="unavailable">Notes, videos, game, quiz and problems: not available yet.</p>}

        {realm.note && realm.state !== 'locked' && <p className="text-fog/50 mt-2 text-xs italic">{realm.note}</p>}
        {realm.state === 'locked' && realm.lockedBy.length > 0 && <p className="text-fog/50 mt-2 text-xs">🔒 Finish {realm.lockedBy.join(' and ')} first.</p>}

        {realm.missions.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {realm.missions.map((m) => {
              const row = (
                <>
                  <span className={m.done ? 'text-emerald-300' : m.isNext ? 'text-cyan' : 'text-fog/40'}>{m.done ? '✔' : m.locked ? '🔒' : m.isNext ? '▶' : '○'}</span>
                  <span className={`flex-1 ${m.done ? 'text-fog/50 line-through' : m.locked ? 'text-fog/50' : 'text-white'}`}>{m.title}{m.locked && <span className="text-fog/40 ml-2 text-xs">· finish the lessons first</span>}</span>
                  <span className="text-fog/40 font-mono text-xs">{m.minutes}m</span>
                </>
              )
              return (
                <li key={m.id} data-mission={m.id}>
                  {playable ? (
                    <Link to={m.locked && realm.topicSlug ? `/topic/${realm.topicSlug}?tab=lessons` : realmMissionPath(realm, m.type, m.id)} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-white/5 ${m.isNext ? 'bg-cyan/10 ring-1 ring-cyan/40' : ''}`}>{row}</Link>
                  ) : (
                    <div className="flex items-center gap-3 px-3 py-2 text-sm">{row}</div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </li>
  )
}
