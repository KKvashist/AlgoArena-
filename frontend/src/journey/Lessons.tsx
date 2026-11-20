import { Fragment, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { lessons as LESSONS, type Block, type Lesson } from '../data/lessons'
import { useJourney } from '../context/JourneyContext'
import { findRealm } from './paths'
import { ArrayViz, FrameView } from './viz'
import type { RealmView } from './types'

/** **bold** and `code` inside lesson text. */
function rich(text: string): ReactNode {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) =>
    part.startsWith('**') ? <strong key={i} className="text-white">{part.slice(2, -2)}</strong>
      : part.startsWith('`') ? <code key={i} className="bg-violet/20 text-amber rounded px-1.5 py-0.5 font-mono text-[0.85em]">{part.slice(1, -1)}</code>
      : <Fragment key={i}>{part}</Fragment>,
  )
}

const Card = ({ title, tone = 'cyan', children }: { title?: string; tone?: 'cyan' | 'amber' | 'red' | 'violet'; children: ReactNode }) => {
  const border = { cyan: 'border-cyan/30', amber: 'border-amber/40', red: 'border-red-400/40', violet: 'border-violet/40' }[tone]
  return (
    <div className={`bg-panel rounded-2xl border ${border} p-5`}>
      {title && <h3 className="font-display mb-3 text-lg font-bold text-white">{title}</h3>}
      {children}
    </div>
  )
}

function DryRun({ block }: { block: Extract<Block, { t: 'dryrun' }> }) {
  const [i, setI] = useState(0)
  const last = block.steps.length - 1
  const step = block.steps[i]
  return (
    <Card title={`🔬 ${block.title}`} tone="amber">
      {block.code && <pre className="mb-4 overflow-x-auto rounded-lg border border-white/10 bg-black/60 p-3 font-mono text-xs leading-relaxed text-emerald-200"><code>{block.code}</code></pre>}
      <div data-testid="dryrun-frame"><FrameView frame={step.frame} /></div>
      <p className="border-amber/30 bg-amber/5 text-fog mt-3 rounded-lg border px-3 py-2 text-sm" aria-live="polite" data-testid="dryrun-note">
        <span className="text-amber mr-2 font-mono text-xs">STEP {i + 1}/{block.steps.length}</span>{rich(step.note)}
      </p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <button className="border-panel-border text-fog/80 rounded-lg border px-4 py-1.5 text-sm disabled:opacity-30" disabled={i === 0} onClick={() => setI(i - 1)}>← Prev</button>
        <div className="flex gap-1" aria-hidden="true">{block.steps.map((_, k) => <span key={k} className={`h-1.5 w-5 rounded-full ${k <= i ? 'bg-amber' : 'bg-white/10'}`} />)}</div>
        <button className="from-amber to-amber/70 text-void rounded-lg bg-gradient-to-r px-4 py-1.5 text-sm font-bold disabled:opacity-30" disabled={i === last} onClick={() => setI(i + 1)} data-testid="dryrun-next">Next step →</button>
      </div>
    </Card>
  )
}

function Explore({ block }: { block: Extract<Block, { t: 'explore' }> }) {
  const [pick, setPick] = useState<number | null>(null)
  return (
    <Card title={`🧭 ${block.title ?? 'Explore'}`} tone="violet">
      <ArrayViz frame={block.frame} picked={pick} onPick={setPick} />
      <p className="text-fog mt-2 min-h-6 text-sm" aria-live="polite">
        {pick === null ? block.caption : <>You picked <code className="text-amber font-mono">arr[{pick}]</code> and its value is <strong className="text-white">{block.frame.cells[pick]}</strong>. It is the {pick + 1}{['st', 'nd', 'rd'][pick] ?? 'th'} box, but its index is {pick}.</>}
      </p>
    </Card>
  )
}

