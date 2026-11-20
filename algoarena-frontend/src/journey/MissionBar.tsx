import { Link } from 'react-router-dom'
import { useJourney } from '../context/JourneyContext'
import { findRealm, missionPath, realmMissionPath } from './paths'
import './journey.css'

/** Shown on a topic page when that topic is a realm in the player's roadmap. */
export default function MissionBar({ slug, activeMission }: { slug: string; activeMission: string | null }) {
  const { journey, lastCompletion, clearCompletion } = useJourney()
  const realm = findRealm(journey, slug)
  if (!journey || !realm || realm.state === 'locked') return null

  const flash = lastCompletion && lastCompletion.realmId === realm.id ? lastCompletion : null
  const next = journey.next

  return (
    <div className="jr mb-5 space-y-3" data-testid="mission-bar">
      {flash && (
        <div role="status" className="jr-pop flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-400/50 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
          <div>
            <p className="font-bold">✅ Mission complete: {flash.missionTitle}{flash.xp && <span className="text-amber ml-2" data-testid="xp-gain">+{flash.xp.gained} XP</span>}</p>
            {flash.realmCompleted && <p>🏆 {flash.realmTitle} cleared!</p>}
            {flash.unlocked.length > 0 && <p>🔓 Unlocked: {flash.unlocked.map((u) => u.title).join(', ')}</p>}
          </div>
          <div className="flex items-center gap-3">
            {next && <Link to={missionPath(next)} onClick={clearCompletion} className="from-cyan to-violet text-void rounded-lg bg-gradient-to-r px-4 py-2 font-bold">NEXT MISSION ▶</Link>}
            <button onClick={clearCompletion} className="text-emerald-200/70 text-xs underline">dismiss</button>
          </div>
        </div>
      )}
      <div className="border-cyan/30 bg-cyan/5 rounded-xl border px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-cyan font-mono text-xs tracking-widest">YOUR MISSIONS · {realm.title.toUpperCase()} · {realm.percent}%</p>
          <span className="flex items-center gap-3">
            <Link to="/journey/assessment" data-testid="bar-skill-check" className="text-cyan font-mono text-xs underline">🧪 skill check</Link>
            <Link to="/journey/roadmap" className="text-fog/60 hover:text-white font-mono text-xs underline">roadmap</Link>
          </span>
        </div>
        <ul className="mt-2 flex flex-wrap gap-2">
          {realm.missions.map((m) => (
            <li key={m.id}>
              <Link to={m.locked ? `/topic/${slug}?tab=lessons` : realmMissionPath(realm, m.type, m.id)} title={m.locked ? m.lockedReason : undefined} className={`rounded-full border px-3 py-1 text-xs ${m.done ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200' : m.id === activeMission || m.isNext ? 'border-cyan bg-cyan/15 text-white' : 'border-white/15 text-fog/70'}`}>
                {m.done ? '✔' : m.locked ? '🔒' : m.id === activeMission ? '▶' : '○'} {m.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
