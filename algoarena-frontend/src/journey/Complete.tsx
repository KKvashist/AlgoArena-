import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useJourney } from '../context/JourneyContext'
import { useFirstName } from '../components/Greeting'
import { fmtMinutes, missionPath, resolveJourneyRoute } from './paths'
import { Eyebrow, ErrorBox, GradientCard, JourneyPage, Loading, Ring, primaryBtn, ghostBtn } from './ui'

const CONFETTI = ['#2de2e6', '#8b5cf6', '#ffb627', '#34d399', '#f472b6']

export default function Complete() {
  const { status, journey, error, refresh, markIntroSeen } = useJourney()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const fromCheck = params.get('check') === '1' // just finished the optional skill check
  const name = useFirstName()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  if (status === 'error') return <JourneyPage><ErrorBox message={error ?? 'Could not load your journey.'} onRetry={() => void refresh().catch(() => {})} /></JourneyPage>
  if (!journey) return <Loading />
  if (journey.stage !== 'complete' || !journey.profile || !journey.roadmap) return <Navigate to={resolveJourneyRoute(journey)} replace />
  // Already celebrated: no need to see this screen again.
  if (journey.introSeen && !busy && !fromCheck) return <Navigate to="/journey/roadmap" replace />

  const { profile: p, roadmap, next } = journey
  const tested = p.skillScore !== null
  const open = roadmap.realms.filter((r) => r.topicSlug)
  const soon = roadmap.realms.filter((r) => !r.topicSlug)
  const target = next ? missionPath(next) : '/journey/roadmap'

  async function enter() {
    setBusy(true)
    setErr('')
    try {
      await markIntroSeen()
      navigate(target)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not continue. Try again.')
      setBusy(false)
    }
  }

  return (
    <JourneyPage wide>
      <div className="jr-confetti" aria-hidden="true">
        {Array.from({ length: 36 }, (_, i) => (
          <span key={i} style={{ left: `${(i * 29) % 100}%`, background: CONFETTI[i % 5], animationDelay: `${(i % 9) * 0.12}s`, animationDuration: `${2 + (i % 5) * 0.4}s` }} />
        ))}
      </div>

      <div className="relative mb-8 text-center">
        <Eyebrow>{fromCheck ? '// roadmap.updated()' : '// journey.created()'}</Eyebrow>
        <h1 className="font-display jr-rise text-4xl font-bold text-white sm:text-5xl">{fromCheck ? 'Your roadmap has been updated!' : 'Your journey has been created!'}</h1>
        <p className="text-fog/60 mt-2">{tested ? <>Built from your answers and your skill check, <span className="text-cyan">{name}</span>.</> : <>Built from your answers, <span className="text-cyan">{name}</span>. Here is what we have for you.</>}</p>
      </div>

      <div className="mb-6 grid gap-5 md:grid-cols-[1.1fr_1fr]">
        <GradientCard>
          <div className="flex items-center gap-5">
            <div className="from-cyan to-violet text-void font-display flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-2xl font-bold">{p.name[0]?.toUpperCase()}</div>
            <div className="min-w-0">
              <p className="text-fog/50 font-mono text-xs uppercase tracking-widest">Player profile</p>
              <p className="font-display truncate text-2xl font-bold text-white">{name || p.name}</p>
              <p className={`jr-float inline-block font-mono text-sm ${tested ? 'text-amber' : 'text-fog/50'}`} data-testid="rank">{tested ? `🏅 ${p.rank}` : 'Unranked · take the optional skill check'}</p>
            </div>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            {[['Skill level', p.skillLevel ?? 'Not tested yet'], ['Language', p.languageLabel], ['Goal', p.goalLabel], ['Daily time', `${p.dailyMinutes} min`], ['Experience', p.levelLabel], ['DSA familiarity', p.familiarityLabel]].map(([k, v]) => (
              <div key={k}><dt className="text-fog/40 font-mono text-[11px] uppercase tracking-widest">{k}</dt><dd className="text-white">{v}</dd></div>
            ))}
          </dl>
        </GradientCard>

        {tested && p.skillScore !== null ? (
          <GradientCard>
            <div className="flex items-center gap-5">
              <Ring value={p.skillScore} label="skill" />
              <div className="text-sm">
                <p className="text-white">{p.correct} of {p.total} challenges solved</p>
                <p className="text-fog/60">Adaptive score: {p.assessmentPct}%</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {p.categories.filter((c) => c.pct !== null).map((c) => (
                <div key={c.id}>
                  <div className="text-fog/60 flex justify-between font-mono text-[11px]"><span>{c.label}</span><span>{c.pct}%</span></div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="bg-cyan h-full rounded-full transition-all duration-1000" style={{ width: `${c.pct}%` }} /></div>
                </div>
              ))}
            </div>
          </GradientCard>
        ) : (
          <GradientCard>
            <p className="text-cyan/80 mb-3 font-mono text-xs uppercase tracking-widest" data-testid="have-title">What we have for you today</p>
            <ul className="space-y-2">
              {open.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-white"><span className="mr-2">{r.icon}</span>{r.title}</span>
                  <span className="text-fog/50 font-mono text-xs">{r.missions.length} missions · ≈ {fmtMinutes(r.minutes)}</span>
                </li>
              ))}
            </ul>
            <p className="text-fog/40 mt-4 font-mono text-[11px] uppercase tracking-widest">Coming soon</p>
            <p className="text-fog/50 mt-1 text-xs">{soon.map((r) => r.title).join(' · ')}</p>
          </GradientCard>
        )}
      </div>

      {tested ? (
      <div className="mb-6 grid gap-5 sm:grid-cols-2">
        <div className="border-panel-border bg-panel rounded-2xl border p-5">
          <p className="mb-2 font-mono text-xs uppercase tracking-widest text-emerald-300">💪 Strong topics</p>
          {p.strong.length ? <div className="flex flex-wrap gap-2">{p.strong.map((t) => <span key={t.id} className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-200">{t.label} · {t.pct}%</span>)}</div> : <p className="text-fog/50 text-sm">Nothing proven yet. That is what the missions are for.</p>}
        </div>
        <div className="border-panel-border bg-panel rounded-2xl border p-5">
          <p className="text-amber mb-2 font-mono text-xs uppercase tracking-widest">🎯 Focus areas</p>
          {p.weak.length ? <div className="flex flex-wrap gap-2">{p.weak.map((t) => <span key={t.id} className="border-amber/30 bg-amber/10 text-amber rounded-full border px-3 py-1 text-sm">{t.label} · {t.pct}%</span>)}</div> : <p className="text-fog/50 text-sm">No major gaps detected.</p>}
        </div>
      </div>
      ) : (
        <div className="mb-6 grid gap-5 sm:grid-cols-2">
          <div className="border-panel-border bg-panel rounded-2xl border p-5">
            <p className="text-cyan mb-2 font-mono text-xs uppercase tracking-widest">📘 You told us you know</p>
            {p.studied.length ? <div className="flex flex-wrap gap-2">{p.studied.map((t) => <span key={t} className="border-cyan/30 bg-cyan/10 text-cyan rounded-full border px-3 py-1 text-sm">{t}</span>)}</div> : <p className="text-fog/50 text-sm">Starting fresh. We begin at the very beginning.</p>}
          </div>
          <div className="border-panel-border bg-panel rounded-2xl border p-5">
            <p className="text-amber mb-2 font-mono text-xs uppercase tracking-widest">🎯 Skill check · optional</p>
            <p className="text-fog/60 mb-3 text-sm">About 5 minutes. Earns your rank, finds strong and weak topics, and can skip what you already know. You can take it any time.</p>
            <Link to="/journey/assessment" className={`${ghostBtn} inline-block`} data-testid="take-check">TAKE THE SKILL CHECK</Link>
          </div>
        </div>
      )}

      <div className="border-panel-border bg-panel mb-6 rounded-2xl border p-5">
        <p className="text-fog/50 mb-3 font-mono text-xs uppercase tracking-widest">Your roadmap · {roadmap.summary.playableRealms} playable realms · ≈ {fmtMinutes(roadmap.summary.totalMinutes)}</p>
        <ol className="flex gap-3 overflow-x-auto pb-2">
          {roadmap.realms.map((r) => (
            <li key={r.id} className={`min-w-[104px] rounded-xl border p-3 text-center text-xs ${r.recommended ? 'border-cyan bg-cyan/10' : 'border-white/10'} ${r.state === 'locked' || r.state === 'coming-soon' ? 'opacity-50' : ''}`}>
              <div className="text-2xl">{r.state === 'locked' ? '🔒' : r.icon}</div>
              <div className="mt-1 text-white">{r.title}</div>
              <div className="text-fog/40 mt-0.5 font-mono text-[10px]">{r.state === 'coming-soon' ? 'SOON' : r.state === 'unlocked' ? 'OPEN' : r.state.toUpperCase()}</div>
            </li>
          ))}
        </ol>
      </div>

      <div className="from-cyan via-violet to-amber relative rounded-2xl bg-gradient-to-r p-[1.5px]">
        <div className="bg-void flex flex-wrap items-center justify-between gap-4 rounded-2xl p-6">
          <div>
            <p className="text-cyan/70 font-mono text-xs tracking-widest">FIRST RECOMMENDED MISSION</p>
            {next ? (
              <>
                <p className="font-display text-xl font-bold text-white" data-testid="first-mission">{next.title}</p>
                <p className="text-fog/60 text-sm">{next.realmTitle} · about {next.minutes} min</p>
              </>
            ) : <p className="text-fog/60 text-sm">All available missions are complete.</p>}
          </div>
          <div className="flex flex-wrap gap-3">
            <button className={ghostBtn} disabled={busy} onClick={() => { void markIntroSeen().then(() => navigate('/journey/roadmap')).catch(() => setErr('Could not continue. Try again.')) }}>VIEW ROADMAP</button>
            <button className={`${primaryBtn} jr-glow px-8 text-lg`} disabled={busy} onClick={() => void enter()}>{busy ? 'ENTERING...' : 'ENTER THE ARENA'}</button>
          </div>
        </div>
      </div>
      {err && <div className="mt-4"><ErrorBox message={err} /></div>}
    </JourneyPage>
  )
}