function BlockView({ block }: { block: Block }) {
  switch (block.t) {
    case 'text': return <Card title={block.title}><p className="text-fog leading-relaxed">{rich(block.body)}</p></Card>
    case 'points': return <Card title={block.title ?? 'Key points'}><ul className="text-fog list-disc space-y-2 pl-5">{block.items.map((x, i) => <li key={i}>{rich(x)}</li>)}</ul></Card>
    case 'diagram': return <Card title={block.title ?? 'Diagram'}><FrameView frame={block.frame} />{block.caption && <p className="text-fog/70 mt-2 text-sm">{rich(block.caption)}</p>}</Card>
    case 'explore': return <Explore block={block} />
    case 'dryrun': return <DryRun key={block.title} block={block} />
    case 'code': return <Card title={block.title ?? 'Code'}><pre className="overflow-x-auto rounded-lg border border-white/10 bg-black/60 p-3 font-mono text-xs leading-relaxed text-emerald-200"><code>{block.code}</code></pre></Card>
    case 'complexity': return (
      <Card title="⏱ Time and space complexity">
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="text-fog/50 font-mono text-xs"><th className="pb-2 pr-3">Operation</th><th className="pb-2 pr-3">Cost</th><th className="pb-2">Why</th></tr></thead>
          <tbody>{block.rows.map(([a, b, c]) => <tr key={a} className="border-t border-white/10 align-top"><td className="py-2 pr-3 text-white">{a}</td><td className="text-cyan py-2 pr-3 font-mono whitespace-nowrap">{b}</td><td className="text-fog/80 py-2">{c}</td></tr>)}</tbody></table></div>
      </Card>
    )
    case 'mistakes': return <Card title="⚠️ Common mistakes" tone="red"><ul className="text-fog list-disc space-y-2 pl-5">{block.items.map((x, i) => <li key={i}>{rich(x)}</li>)}</ul></Card>
    case 'interview': return <Card title="💼 Interview notes" tone="violet"><ul className="text-fog list-disc space-y-2 pl-5">{block.items.map((x, i) => <li key={i}>{rich(x)}</li>)}</ul></Card>
  }
}

function Checkpoint({ lesson, onPass, busy }: { lesson: Lesson; onPass: () => void; busy: boolean }) {
  const [picked, setPicked] = useState<Record<number, number>>({})
  const right = (qi: number) => picked[qi] === lesson.checkpoint[qi].answer
  const allRight = lesson.checkpoint.every((_, i) => right(i))
  return (
    <Card title="✅ Knowledge checkpoint" tone="amber">
      <p className="text-fog/70 mb-4 text-sm">Answer both questions correctly to finish this lesson. A wrong answer explains why, then you can try again.</p>
      <div className="space-y-5">
        {lesson.checkpoint.map((c, qi) => (
          <div key={qi} data-testid={`check-${qi}`}>
            <p className="mb-2 font-semibold text-white">{qi + 1}. {c.q}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {c.options.map((o, oi) => {
                const chosen = picked[qi] === oi
                const cls = !chosen ? 'border-panel-border text-fog/80 hover:border-cyan/50' : oi === c.answer ? 'border-emerald-400 bg-emerald-400/10 text-emerald-100' : 'border-red-400 bg-red-400/10 text-red-100'
                return <button key={oi} type="button" disabled={right(qi)} onClick={() => setPicked({ ...picked, [qi]: oi })} className={`rounded-lg border px-3 py-2 text-left text-sm ${cls}`}>{o}</button>
              })}
            </div>
            {picked[qi] !== undefined && <p className={`mt-2 text-sm ${right(qi) ? 'text-emerald-200' : 'text-red-200'}`} role="status">{right(qi) ? '✔ Correct. ' : '✖ Not quite. '}{c.why}</p>}
          </div>
        ))}
      </div>
      <button className="from-cyan to-violet text-void font-display mt-5 rounded-lg bg-gradient-to-r px-6 py-2.5 font-bold disabled:opacity-40" disabled={!allRight || busy} onClick={onPass} data-testid="finish-lesson">
        {busy ? 'SAVING...' : 'FINISH LESSON ▶'}
      </button>
    </Card>
  )
}

