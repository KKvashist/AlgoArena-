import { Link } from 'react-router-dom'
import type { JourneyView } from './types'
import { fmtMinutes, missionPath } from './paths'
import { Ring } from './ui'
import { levelOf10, scoreOn10 } from './score'

const Tile = ({ label, children, testid }: { label: string; children: React.ReactNode; testid?: string }) => (
  <div className="border-panel-border bg-panel rounded-2xl border p-4" data-testid={testid}>
    <p className="text-fog/40 mb-1 font-mono text-[11px] uppercase tracking-widest">{label}</p>
    {children}
  </div>
)

export default function ProgressPanel({ journey }: { journey: JourneyView }) {
  const { roadmap, profile, stats, next } = journey
  if (!roadmap || !profile || !stats) return null
  const s = roadmap.summary
  const practice = roadmap.realms.flatMap((r) => r.missions).filter((m) => m.type === 'practice')
  const practiceDone = practice.filter((m) => m.done).length
  const max = Math.max(1, ...stats.last14.map((d) => d.n))
  const s10 = profile.skillScore === null ? null : scoreOn10(profile.skillScore)
  const scored = (profile.scoreHistory ?? []).filter((h) => h.skillScore !== null)
  const first10 = scored.length > 0 ? scoreOn10(scored[0].skillScore as number) : null
  const gain = s10 !== null && first10 !== null && scored.length > 1 ? Math.round((s10 - first10) * 10) / 10 : null

  return (
    <section data-testid="progress-panel" aria-label="Your progress">
      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="DSA completion" testid="stat-completion">
          <div className="flex items-center gap-3"><Ring value={s.percent} label="done" /><p className="text-fog/60 text-sm">{s.doneMissions}/{s.totalMissions} missions<br />≈ {fmtMinutes(s.remainingMinutes)} left</p></div>
        </Tile>
        <Tile label="Rank and skill score" testid="stat-rank">
          {s10 === null ? (
            <><p className="font-display text-xl text-white">Unranked</p><p className="text-fog/50 text-xs">Take the optional skill check to get a rank and a score.</p>
              <Link to="/journey/assessment" data-testid="retake-check" className="text-cyan mt-2 inline-block font-mono text-xs underline">Take the skill check ▶</Link></>
          ) : (
            <><p className="font-display text-xl text-white">🏅 {profile.rank}</p><p className="text-amber font-mono text-sm">{s10.toFixed(1)} / 10 · {levelOf10(s10)}</p><p className="text-fog/50 text-xs">{profile.assessmentsTaken} skill check{profile.assessmentsTaken === 1 ? '' : 's'} taken</p>
              {gain !== null && <p data-testid="score-gain" className={`mt-1 font-mono text-xs ${gain > 0 ? 'text-emerald-300' : 'text-fog/60'}`}>{gain > 0 ? `▲ +${gain.toFixed(1)}` : gain < 0 ? `▼ ${gain.toFixed(1)}` : '＝ no change'} since your first check ({first10?.toFixed(1)} → {s10.toFixed(1)})</p>}
              <Link to="/journey/assessment" data-testid="retake-check" className="text-cyan mt-2 inline-block font-mono text-xs underline">Check how much you have learned ▶</Link></>
          )}
        </Tile>
        <Tile label="Learning streak" testid="stat-streak">
          <p className="font-display text-2xl text-white">{stats.streak > 0 ? '🔥' : '💤'} {stats.streak} day{stats.streak === 1 ? '' : 's'}</p>
          <div className="mt-2 flex h-8 items-end gap-0.5" aria-label="Activity in the last 14 days">
            {stats.last14.map((d) => <div key={d.day} title={`${d.day}: ${d.n}`} className={`flex-1 rounded-sm ${d.n ? 'bg-cyan' : 'bg-white/10'}`} style={{ height: `${d.n ? 25 + (75 * d.n) / max : 12}%` }} />)}
          </div>
          <p className="text-fog/40 mt-1 text-[11px]">{stats.activeDays} active day{stats.activeDays === 1 ? '' : 's'} so far</p>
        </Tile>
        <Tile label="Missions" testid="stat-missions">
          <p className="text-white"><span className="font-display text-2xl text-emerald-300">{stats.missionsDone}</span> done · <span className="font-display text-2xl text-amber">{stats.missionsPending}</span> pending</p>
          <p className="text-fog/50 text-xs">Coding practice missions: {practiceDone}/{practice.length}</p>
          {next && <Link to={missionPath(next)} className="text-cyan mt-1 inline-block font-mono text-xs underline">Next: {next.realmTitle} →</Link>}
        </Tile>
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Tile label="Topic-wise performance" testid="topic-perf">
          <ul className="space-y-3">
            {stats.topics.map((t) => (
              <li key={t.id}>
                <div className="flex justify-between text-sm"><span className="text-white">{t.icon} {t.title}</span><span className="text-fog/50 font-mono text-xs">{t.latest === null ? 'no score yet' : `score ${t.latest}%`} · {t.percent}% done</span></div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10"><div className="from-cyan to-violet h-full rounded-full bg-gradient-to-r" style={{ width: `${t.percent}%` }} /></div>
                {t.history.length > 1 && <p className="text-fog/40 mt-0.5 font-mono text-[10px]">trend: {t.history.join('% → ')}%</p>}
              </li>
            ))}
          </ul>
        </Tile>
        <div className="grid gap-4">
          <Tile label="Strongest and weakest" testid="strong-weak">
            {stats.strongest.length === 0 ? <p className="text-fog/50 text-sm">Take a quiz or the skill check to see this.</p> : (
              <div className="space-y-1 text-sm">
                {stats.strongest.map((t) => <p key={t.id} className="text-emerald-200">💪 {t.title} · {t.pct}%</p>)}
                {stats.weakest.map((t) => <p key={t.id} className="text-amber">🎯 {t.title} · {t.pct}%</p>)}
              </div>
            )}
          </Tile>
          <Tile label="Personalised priorities" testid="priorities">
            {stats.priorities.length === 0 ? <p className="text-fog/50 text-sm">Nothing urgent. Keep following the roadmap.</p> : (
              <ul className="space-y-2 text-sm">{stats.priorities.map((p) => <li key={p.id}><span className="text-red-300 font-mono text-[11px]">HIGH</span> <span className="text-white">{p.title}</span><span className="text-fog/50 block text-xs">{p.reason}</span></li>)}</ul>
            )}
          </Tile>
        </div>
      </div>

      <Tile label="Quiz performance history" testid="quiz-history">
        {stats.quizzes.length === 0 ? <p className="text-fog/50 text-sm">No quiz attempts yet. Finish a quiz and it shows up here, pass or fail.</p> : (
          <ul className="space-y-1.5">
            {stats.quizzes.slice().reverse().map((q, i) => (
              <li key={q.at + i} className="flex items-center gap-3 text-sm">
                <span className="text-fog/50 w-28 shrink-0 font-mono text-xs">{new Date(q.at).toLocaleDateString()}</span>
                <span className="w-32 shrink-0 text-white">{q.realm}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full ${q.pct >= 60 ? 'bg-emerald-400' : 'bg-amber'}`} style={{ width: `${q.pct}%` }} /></div>
                <span className="text-fog/60 w-20 text-right font-mono text-xs">{q.correct}/{q.total} · {q.pct}%</span>
              </li>
            ))}
          </ul>
        )}
      </Tile>
    </section>
  )
}
