import { Link, Navigate } from 'react-router-dom'
import { useJourney } from '../context/JourneyContext'
import { useFirstName } from '../components/Greeting'
import { fmtMinutes, missionPath, resolveJourneyRoute } from './paths'
import RealmCard from './RealmCard'
import ProgressPanel from './ProgressPanel'
import { Eyebrow, ErrorBox, JourneyPage, Loading, Ring, primaryBtn } from './ui'

const BAR_COLOR: Record<string, string> = { completed: 'bg-emerald-400', unlocked: 'bg-cyan', locked: 'bg-white/25', 'coming-soon': 'bg-violet/40' }

export default function Roadmap() {
  const { status, journey, error, refresh } = useJourney()
  const name = useFirstName()

  if (status === 'error') return <JourneyPage><ErrorBox message={error ?? 'Could not load your journey.'} onRetry={() => void refresh().catch(() => {})} /></JourneyPage>
  if (!journey) return <Loading />
  if (journey.stage !== 'complete' || !journey.roadmap || !journey.profile) return <Navigate to={resolveJourneyRoute(journey)} replace />

  const { roadmap, profile, next } = journey
  const s = roadmap.summary

  return (
    <JourneyPage wide>
      <Eyebrow>{'// journey.roadmap()'}</Eyebrow>
      <div className="border-panel-border bg-panel relative mb-8 flex flex-wrap items-center gap-6 overflow-hidden rounded-2xl border p-6">
        <div className="bg-cyan/10 absolute -top-20 -right-20 h-56 w-56 rounded-full blur-3xl" />
        <Ring value={s.percent} label="journey" />
        <div className="relative min-w-[220px] flex-1">
          <p className="text-fog/50 font-mono text-xs uppercase tracking-widest">Player</p>
          <h1 className="font-display text-2xl font-bold text-white"><span className="text-cyan">{name}</span> · {profile.rank ?? 'Unranked'}</h1>
          <p className="text-fog/60 mt-1 text-sm">{s.finishedRealms}/{s.playableRealms} playable realms cleared · {s.doneMissions}/{s.totalMissions} missions</p>
          <p className="mt-1"><Link to="/journey/assessment" className="text-cyan font-mono text-xs underline" data-testid="skill-check-link">{profile.skillScore === null ? 'Take the optional skill check' : 'Retake the skill check'}</Link></p>
          <p className="text-fog/60 text-sm">{s.remainingMinutes > 0 ? `≈ ${fmtMinutes(s.remainingMinutes)} left, about ${s.daysLeft} day${s.daysLeft === 1 ? '' : 's'} at ${profile.dailyMinutes} min a day` : 'Every available realm is cleared. New realms are on the way.'}</p>
        </div>
        {next ? (
          <div className="relative">
            <p className="text-fog/50 mb-1 font-mono text-xs">RECOMMENDED NEXT MISSION</p>
            <p className="mb-2 font-semibold text-white">{next.title} <span className="text-fog/50 text-sm font-normal">· {next.realmTitle}</span></p>
            <Link to={missionPath(next)} className={`${primaryBtn} jr-glow inline-block`} data-testid="continue-mission">CONTINUE MISSION ▶</Link>
          </div>
        ) : (
          <p className="text-emerald-300 relative font-mono text-sm">🏆 All available missions complete</p>
        )}
      </div>

      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between"><p className="text-fog/50 font-mono text-xs uppercase tracking-widest">Your progress</p><Link to="/journey/progress" className="text-cyan font-mono text-xs underline" data-testid="progress-link">Open full view →</Link></div>
        <ProgressPanel journey={journey} />
      </div>

      <div className="mb-8">
        <p className="text-fog/50 mb-2 font-mono text-xs uppercase tracking-widest">Difficulty progression</p>
        <div className="flex h-16 items-end gap-1.5" aria-label="Difficulty of each realm, in order">
          {roadmap.realms.map((r) => (
            <div key={r.id} title={`${r.title}: ${r.difficultyLabel}`} className={`flex-1 rounded-t ${BAR_COLOR[r.state]}`} style={{ height: `${r.difficulty * 20}%` }} />
          ))}
        </div>
        <div className="text-fog/40 mt-1 flex justify-between font-mono text-[10px]"><span>EASY</span><span>EXPERT</span></div>
      </div>

      <ol className="jr-path relative space-y-5">
        {roadmap.realms.map((r) => <RealmCard key={r.id} realm={r} />)}
      </ol>
    </JourneyPage>
  )
}
