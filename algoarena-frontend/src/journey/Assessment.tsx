import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useJourney } from '../context/JourneyContext'
import { useFirstName } from '../components/Greeting'
import { resolveJourneyRoute } from './paths'
import SortPuzzle from './SortPuzzle'
import type { AnswerFeedback, AnswerPayload, PublicQuestion } from './types'
import { Eyebrow, ErrorBox, GradientCard, JourneyPage, Loading, Pips, ghostBtn, primaryBtn } from './ui'

const KINDS = [
  ['🧠', 'Logical reasoning'],
  ['💻', 'Programming basics'],
  ['🔢', 'Array & string challenges'],
  ['📚', 'DSA multiple choice'],
  ['🧩', 'Problem-solving puzzles'],
]

type Shown = { q: PublicQuestion; feedback: AnswerFeedback; finished: boolean }

export default function Assessment() {
  const { status, journey, error: loadError, refresh, startAssessment, cancelAssessment, answer } = useJourney()
  const navigate = useNavigate()
  const name = useFirstName()

  const [pick, setPick] = useState<number | null>(null)
  const [text, setText] = useState('')
  const [moves, setMoves] = useState<number[]>([])
  const [shown, setShown] = useState<Shown | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (status === 'error') return <JourneyPage><ErrorBox message={loadError ?? 'Could not load your journey.'} onRetry={() => void refresh().catch(() => {})} /></JourneyPage>
  if (!journey) return <Loading />
  // Onboarding first. After that the skill check is optional: with no check open we show its intro.
  // While feedback is on screen we stay here even though the server has already moved on.
  if (journey.stage === 'onboarding') return <Navigate to={resolveJourneyRoute(journey)} replace />

  const a = journey.assessment
  const q = a.current

  async function begin() {
    setBusy(true)
    setError('')
    try {
      await startAssessment()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start.')
    } finally {
      setBusy(false)
    }
  }

  async function submit(question: PublicQuestion, payload: AnswerPayload) {
    setBusy(true)
    setError('')
    try {
      const r = await answer(question.id, payload)
      setShown({ q: question, feedback: r.feedback, finished: r.finished })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit. Try again.')
    } finally {
      setBusy(false)
    }
  }

  async function leave() {
    setBusy(true)
    try {
      await cancelAssessment()
      navigate('/journey/roadmap', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not leave. Try again.')
      setBusy(false)
    }
  }

  function next() {
    if (shown?.finished) return navigate('/journey/complete?check=1', { replace: true })
    setShown(null)
    setPick(null)
    setText('')
    setMoves([])
  }

  const answeredNow = a.started ? a.answered : shown ? a.total : 0
  const hud = (
    <div className="mb-6">
      <Eyebrow>{'// skill.assessment()'}</Eyebrow>
      <div className="flex items-center gap-1.5" role="progressbar" aria-valuemin={0} aria-valuemax={a.total} aria-valuenow={answeredNow}>
        {Array.from({ length: a.total }, (_, i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i < answeredNow ? 'bg-cyan' : i === answeredNow && a.started ? 'bg-cyan/60 animate-pulse' : 'bg-white/10'}`} />
        ))}
      </div>
    </div>
  )

  if (!a.started && !shown) {
    return (
      <JourneyPage>
        {hud}
        <GradientCard>
          <h1 className="font-display mb-2 text-3xl font-bold text-white"><span className="text-cyan">{name || 'Player'}</span>, want a quick skill check?</h1>
          <p className="text-fog/60 mb-5 text-sm">Totally optional. {a.total} short challenges that adapt to your answers. It gives you a rank, finds your strong and weak topics, and can fast-track what you already know. Your roadmap and progress are kept either way.</p>
          <ul className="mb-6 space-y-2 text-sm text-white">
            {KINDS.map(([i, l]) => (<li key={l}><span className="mr-2">{i}</span>{l}</li>))}
          </ul>
          {error && <ErrorBox message={error} />}
          <div className="flex flex-wrap gap-3">
            <Link to="/journey/roadmap" className={ghostBtn}>NOT NOW</Link>
            <button className={`${primaryBtn} jr-glow`} disabled={busy} onClick={() => void begin()}>{busy ? 'LOADING...' : 'START SKILL CHECK ▶'}</button>
          </div>
        </GradientCard>
      </JourneyPage>
    )
  }

  const view = shown?.q ?? q
  if (!view) return <Loading text="Preparing your next challenge..." />
  const fb = shown?.feedback

  const canSubmit = !fb && !busy && (view.type === 'mcq' ? pick !== null : view.type === 'typed' ? text.trim().length > 0 : moves.length > 0)
  const payload = (): AnswerPayload => (view.type === 'mcq' ? { answer: pick ?? 0 } : view.type === 'typed' ? { answer: text } : { moves })

  return (
    <JourneyPage>
      {hud}
      <GradientCard>
        <div key={view.id} className="jr-enter-fwd" data-qid={view.id}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
            <span className="text-cyan">{view.catLabel.toUpperCase()}</span>
            <span className="text-fog/50 flex items-center gap-2">Q {view.number}/{view.total} · difficulty <Pips value={view.diff} max={3} label={`Difficulty ${view.diff} of 3`} /></span>
          </div>
          <h1 className="font-display mb-3 text-xl font-bold text-white">{view.q}</h1>
          {view.code && <pre className="border-panel-border bg-panel text-fog mb-4 overflow-x-auto rounded-lg border p-3 font-mono text-sm">{view.code}</pre>}

          {view.type === 'mcq' && (
            <div className="mb-5 grid gap-2.5">
              {view.options?.map((o, i) => {
                let extra = ''
                if (fb) extra = o === fb.correctAnswer ? 'border-emerald-400! bg-emerald-400/10' : i === pick ? 'border-red-400! bg-red-400/10' : 'opacity-60'
                return (
                  <button key={o} type="button" disabled={!!fb} aria-pressed={pick === i} onClick={() => setPick(i)} className={`jr-option border-panel-border bg-panel flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-white ${extra}`}>
                    <span className="text-cyan/70 font-mono text-xs">{String.fromCharCode(65 + i)}</span>
                    <span>{o}</span>
                  </button>
                )
              })}
            </div>
          )}

          {view.type === 'typed' && (
            <input
              autoFocus
              value={text}
              disabled={!!fb}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && canSubmit && void submit(view, payload())}
              placeholder={view.placeholder}
              aria-label="Your answer"
              className="border-panel-border bg-panel focus:border-cyan mb-5 w-full rounded-lg border px-3 py-2.5 font-mono text-white outline-none"
            />
          )}

          {view.type === 'puzzle' && view.array && view.maxMoves && (
            <div className="mb-5">
              <SortPuzzle array={view.array} maxMoves={view.maxMoves} disabled={!!fb} onChange={(m) => setMoves(m)} />
              <p className="text-fog/50 mt-2 text-xs">Fewer swaps than the limit = correct. Tap a block, then a neighbour.</p>
            </div>
          )}

          {fb && (
            <div role="status" className={`jr-pop mb-5 rounded-xl border p-4 text-sm ${fb.correct ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-100' : 'border-red-400/50 bg-red-400/10 text-red-100'}`}>
              <p className="mb-1 font-bold">{fb.correct ? '✅ Correct!' : '❌ Not quite.'}</p>
              {!fb.correct && view.type !== 'puzzle' && <p className="mb-1">Answer: {fb.correctAnswer}</p>}
              {fb.detail && <p className="mb-1">{fb.detail}</p>}
              <p className="opacity-90">{fb.why}</p>
            </div>
          )}

          {error && <ErrorBox message={error} />}
          <div className="flex justify-between gap-3">
            {view.type === 'puzzle' && !fb ? (
              <button className={ghostBtn} disabled={busy} onClick={() => void submit(view, { skipped: true })}>SKIP</button>
            ) : !fb ? (
              <button className="text-fog/50 hover:text-fog font-mono text-xs underline" disabled={busy} onClick={() => void leave()}>Leave skill check</button>
            ) : <span />}
            {fb ? (
              <button className={`${primaryBtn} ${shown?.finished ? 'jr-glow' : ''}`} onClick={next}>{shown?.finished ? 'SEE MY RESULTS ▶' : 'NEXT ▶'}</button>
            ) : (
              <button className={primaryBtn} disabled={!canSubmit} onClick={() => void submit(view, payload())}>{busy ? 'CHECKING...' : 'LOCK IN ▶'}</button>
            )}
          </div>
        </div>
      </GradientCard>
    </JourneyPage>
  )
}
