import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useJourney } from '../context/JourneyContext'
import { useFirstName } from '../components/Greeting'
import { resolveJourneyRoute } from './paths'
import type { OnboardingAnswers, OnboardingStepDef, OnboardingValue } from './types'
import { Eyebrow, ErrorBox, GradientCard, JourneyPage, Loading, ghostBtn, primaryBtn } from './ui'

const BOOT = ['> scanning player signature...', '> loading arena modules...', '> calibrating difficulty engine...', '> ready.']

function isAnswered(step: OnboardingStepDef, a: OnboardingAnswers) {
  const v = a[step.key]
  return step.multi ? Array.isArray(v) && v.length > 0 : v !== undefined
}

function labelOf(step: OnboardingStepDef, a: OnboardingAnswers) {
  const v = a[step.key]
  const label = (x: OnboardingValue) => step.options.find((o) => o.value === x)?.label ?? String(x)
  return Array.isArray(v) ? v.map(label).join(', ') : v === undefined ? '-' : label(v)
}

export default function Onboarding() {
  const { status, journey, error: loadError, refresh, saveOnboarding } = useJourney()
  const navigate = useNavigate()
  const name = useFirstName()

  const [step, setStep] = useState<number | null>(null)
  const [answers, setAnswers] = useState<OnboardingAnswers | null>(null)
  const [dir, setDir] = useState<'fwd' | 'back'>('fwd')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (status === 'error') return <JourneyPage><ErrorBox message={loadError ?? 'Could not load your journey.'} onRetry={() => void refresh().catch(() => {})} /></JourneyPage>
  if (!journey) return <Loading />
  if (journey.stage !== 'onboarding' || !journey.onboarding.steps) return <Navigate to={resolveJourneyRoute(journey)} replace />

  const steps = journey.onboarding.steps
  const total = steps.length // the review screen is step index `total`
  // Local edits win; otherwise start from what the server saved (this is what makes "resume" work).
  const cur = step ?? journey.onboarding.step
  const ans = answers ?? journey.onboarding.answers
  const fresh = cur === 0 && Object.keys(ans).length === 0 && !journey.onboarding.answers.level
  const intro = fresh && step === null

  async function go(to: number, direction: 'fwd' | 'back', next: OnboardingAnswers = ans) {
    setBusy(true)
    setError('')
    try {
      await saveOnboarding({ answers: next, step: to })
      setAnswers(next)
      setDir(direction)
      setStep(to)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save. Try again.')
    } finally {
      setBusy(false)
    }
  }

  async function finish() {
    setBusy(true)
    setError('')
    try {
      await saveOnboarding({ answers: ans, step: total, completed: true })
      navigate('/journey/complete', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save. Try again.')
      setBusy(false)
    }
  }

  function pick(def: OnboardingStepDef, value: OnboardingValue) {
    setError('')
    if (!def.multi) return setAnswers({ ...ans, [def.key]: value })
    const list = new Set(ans.studied ?? [])
    const v = String(value)
    if (v === 'none') {
      setAnswers({ ...ans, studied: list.has('none') ? [] : ['none'] })
      return
    }
    list.delete('none')
    if (list.has(v)) list.delete(v)
    else list.add(v)
    setAnswers({ ...ans, studied: [...list] })
  }

  const hud = (
    <div className="mb-6">
      <Eyebrow>{'// onboarding.init()'}</Eyebrow>
      <div className="flex items-center gap-1.5" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={Math.min(cur, total)}>
        {Array.from({ length: total + 1 }, (_, i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i < cur ? 'bg-cyan' : i === cur && !intro ? 'bg-cyan/60 animate-pulse' : 'bg-white/10'}`} />
        ))}
      </div>
      <p className="text-fog/50 mt-2 font-mono text-xs">{intro ? 'PLAYER SETUP' : cur >= total ? 'FINAL CHECK' : `STEP ${cur + 1} OF ${total}`}</p>
    </div>
  )

  if (intro) {
    return (
      <JourneyPage>
        {hud}
        <GradientCard>
          <div className="jr-scan">
            <h1 className="font-display jr-rise mb-4 text-3xl font-bold text-white">
              <span className="text-cyan">{name || 'Player'}</span>, welcome to the Arena.
            </h1>
            <div className="text-fog/70 mb-6 space-y-1 font-mono text-sm">
              {BOOT.map((l, i) => (
                <p key={l} className="jr-boot" style={{ animationDelay: `${0.4 + i * 0.45}s` }}>{l}</p>
              ))}
            </div>
            <p className="text-fog/60 jr-boot mb-6 text-sm" style={{ animationDelay: '2.4s' }}>
              Six quick questions build your player profile. Then a short skill test decides where your journey starts. You can go back and change any answer.
            </p>
            <div className="jr-boot" style={{ animationDelay: '2.6s' }}>
              <button className={`${primaryBtn} jr-glow`} onClick={() => void go(0, 'fwd')} disabled={busy}>
                BEGIN SETUP ▶
              </button>
            </div>
            {error && <div className="mt-4"><ErrorBox message={error} /></div>}
          </div>
        </GradientCard>
      </JourneyPage>
    )
  }

  // ---- review ----
  if (cur >= total) {
    return (
      <JourneyPage>
        {hud}
        <GradientCard>
          <div key="review" className={dir === 'fwd' ? 'jr-enter-fwd' : 'jr-enter-back'}>
            <h1 className="font-display mb-1 text-2xl font-bold text-white">Player profile ready</h1>
            <p className="text-fog/60 mb-5 text-sm">Check your answers. Tap Edit to change any of them.</p>
            <ul className="mb-6 divide-y divide-white/5">
              {steps.map((s, i) => (
                <li key={s.key} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-fog/50 font-mono text-[11px] uppercase tracking-widest">{s.title}</p>
                    <p className="truncate text-white" data-testid={`review-${s.key}`}>{labelOf(s, ans)}</p>
                  </div>
                  <button className="text-cyan font-mono text-xs underline" disabled={busy} onClick={() => void go(i, 'back')}>EDIT</button>
                </li>
              ))}
            </ul>
            {error && <ErrorBox message={error} />}
            <div className="flex justify-between gap-3">
              <button className={ghostBtn} disabled={busy} onClick={() => void go(total - 1, 'back')}>← BACK</button>
              <button className={`${primaryBtn} jr-glow`} disabled={busy} onClick={() => void finish()}>
                {busy ? 'SAVING...' : 'CREATE MY JOURNEY ▶'}
              </button>
            </div>
          </div>
        </GradientCard>
      </JourneyPage>
    )
  }

  // ---- a question ----
  const def = steps[cur]
  const selected = ans[def.key]
  const isSel = (v: OnboardingValue) => (Array.isArray(selected) ? selected.includes(String(v)) : selected === v)

  return (
    <JourneyPage>
      {hud}
      <GradientCard>
        <div key={cur} className={dir === 'fwd' ? 'jr-enter-fwd' : 'jr-enter-back'}>
          <h1 className="font-display mb-1 text-2xl font-bold text-white">{def.title}</h1>
          <p className="text-fog/60 mb-5 text-sm">{def.hint}</p>
          <div className={`mb-6 grid gap-3 ${def.multi ? 'grid-cols-2 sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
            {def.options.map((o) => (
              <button
                key={String(o.value)}
                type="button"
                aria-pressed={isSel(o.value)}
                onClick={() => pick(def, o.value)}
                className="jr-option border-panel-border bg-panel flex items-center gap-3 rounded-xl border p-3 text-left"
              >
                <span className="text-2xl">{o.icon}</span>
                <span className="min-w-0">
                  <span className="block font-semibold text-white">{o.label}</span>
                  {o.desc && <span className="text-fog/50 block text-xs">{o.desc}</span>}
                </span>
              </button>
            ))}
          </div>
          {error && <ErrorBox message={error} />}
          <div className="flex justify-between gap-3">
            <button className={ghostBtn} disabled={busy || cur === 0} onClick={() => void go(cur - 1, 'back')}>← BACK</button>
            <button className={primaryBtn} disabled={busy || !isAnswered(def, ans)} onClick={() => void go(cur + 1, 'fwd')}>
              {busy ? 'SAVING...' : cur === total - 1 ? 'REVIEW ▶' : 'NEXT ▶'}
            </button>
          </div>
        </div>
      </GradientCard>
    </JourneyPage>
  )
}