function Reader({ slug, lesson, index, total, realm, startStep, onExit, onOpenNext }: {
  slug: string; lesson: Lesson; index: number; total: number; realm: RealmView | undefined; startStep: number
  onExit: () => void; onOpenNext: (id: string) => void
}) {
  const { completeLesson, saveLessonPosition, lastCompletion, clearCompletion } = useJourney()
  const steps = lesson.blocks.length + 1 // the last step is the checkpoint
  const [step, setStep] = useState(Math.min(startStep, steps - 1))
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const saved = realm && realm.state !== 'locked'
  const nextLesson = LESSONS[slug][index + 1]

  const go = (n: number) => {
    setStep(n)
    if (saved) void saveLessonPosition(slug, lesson.id, n)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function finish() {
    setBusy(true)
    setError('')
    try {
      if (saved) await completeLesson(slug, lesson.id)
      setDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your progress.')
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    const learned = lastCompletion?.missionId.endsWith(':learn') ? lastCompletion : null
    return (
      <div className="space-y-4 text-center" data-testid="lesson-done">
        <h2 className="font-display text-2xl font-bold text-white">🎉 Lesson complete: {lesson.title}</h2>
        {learned && (
          <div role="status" className="rounded-xl border border-emerald-400/50 bg-emerald-400/10 p-4 text-emerald-100">
            <p className="font-bold">All lessons done! {learned.xp && `+${learned.xp.gained} XP`}</p>
            <p className="text-sm">The Breach game is now unlocked. Time to apply what you learned.</p>
          </div>
        )}
        <div className="flex flex-wrap justify-center gap-3">
          {nextLesson && <button className="from-cyan to-violet text-void rounded-lg bg-gradient-to-r px-5 py-2.5 font-bold" onClick={() => { clearCompletion(); onOpenNext(nextLesson.id) }}>NEXT LESSON ▶</button>}
          {learned && <Link to={`/topic/${slug}?tab=learn&mission=${slug}:game`} onClick={clearCompletion} className="from-amber to-amber/70 text-void rounded-lg bg-gradient-to-r px-5 py-2.5 font-bold" data-testid="to-game">GO TO THE GAME ▶</Link>}
          <button className="border-panel-border text-fog/80 rounded-lg border px-5 py-2.5" onClick={() => { clearCompletion(); onExit() }}>Back to lessons</button>
        </div>
      </div>
    )
  }

  const onCheck = step === steps - 1
  return (
    <div data-testid="lesson-reader">
      <div className="mb-4 flex items-center justify-between gap-3">
        <button className="text-cyan font-mono text-sm underline" onClick={onExit}>← all lessons</button>
        <p className="text-fog/50 font-mono text-xs">LESSON {index + 1}/{total} · ≈ {lesson.minutes} min</p>
      </div>
      <h2 className="font-display mb-1 text-2xl font-bold text-white">{lesson.title}</h2>
      <div className="mb-5 flex items-center gap-1" role="progressbar" aria-valuemin={0} aria-valuemax={steps} aria-valuenow={step + 1}>
        {Array.from({ length: steps }, (_, i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-cyan' : 'bg-white/10'}`} />)}
      </div>
      {!saved && <p className="mb-3 rounded-lg border border-amber/40 bg-amber/10 px-3 py-2 text-sm text-amber">This topic is still locked in your roadmap, so you can read it but your progress is not saved yet.</p>}
      <div key={`${lesson.id}:${step}`} className="space-y-4">
        {onCheck ? <Checkpoint lesson={lesson} onPass={() => void finish()} busy={busy} /> : <BlockView block={lesson.blocks[step]} />}
      </div>
      {error && <p role="alert" className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
      <div className="mt-5 flex justify-between gap-3">
        <button className="border-panel-border text-fog/80 rounded-lg border px-5 py-2 disabled:opacity-30" disabled={step === 0} onClick={() => go(step - 1)}>← Back</button>
        {!onCheck && <button className="from-cyan to-violet text-void rounded-lg bg-gradient-to-r px-6 py-2 font-bold" onClick={() => go(step + 1)} data-testid="lesson-next">{step === steps - 2 ? 'CHECKPOINT ▶' : 'NEXT ▶'}</button>}
      </div>
    </div>
  )
}

const STAGES = [
  { key: 'learn', label: 'Learn', hint: 'Lessons' },
  { key: 'examples', label: 'Examples', hint: 'Dry runs' },
  { key: 'videos', label: 'Videos', hint: 'Optional' },
  { key: 'game', label: 'Game', hint: 'Apply it' },
  { key: 'practice', label: 'Practice', hint: 'Problems' },
  { key: 'quiz', label: 'Quiz', hint: 'Prove it' },
  { key: 'complete', label: 'Complete', hint: 'XP + unlock' },
] as const

function Sequence({ slug, realm }: { slug: string; realm: RealmView | undefined }) {
  const m = (t: string) => realm?.missions.find((x) => x.type === t)
  const lessonsDone = realm?.lessons ? realm.lessons.done.length >= realm.lessons.ids.length || !!m('learn')?.done : false
  const status = (k: string): 'done' | 'open' | 'locked' | 'optional' => {
    if (k === 'learn' || k === 'examples') return lessonsDone ? 'done' : 'open'
    if (k === 'videos') return 'optional'
    if (k === 'complete') return realm?.state === 'completed' ? 'done' : 'locked'
    const mm = m(k)
    return !mm ? 'optional' : mm.done ? 'done' : mm.locked ? 'locked' : 'open'
  }
  const tone = { done: 'border-emerald-400/50 bg-emerald-400/10 text-emerald-200', open: 'border-cyan bg-cyan/10 text-white', locked: 'border-white/10 text-fog/40', optional: 'border-white/15 text-fog/60 border-dashed' }
  const icon = { done: '✔', open: '▶', locked: '🔒', optional: '○' }
  return (
    <ol className="mb-5 flex flex-wrap gap-2" aria-label="Learning sequence" data-testid="sequence">
      {STAGES.map((s, i) => {
        const st = status(s.key)
        const target = s.key === 'videos' ? 'videos' : s.key === 'game' ? 'learn' : s.key === 'practice' ? 'practice' : s.key === 'quiz' ? 'game' : 'lessons'
        return (
          <li key={s.key} data-stage={s.key} data-status={st}>
            <Link to={`/topic/${slug}?tab=${target}`} className={`block rounded-xl border px-3 py-1.5 text-xs ${tone[st]}`}>
              <span className="font-mono">{i + 1}. {icon[st]} {s.label}</span><span className="text-fog/40 ml-1">· {s.hint}</span>
            </Link>
          </li>
        )
      })}
    </ol>
  )
}

export default function Lessons({ slug }: { slug: string }) {
  const { journey, status } = useJourney()
  const [params, setParams] = useSearchParams()
  const list = LESSONS[slug] ?? []
  const realm = findRealm(journey, slug)
  const progress = realm?.lessons
  const openId = params.get('lesson')
  const open = list.find((l) => l.id === openId)

  const setLesson = (id: string | null) => {
    const p = new URLSearchParams(params)
    if (id) p.set('lesson', id)
    else p.delete('lesson')
    setParams(p, { replace: true })
  }

  if (list.length === 0) return <p className="text-fog/60">Lessons for this topic are not available yet. Notes and videos are in the other tabs.</p>

  // wait for the saved journey so the reader can resume and save from the first render
  if (open && status === 'loading') return <p className="text-fog/60" data-testid="lessons-loading">Loading your progress…</p>

  if (open) {
    const index = list.indexOf(open)
    const resume = progress?.current === open.id ? progress.step : 0
    return <Reader key={open.id} slug={slug} lesson={open} index={index} total={list.length} realm={realm} startStep={resume} onExit={() => setLesson(null)} onOpenNext={setLesson} />
  }

  const learnDone = !!realm?.missions.find((m) => m.type === 'learn')?.done
  const gameM = realm?.missions.find((m) => m.type === 'game')
  return (
    <div data-testid="lesson-list">
      <Sequence slug={slug} realm={realm} />
      {progress?.skipped && <p className="mb-4 rounded-lg border border-cyan/30 bg-cyan/5 px-3 py-2 text-sm text-cyan">You passed the quiz before the lessons, so they were marked as already known. You can still read any lesson.</p>}
      {gameM?.locked && <p className="mb-4 rounded-lg border border-amber/40 bg-amber/10 px-3 py-2 text-sm text-amber" data-testid="game-lock-note">🔒 The Breach game unlocks after you finish the lessons below.</p>}
      {learnDone && !progress?.skipped && <p className="mb-4 rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">✔ Lessons complete. You can revisit any of them whenever you like.</p>}
      <div className="grid gap-4">
        {list.map((l, i) => {
          const done = progress?.done.includes(l.id)
          const current = progress?.current === l.id && !done
          return (
            <button key={l.id} type="button" onClick={() => setLesson(l.id)} data-lesson={l.id} className={`bg-panel hover:border-cyan/60 rounded-2xl border p-5 text-left transition ${done ? 'border-emerald-400/40' : current ? 'border-cyan/60' : 'border-panel-border'}`}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-fog/50 font-mono text-xs">LESSON {i + 1} · ≈ {l.minutes} min</p>
                <span className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] ${done ? 'border-emerald-400/40 text-emerald-200' : current ? 'border-cyan/50 text-cyan' : 'border-white/15 text-fog/50'}`}>{done ? '✔ DONE · REVISIT' : current ? (progress && progress.step > 0 ? 'CONTINUE' : 'UP NEXT') : 'START'}</span>
              </div>
              <h3 className="font-display mt-1 text-xl font-bold text-white">{l.title}</h3>
              <p className="text-fog/70 mt-1 text-sm">{l.summary}</p>
            </button>
          )
        })}
      </div>
      <div className="mt-5 flex flex-wrap gap-3 text-sm">
        <Link to={`/topic/${slug}?tab=videos`} className="text-cyan underline">🎬 Video lessons</Link>
        <Link to={`/topic/${slug}?tab=notes`} className="text-cyan underline">📝 Reference notes</Link>
      </div>
    </div>
  )
}
