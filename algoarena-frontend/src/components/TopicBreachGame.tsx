import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Topic } from '../data/topics'
import { games } from '../data/games'
import ConceptCard from './ConceptCard'
import type { ClickGameSpec, FillGameSpec } from '../data/games'

/* ============================================================
   TOPIC BREACH: shared full-screen cyberpunk engine.
   Each concept of a topic becomes a level. Last level = boss.
   ============================================================ */

type Props = {
  topic: Topic
  startAt?: number
  onComplete?: (xp: number) => void
  onExit: () => void
}
type Screen = 'menu' | 'levels' | 'how' | 'play' | 'victory'
type Status = 'intro' | 'playing' | 'won' | 'lost'
type Tone = 'info' | 'good' | 'bad'
type Sfx = 'good' | 'bad' | 'tick' | 'win'
type Burst = { id: number; x: number; y: number; dx: number; dy: number; color: string }
type Ctx = {
  active: boolean
  hurt: (m?: string) => void
  say: (t: string, tone?: Tone) => void
  burst: (x: number, y: number, color?: string, n?: number) => void
  sfx: (k: Sfx) => void
  win: (text?: string) => void
}
type Level =
  | { name: string; desc: string; kind: 'click'; spec: ClickGameSpec }
  | { name: string; desc: string; kind: 'fill'; spec: FillGameSpec }

const C = { void: '#0a0e17', cyan: '#2de2e6', violet: '#8b5cf6', amber: '#ffb627', red: '#ff4d6d', green: '#34d399' }

/* ---------------- levels from the existing game data ---------------- */
function buildLevels(topic: Topic): Level[] {
  const out: Level[] = []
  for (const c of topic.concepts) {
    const spec = games[`${topic.slug}:${c.name}`]
    if (!spec) continue
    if (spec.kind === 'click') out.push({ name: c.name, desc: c.desc, kind: 'click', spec })
    else if (spec.kind === 'fill') out.push({ name: c.name, desc: c.desc, kind: 'fill', spec })
    else if (spec.kind === 'memo') {
      const m = games['dynamic-programming:Memoization']
      if (m && m.kind === 'click') {
        out.push({
          name: c.name,
          desc: c.desc,
          kind: 'click',
          spec: {
            kind: 'click',
            nodes: m.nodes,
            edges: m.edges,
            rounds: [
              {
                prompt: 'This is the call tree of fib(5). Click every call that REPEATS work already done elsewhere in the tree.',
                hint: 'f3, f2 and f1 each appear twice. Calls run left to right, so click the later (right-hand) copies.',
                answer: ['f1c', 'f2c', 'f3c'],
                ordered: false,
                explain: 'The second f1, f2 and f3 recompute values we already have. That repeated work is what memoization removes.',
              },
            ],
          },
        })
      }
    }
  }
  return out
}

const levelTime = (l: Level) =>
  l.kind === 'click'
    ? 40 + l.spec.rounds.reduce((n, r) => n + r.answer.length, 0) * 8
    : 40 + (l.spec.cells.filter((c) => c.given === undefined).length + (l.spec.final ? 1 : 0)) * 12

/* ---------------- fullscreen ---------------- */
type FsEl = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void }
type FsDoc = Document & { webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => void }
async function enterFs(el: HTMLElement) {
  try {
    const e = el as FsEl
    if (el.requestFullscreen) await el.requestFullscreen()
    else if (e.webkitRequestFullscreen) await e.webkitRequestFullscreen()
  } catch {
    /* overlay already fills the viewport */
  }
}
async function leaveFs() {
  try {
    const d = document as FsDoc
    if (d.fullscreenElement) await d.exitFullscreen()
    else if (d.webkitFullscreenElement) d.webkitExitFullscreen?.()
  } catch {
    /* ignore */
  }
}

/* ---------------- styles ---------------- */
const CSS = `
.tb-root{font-family:'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace;color:#c7d2e0;user-select:none;-webkit-user-select:none}
.tb-root *{box-sizing:border-box}
.tb-abs{position:absolute;inset:0}
@keyframes tb-grid{to{background-position:0 48px}}
.tb-gridbg{background-image:linear-gradient(rgba(45,226,230,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(45,226,230,.07) 1px,transparent 1px);background-size:48px 48px;animation:tb-grid 4s linear infinite}
@keyframes tb-rise{0%{transform:translateY(0);opacity:0}10%{opacity:.9}90%{opacity:.9}100%{transform:translateY(-105vh);opacity:0}}
.tb-float{position:absolute;bottom:-10px;border-radius:50%;animation:tb-rise linear infinite}
@keyframes tb-twinkle{0%,100%{opacity:.25}50%{opacity:.9}}
.tb-city{flex:1;margin-right:2px;animation:tb-twinkle 4s ease-in-out infinite;background-color:#0d1424;background-image:radial-gradient(circle,rgba(255,182,39,.55) 1px,transparent 1.6px);background-size:12px 16px}
@keyframes tb-shake{0%,100%{transform:none}15%{transform:translate(-9px,4px)}30%{transform:translate(8px,-5px)}45%{transform:translate(-6px,-3px)}60%{transform:translate(5px,5px)}75%{transform:translate(-3px,2px)}}
.tb-shake{animation:tb-shake .45s}
@keyframes tb-flash{0%{opacity:.6}100%{opacity:0}}
.tb-flash{position:absolute;inset:0;background:radial-gradient(circle,transparent 40%,rgba(255,77,109,.75));pointer-events:none;animation:tb-flash .5s ease-out forwards;z-index:70}
@keyframes tb-burst{0%{transform:translate(0,0) scale(1);opacity:1}100%{transform:translate(var(--dx),var(--dy)) scale(.2);opacity:0}}
.tb-p{position:fixed;width:8px;height:8px;margin:-4px 0 0 -4px;border-radius:2px;pointer-events:none;z-index:120;animation:tb-burst .85s ease-out forwards}
@keyframes tb-in{0%{opacity:0;transform:translateY(6px)}100%{opacity:1;transform:none}}
@keyframes tb-title{0%,100%{text-shadow:0 0 12px rgba(45,226,230,.8),0 0 40px rgba(45,226,230,.4)}50%{text-shadow:2px 0 rgba(255,77,109,.8),-2px 0 rgba(45,226,230,.9),0 0 50px rgba(139,92,246,.7)}}
.tb-title{animation:tb-title 3s ease-in-out infinite}
@keyframes tb-intro{0%{opacity:0;transform:translateX(-70px)}20%,80%{opacity:1;transform:none}100%{opacity:0;transform:translateX(70px)}}
@keyframes tb-pulse{0%,100%{opacity:1}50%{opacity:.45}}
@keyframes tb-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
.tb-btn{width:min(86vw,320px);padding:14px 22px;font-family:inherit;font-size:15px;font-weight:700;letter-spacing:.22em;color:${C.cyan};background:rgba(19,26,42,.75);border:1px solid rgba(45,226,230,.45);border-radius:12px;cursor:pointer;transition:all .2s}
.tb-btn:hover{background:rgba(45,226,230,.14);box-shadow:0 0 26px rgba(45,226,230,.4);transform:translateX(6px)}
.tb-btn-p{background:linear-gradient(90deg,${C.cyan},${C.violet});color:${C.void};border-color:transparent;box-shadow:0 0 30px rgba(45,226,230,.35)}
.tb-panel{background:linear-gradient(160deg,#131a2a,#0a0e17);border:1px solid rgba(45,226,230,.4);border-radius:20px;box-shadow:0 0 60px rgba(45,226,230,.2);padding:28px;max-width:min(92vw,520px);width:100%;max-height:94dvh;overflow-y:auto;text-align:center;animation:tb-in .3s ease-out}
.tb-overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(5,8,14,.78);backdrop-filter:blur(4px);z-index:80}
.tb-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 16px;border-bottom:1px solid rgba(45,226,230,.25);background:linear-gradient(90deg,#131a2a,#0a0e17)}
.tb-ico{width:36px;height:36px;border-radius:8px;border:1px solid #334155;color:${C.cyan};background:rgba(19,26,42,.8);cursor:pointer;font-size:13px}
.tb-lvl{height:100%;overflow-y:auto;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:12px}
.tb-read{font-size:13px;letter-spacing:.05em;text-align:center;padding:8px 16px;border:1px solid rgba(45,226,230,.25);border-radius:14px;background:rgba(19,26,42,.75);max-width:min(94vw,820px);line-height:1.5}
.tb-bar{width:min(86vw,420px)}
.tb-bar-top{display:flex;justify-content:space-between;font-size:10px;letter-spacing:.2em}
.tb-bar-track{height:10px;margin-top:4px;border-radius:999px;border:1px solid;overflow:hidden;background:#101726}
.tb-bar-fill{height:100%;transition:width .5s}
.tb-foot{display:flex;flex-direction:column;align-items:center;gap:8px;padding:10px 12px calc(10px + env(safe-area-inset-bottom));border-top:1px solid rgba(45,226,230,.25);background:linear-gradient(0deg,#131a2a,#0a0e17)}
.tb-status{font-size:13px;font-weight:600;text-align:center;padding:7px 16px;border:1px solid;border-radius:10px;background:rgba(10,14,23,.8);max-width:min(94vw,820px);animation:tb-in .25s ease-out}
.tb-keys{font-size:10px;letter-spacing:.12em;color:rgba(199,210,224,.45);text-align:center;text-transform:uppercase}
.tb-pad{min-width:58px;height:44px;padding:0 16px;border-radius:12px;border:1px solid rgba(45,226,230,.4);background:rgba(19,26,42,.9);color:${C.cyan};font-weight:700;font-size:15px;font-family:inherit;cursor:pointer;touch-action:manipulation;transition:all .15s}
.tb-pad:hover{background:rgba(45,226,230,.12);box-shadow:0 0 16px rgba(45,226,230,.3)}
.tb-pad:active{transform:scale(.95)}
.tb-pad-p{background:linear-gradient(90deg,${C.cyan},${C.violet});color:${C.void};border-color:transparent}
.tb-node{cursor:pointer;outline:none}
.tb-node:hover circle,.tb-node:focus circle{filter:brightness(1.5)}
.tb-cells{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;max-width:min(94vw,900px)}
.tb-cell{min-width:78px;padding:8px 10px;border-radius:12px;border:2px solid;text-align:center;background:rgba(19,26,42,.8)}
.tb-cell small{display:block;font-size:10px;opacity:.7;letter-spacing:.08em}
.tb-cell b{display:block;font-size:24px;margin-top:2px;min-height:30px}
`

/* ---------------- hooks ---------------- */
function useKeys(active: boolean, fn: (e: KeyboardEvent) => void) {
  const ref = useRef(fn)
  useEffect(() => {
    ref.current = fn
  })
  useEffect(() => {
    if (!active) return
    const h = (e: KeyboardEvent) => {
      if ([' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) e.preventDefault()
      if (e.repeat && e.key === 'Enter') return
      ref.current(e)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [active])
}

/* ---------------- small UI ---------------- */
const Btn = ({ label, onClick, primary }: { label: string; onClick: () => void; primary?: boolean }) => (
  <button type="button" onClick={onClick} className={`tb-btn ${primary ? 'tb-btn-p' : ''}`}>
    {label}
  </button>
)

const PadBtn = ({ label, onClick, primary }: { label: string; onClick: () => void; primary?: boolean }) => (
  <button type="button" tabIndex={-1} onMouseDown={(e) => e.preventDefault()} onClick={onClick} className={`tb-pad ${primary ? 'tb-pad-p' : ''}`}>
    {label}
  </button>
)

function Bar({ done, total, boss }: { done: number; total: number; boss: boolean }) {
  const frac = total ? done / total : 0
  const col = boss ? C.red : C.cyan
  const pct = boss ? (1 - frac) * 100 : frac * 100
  return (
    <div className="tb-bar">
      <div className="tb-bar-top" style={{ color: col }}>
        <span>{boss ? 'NULL // CORE' : 'BREACH PROGRESS'}</span>
        <span>{boss ? `HP ${total - done}/${total}` : `${done}/${total}`}</span>
      </div>
      <div className="tb-bar-track" style={{ borderColor: col + '88' }}>
        <div
          className="tb-bar-fill"
          style={{ width: `${pct}%`, background: boss ? `linear-gradient(90deg,${C.red},${C.amber})` : `linear-gradient(90deg,${C.cyan},${C.violet})`, boxShadow: `0 0 12px ${col}` }}
        />
      </div>
    </div>
  )
}

/* ============================================================
   CLICK LEVEL: click nodes of a tree / graph in the game world
   ============================================================ */
function ClickLevel({ spec, ctx, boss }: { spec: ClickGameSpec; ctx: Ctx; boss: boolean }) {
  const [r, setR] = useState(0)
  const [picked, setPicked] = useState<string[]>([])
  const [miss, setMiss] = useState(0)
  const [bad, setBad] = useState<string | null>(null)
  const [roundDone, setRoundDone] = useState(false)

  const R = spec.rounds[r]
  const total = spec.rounds.reduce((n, x) => n + x.answer.length, 0)
  const before = spec.rounds.slice(0, r).reduce((n, x) => n + x.answer.length, 0)
  const last = r === spec.rounds.length - 1

  const click = (id: string, x?: number, y?: number) => {
    if (!ctx.active || roundDone || picked.includes(id)) return
    const ok = R.ordered ? R.answer[picked.length] === id : R.answer.includes(id)
    if (ok) {
      const np = [...picked, id]
      setPicked(np)
      if (x !== undefined && y !== undefined) ctx.burst(x, y, C.green, 14)
      ctx.sfx('good')
      if (np.length === R.answer.length) {
        setRoundDone(true)
        if (last) {
          ctx.say(R.explain, 'good')
          ctx.win(R.explain)
        } else {
          ctx.say(`${R.explain} Press Enter for the next round.`, 'good')
        }
      }
    } else {
      setBad(id)
      window.setTimeout(() => setBad(null), 500)
      setMiss((m) => m + 1)
      if (x !== undefined && y !== undefined) ctx.burst(x, y, C.red, 10)
      ctx.hurt(miss >= 1 ? `Hint: ${R.hint}` : 'Wrong node. Check the rule and try again.')
    }
  }

  const next = () => {
    if (!ctx.active || !roundDone || last) return
    setR((v) => v + 1)
    setPicked([])
    setMiss(0)
    setRoundDone(false)
    ctx.say('')
  }

  useKeys(ctx.active, (e) => {
    if (e.key === 'Enter') next()
  })

  const xs = spec.nodes.map((n) => n.x)
  const ys = spec.nodes.map((n) => n.y)
  const minX = Math.min(...xs) - 40
  const minY = Math.min(...ys) - 40
  const w = Math.max(...xs) + 40 - minX
  const h = Math.max(...ys) + 40 - minY
  const byId = new Map(spec.nodes.map((n) => [n.id, n]))

  return (
    <div className="tb-lvl">
      <Bar done={before + picked.length} total={total} boss={boss} />
      <div className="tb-read">
        <span style={{ color: C.violet }}>
          ROUND {r + 1}/{spec.rounds.length} ·{' '}
        </span>
        {R.prompt}
        <div style={{ fontSize: 11, color: C.amber, marginTop: 4 }}>
          {R.ordered ? `ORDER MATTERS · STEP ${Math.min(picked.length + 1, R.answer.length)}/${R.answer.length}` : `SELECT ALL · ${picked.length}/${R.answer.length}`}
        </div>
      </div>
      <svg viewBox={`${minX} ${minY} ${w} ${h}`} style={{ width: 'min(94vw,780px)', maxHeight: '52vh', filter: 'drop-shadow(0 0 18px rgba(45,226,230,.15))' }}>
        {spec.edges.map((e, i) => {
          const a = byId.get(e.from)
          const b = byId.get(e.to)
          if (!a || !b) return null
          return (
            <g key={i}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={C.cyan} strokeOpacity={0.35} strokeWidth={2} />
              {spec.weights && e.w !== undefined && (
                <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 5} fill={C.amber} fontSize={12} fontWeight={700} textAnchor="middle">
                  {e.w}
                </text>
              )}
            </g>
          )
        })}
        {spec.nodes.map((n) => {
          const idx = picked.indexOf(n.id)
          const isPicked = idx >= 0
          const col = bad === n.id ? C.red : isPicked ? C.green : C.cyan
          return (
            <g
              key={n.id}
              className="tb-node"
              tabIndex={0}
              role="button"
              onClick={(e) => click(n.id, e.clientX, e.clientY)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  const rect = (e.currentTarget as SVGGElement).getBoundingClientRect()
                  click(n.id, rect.left + rect.width / 2, rect.top + rect.height / 2)
                }
              }}
            >
              <circle cx={n.x} cy={n.y} r={20} fill="#0a0e17" stroke={col} strokeWidth={3} style={{ filter: `drop-shadow(0 0 8px ${col})` }} />
              <text x={n.x} y={n.y + 5} textAnchor="middle" fill={col} fontSize={14} fontWeight={700}>
                {n.label}
              </text>
              {R.ordered && isPicked && (
                <text x={n.x + 18} y={n.y - 16} fill={C.amber} fontSize={11} fontWeight={700}>
                  #{idx + 1}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      {roundDone && !last && <PadBtn primary label="NEXT ROUND ▶" onClick={next} />}
    </div>
  )
}

/* ============================================================
   FILL LEVEL: fill a DP / prefix table cell by cell
   ============================================================ */
type Entry = { k: 'cell'; i: number } | { k: 'final' }

function FillLevel({ spec, ctx, boss }: { spec: FillGameSpec; ctx: Ctx; boss: boolean }) {
  const entries = useMemo(() => {
    const out: Entry[] = []
    spec.cells.forEach((c, i) => {
      if (c.given === undefined) out.push({ k: 'cell', i })
    })
    if (spec.final) out.push({ k: 'final' })
    return out
  }, [spec])

  const [e, setE] = useState(0)
  const [buf, setBuf] = useState('')
  const [miss, setMiss] = useState(0)
  const [filled, setFilled] = useState<number[]>([])

  const finished = e >= entries.length
  const cur = finished ? null : entries[e]

  const submit = () => {
    if (!ctx.active || !cur || buf === '') return
    const n = parseInt(buf, 10)
    const answer = cur.k === 'cell' ? spec.cells[cur.i].answer : spec.final!.answer
    const cx = window.innerWidth / 2
    const cy = window.innerHeight * 0.4
    if (n === answer) {
      if (cur.k === 'cell') setFilled((f) => [...f, cur.i])
      setBuf('')
      setMiss(0)
      const ne = e + 1
      setE(ne)
      ctx.burst(cx, cy, C.green, 18)
      ctx.sfx('good')
      const text = cur.k === 'cell' ? `${spec.cells[cur.i].label} = ${spec.cells[cur.i].work}` : spec.final!.explain
      if (ne >= entries.length) {
        ctx.say(text, 'good')
        ctx.win(text)
      } else {
        ctx.say(text, 'good')
      }
    } else {
      setBuf('')
      setMiss((m) => m + 1)
      ctx.burst(cx, cy, C.red, 10)
      const hint = cur.k === 'cell' ? `Rule: ${spec.cells[cur.i].rule}` : `Hint: ${spec.final!.q}`
      ctx.hurt(miss >= 1 ? hint : 'Not quite. Re-check the earlier cells and try again.')
    }
  }

  useKeys(ctx.active && !finished, (ev) => {
    if (/^[0-9]$/.test(ev.key)) setBuf((b) => (b + ev.key).slice(0, 4))
    else if (ev.key === 'Backspace') setBuf((b) => b.slice(0, -1))
    else if (ev.key === 'Enter') submit()
  })

  return (
    <div className="tb-lvl">
      <Bar done={Math.min(e, entries.length)} total={entries.length} boss={boss} />
      <div className="tb-read">{spec.intro}</div>
      <div className="tb-cells">
        {spec.cells.map((c, i) => {
          const isCur = cur?.k === 'cell' && cur.i === i
          const known = c.given !== undefined || filled.includes(i)
          const col = known ? C.green : isCur ? C.amber : '#475569'
          return (
            <div key={i} className="tb-cell" style={{ borderColor: col, color: col, boxShadow: isCur ? `0 0 18px ${C.amber}88` : 'none' }}>
              <small>{c.label}</small>
              {c.top && <small>{c.top}</small>}
              <b>{known ? c.answer : isCur ? buf || '_' : '?'}</b>
            </div>
          )
        })}
      </div>
      {cur?.k === 'final' && (
        <div className="tb-read" style={{ borderColor: C.amber, color: C.amber }}>
          FINAL BOSS QUESTION: {spec.final!.q}
          <div style={{ fontSize: 22, marginTop: 6 }}>{buf || '_'}</div>
        </div>
      )}
      {cur && (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6, maxWidth: 420 }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => (
            <PadBtn key={d} label={String(d)} onClick={() => ctx.active && setBuf((b) => (b + d).slice(0, 4))} />
          ))}
          <PadBtn label="⌫" onClick={() => setBuf((b) => b.slice(0, -1))} />
          <PadBtn primary label="ENTER" onClick={submit} />
        </div>
      )}
    </div>
  )
}

/* ============================================================
   BACKDROP
   ============================================================ */
const PARTS = Array.from({ length: 28 }, (_, i) => ({
  i,
  l: (i * 37 + 11) % 100,
  s: 2 + ((i * 5) % 4),
  c: [C.cyan, C.violet, C.amber][i % 3],
  d: 9 + ((i * 7) % 10),
  dl: (i * 3) % 12,
}))
const SKY = [40, 70, 55, 95, 60, 120, 80, 50, 110, 65, 90, 45, 130, 70, 55, 100, 85, 60, 115, 75]

function Backdrop() {
  return (
    <div className="tb-abs" style={{ overflow: 'hidden' }}>
      <div className="tb-abs tb-gridbg" style={{ opacity: 0.7 }} />
      <div
        className="tb-abs"
        style={{ background: 'radial-gradient(ellipse at 50% 25%, rgba(139,92,246,.25), transparent 60%), radial-gradient(ellipse at 50% 100%, rgba(45,226,230,.2), transparent 55%)' }}
      />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '40vh', display: 'flex', alignItems: 'flex-end', opacity: 0.8 }}>
        {SKY.map((h, i) => (
          <div key={i} className="tb-city" style={{ height: `${h * 0.75}%`, borderTop: `2px solid ${i % 2 ? C.cyan : C.violet}`, animationDelay: `${(i % 5) * 0.7}s` }} />
        ))}
      </div>
      {PARTS.map((p) => (
        <span
          key={p.i}
          className="tb-float"
          style={{ left: `${p.l}%`, width: p.s, height: p.s, background: p.c, boxShadow: `0 0 10px ${p.c}`, animationDuration: `${p.d}s`, animationDelay: `-${p.dl}s` }}
        />
      ))}
    </div>
  )
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

/* ============================================================
   INNER GAME
   ============================================================ */
function Inner({ topic, levels, startAt, onComplete, onExit }: Props & { levels: Level[] }) {
  const [screen, setScreen] = useState<Screen>('menu')
  const [lvl, setLvl] = useState(0)
  const [run, setRun] = useState(0)
  const [status, setStatusState] = useState<Status>('intro')
  const [paused, setPaused] = useState(false)
  const [hearts, setHearts] = useState(3)
  const [time, setTime] = useState(60)
  const [score, setScore] = useState(0)
  const [msg, setMsg] = useState<{ t: string; tone: Tone } | null>(null)
  const [shaking, setShaking] = useState(false)
  const [flash, setFlash] = useState(0)
  const [bursts, setBursts] = useState<Burst[]>([])
  const [loss, setLoss] = useState('')
  const [reward, setReward] = useState<{ xp: number; pts: number } | null>(null)
  const [winText, setWinText] = useState('')
  const [ready, setReady] = useState(false)
  const [finalXp, setFinalXp] = useState(0)

  const rootRef = useRef<HTMLDivElement>(null)
  const statusRef = useRef<Status>('intro')
  const screenRef = useRef<Screen>('menu')
  const heartsRef = useRef(3)
  const timeRef = useRef(60)
  const lvlRef = useRef(0)
  const xpRef = useRef(0)
  const doneRef = useRef(false)
  const msgTimer = useRef<number | undefined>(undefined)
  const burstId = useRef(0)
  const audio = useRef<AudioContext | null>(null)
  const enterRef = useRef<() => void>(() => {})

  useEffect(() => {
    screenRef.current = screen
  })

  const setStat = useCallback((s: Status) => {
    statusRef.current = s
    setStatusState(s)
  }, [])

  const sfx = useCallback((k: Sfx) => {
    try {
      const W = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }
      const AC = W.AudioContext ?? W.webkitAudioContext
      if (!AC) return
      if (!audio.current) audio.current = new AC()
      const ac = audio.current
      const notes = k === 'good' ? [660, 880] : k === 'bad' ? [180, 120] : k === 'tick' ? [440] : [523, 659, 784, 1047]
      notes.forEach((f, i) => {
        const o = ac.createOscillator()
        const g = ac.createGain()
        o.type = k === 'bad' ? 'sawtooth' : 'square'
        o.frequency.value = f
        g.gain.value = 0.05
        g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + i * 0.09 + 0.16)
        o.connect(g)
        g.connect(ac.destination)
        o.start(ac.currentTime + i * 0.09)
        o.stop(ac.currentTime + i * 0.09 + 0.18)
      })
    } catch {
      /* ignore */
    }
  }, [])

  const say = useCallback((t: string, tone: Tone = 'info') => {
    if (msgTimer.current) window.clearTimeout(msgTimer.current)
    if (!t) {
      setMsg(null)
      return
    }
    setMsg({ t, tone })
    msgTimer.current = window.setTimeout(() => setMsg(null), 6000)
  }, [])

  const burst = useCallback((x: number, y: number, color: string = C.cyan, n = 16) => {
    const items: Burst[] = Array.from({ length: n }, () => {
      const a = Math.random() * Math.PI * 2
      const d = 40 + Math.random() * 90
      return { id: ++burstId.current, x, y, dx: Math.cos(a) * d, dy: Math.sin(a) * d, color }
    })
    setBursts((b) => [...b, ...items])
    window.setTimeout(() => setBursts((b) => b.filter((p) => !items.includes(p))), 900)
  }, [])

  const lose = useCallback(
    (reason: string) => {
      if (statusRef.current !== 'playing') return
      setLoss(reason)
      setStat('lost')
      sfx('bad')
    },
    [setStat, sfx],
  )

  const hurt = useCallback(
    (m?: string) => {
      if (statusRef.current !== 'playing') return
      heartsRef.current -= 1
      setHearts(heartsRef.current)
      sfx('bad')
      setFlash((f) => f + 1)
      setShaking(true)
      window.setTimeout(() => setShaking(false), 450)
      if (m) say(m, 'bad')
      if (heartsRef.current <= 0) lose('Integrity reached zero. NULL corrupted your run.')
    },
    [lose, say, sfx],
  )

  const win = useCallback(
    (text?: string) => {
      if (statusRef.current !== 'playing') return
      setStat('won')
      const h = heartsRef.current
      const last = lvlRef.current === levels.length - 1
      const xp = 15 + h * 5 + (last ? 40 : 0)
      const pts = 100 + h * 50 + timeRef.current * 3
      xpRef.current += xp
      setScore((s) => s + pts)
      setReward({ xp, pts })
      setWinText(text ?? '')
      sfx('win')
      window.setTimeout(() => setReady(true), 900)
    },
    [levels.length, setStat, sfx],
  )

  const ctx: Ctx = { active: screen === 'play' && status === 'playing' && !paused, hurt, say, burst, sfx, win }

  /* ---- flow ---- */
  const startLevel = (i: number) => {
    lvlRef.current = i
    heartsRef.current = 3
    timeRef.current = levelTime(levels[i])
    setLvl(i)
    setRun((r) => r + 1)
    setHearts(3)
    setTime(timeRef.current)
    setMsg(null)
    setPaused(false)
    setLoss('')
    setReward(null)
    setReady(false)
    setStat('intro')
    setScreen('play')
  }
  const startGame = (i: number) => {
    if (rootRef.current && !document.fullscreenElement) void enterFs(rootRef.current)
    xpRef.current = 0
    setScore(0)
    doneRef.current = false
    startLevel(i)
  }
  const exitGame = () => {
    void leaveFs()
    onExit()
  }
  const finish = () => {
    setFinalXp(xpRef.current)
    setScreen('victory')
    if (!doneRef.current) {
      doneRef.current = true
      onComplete?.(xpRef.current)
    }
  }
  const nextLevel = () => {
    if (lvl >= levels.length - 1) finish()
    else startLevel(lvl + 1)
  }

  useEffect(() => {
    enterRef.current = () => {
      if (paused) setPaused(false)
      else if (status === 'won' && ready) nextLevel()
      else if (status === 'lost') startLevel(lvl)
    }
  })

  /* jump straight into a level when launched from a concept card */
  useEffect(() => {
    if (startAt !== undefined) startGame(Math.max(0, Math.min(levels.length - 1, startAt)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (screen !== 'play' || status !== 'intro' || paused) return
    const id = window.setTimeout(() => setStat('playing'), 1800)
    return () => window.clearTimeout(id)
  }, [screen, status, paused, run, setStat])

  useEffect(() => {
    if (screen !== 'play' || status !== 'playing' || paused) return
    const id = window.setInterval(() => {
      timeRef.current = Math.max(0, timeRef.current - 1)
      setTime(timeRef.current)
      if (timeRef.current <= 0) lose('Time ran out. The system re-encrypted itself.')
    }, 1000)
    return () => window.clearInterval(id)
  }, [screen, status, paused, lose])

  useEffect(() => {
    const onFs = () => {
      const d = document as FsDoc
      const on = !!(d.fullscreenElement || d.webkitFullscreenElement)
      if (!on && screenRef.current === 'play' && (statusRef.current === 'playing' || statusRef.current === 'intro')) setPaused(true)
    }
    document.addEventListener('fullscreenchange', onFs)
    document.addEventListener('webkitfullscreenchange', onFs)
    return () => {
      document.removeEventListener('fullscreenchange', onFs)
      document.removeEventListener('webkitfullscreenchange', onFs)
    }
  }, [])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const sc = screenRef.current
      if (sc !== 'play') {
        if (e.key === 'Escape') {
          if (sc === 'menu' || sc === 'victory') exitGame()
          else setScreen('menu')
        }
        return
      }
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (statusRef.current === 'playing' || statusRef.current === 'intro') setPaused((p) => !p)
      } else if (e.key === 'Enter') enterRef.current()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (screen !== 'victory') return
    let n = 0
    const id = window.setInterval(() => {
      burst(Math.random() * window.innerWidth, Math.random() * window.innerHeight * 0.7, [C.cyan, C.violet, C.amber][n % 3], 26)
      if (++n > 12) window.clearInterval(id)
    }, 350)
    sfx('win')
    return () => window.clearInterval(id)
  }, [screen, burst, sfx])

  const L = levels[lvl]
  const isBoss = lvl === levels.length - 1
  const lowTime = time <= 10 && status === 'playing'
  const title = topic.title.toUpperCase()

  const footColor = msg?.tone === 'bad' ? C.red : msg?.tone === 'good' ? C.green : C.cyan

  return (
    <div
      ref={rootRef}
      className="tb-root"
      style={{ position: 'fixed', inset: 0, zIndex: 2147483000, width: '100vw', height: '100dvh', background: C.void, overflow: 'hidden' }}
    >
      <style>{CSS}</style>

      {/* MENU */}
      {screen === 'menu' && (
        <div className="tb-abs" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 26, padding: 16 }}>
          <Backdrop />
          <div style={{ position: 'relative', textAlign: 'center' }}>
            <p style={{ fontSize: 11, letterSpacing: '.4em', color: C.violet, marginBottom: 8 }}>// VECTOR CITY · {topic.icon} SECTOR</p>
            <h1 className="tb-title" style={{ fontSize: 'clamp(36px,9vw,72px)', fontWeight: 900, lineHeight: 1, color: C.cyan, letterSpacing: '.06em' }}>
              {title}
              <br />
              <span style={{ color: '#fff' }}>BREACH</span>
            </h1>
            <p style={{ maxWidth: 440, margin: '14px auto 0', fontSize: 12, lineHeight: 1.6, color: '#94a3b8' }}>{topic.tagline}</p>
          </div>
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <Btn primary label="▶ PLAY GAME" onClick={() => startGame(0)} />
            <Btn label="LEVEL SELECT" onClick={() => setScreen('levels')} />
            <Btn label="HOW TO PLAY" onClick={() => setScreen('how')} />
            <Btn label="✕ EXIT GAME" onClick={exitGame} />
          </div>
        </div>
      )}

      {/* LEVEL SELECT */}
      {screen === 'levels' && (
        <div className="tb-abs" style={{ overflowY: 'auto', padding: '32px 16px' }}>
          <Backdrop />
          <div style={{ position: 'relative', maxWidth: 880, margin: '0 auto' }}>
            <p style={{ textAlign: 'center', fontSize: 11, letterSpacing: '.4em', color: C.violet }}>// SELECT MISSION</p>
            <h2 style={{ textAlign: 'center', fontSize: 30, fontWeight: 900, color: '#fff', margin: '4px 0 24px' }}>LEVEL SELECT</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12 }}>
              {levels.map((l, i) => (
                <button
                  key={l.name}
                  type="button"
                  onClick={() => startGame(i)}
                  style={{ textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer', padding: 16, borderRadius: 16, border: `1px solid ${C.cyan}66`, background: 'rgba(19,26,42,.85)', boxShadow: '0 0 20px rgba(45,226,230,.12)' }}
                >
                  <div style={{ fontSize: 28, fontWeight: 900, color: C.cyan }}>{String(i + 1).padStart(2, '0')}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.12em', color: '#fff', marginTop: 4 }}>{l.name.toUpperCase()}</div>
                  <div style={{ fontSize: 10, letterSpacing: '.2em', color: i === levels.length - 1 ? C.red : C.amber, marginTop: 8 }}>
                    {i === levels.length - 1 ? 'BOSS' : l.kind === 'click' ? 'NODE HACK' : 'TABLE HACK'}
                  </div>
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
              <Btn label="← BACK" onClick={() => setScreen('menu')} />
            </div>
          </div>
        </div>
      )}

      {/* HOW TO PLAY */}
      {screen === 'how' && (
        <div className="tb-abs" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflowY: 'auto' }}>
          <Backdrop />
          <div className="tb-panel" style={{ position: 'relative', textAlign: 'left', maxWidth: 620 }}>
            <h2 style={{ textAlign: 'center', fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 14 }}>HOW TO PLAY</h2>
            <ul style={{ fontSize: 13, lineHeight: 1.7, color: '#cbd5e1', paddingLeft: 18 }}>
              <li>Each concept is a mission. The last one is the NULL boss.</li>
              <li>
                <b style={{ color: C.cyan }}>Node hacks:</b> click nodes on the map to follow the algorithm. Order matters when the mission says so.
              </li>
              <li>
                <b style={{ color: C.cyan }}>Table hacks:</b> fill each glowing cell. Type digits and press Enter, or use the on-screen keypad.
              </li>
              <li>A wrong move costs a heart. Three hearts per mission, and the clock is always running.</li>
              <li>
                <b style={{ color: C.cyan }}>Esc</b> or <b style={{ color: C.cyan }}>P</b> pauses. <b style={{ color: C.cyan }}>Enter</b> continues.
              </li>
            </ul>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
              <Btn label="← BACK" onClick={() => setScreen('menu')} />
            </div>
          </div>
        </div>
      )}

      {/* GAMEPLAY */}
      {screen === 'play' && L && (
        <div className={`tb-abs tb-gridbg ${shaking ? 'tb-shake' : ''}`} style={{ display: 'flex', flexDirection: 'column' }}>
          <header className="tb-head">
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10, letterSpacing: '.25em', color: isBoss ? C.red : C.cyan }}>
                LEVEL {lvl + 1}/{levels.length} {isBoss ? '· BOSS' : ''}
              </div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{L.name.toUpperCase()}</div>
            </div>
            <div style={{ display: 'flex', gap: 24 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 9, letterSpacing: '.2em', color: '#64748b' }}>SCORE</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: C.amber }}>{score}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 9, letterSpacing: '.2em', color: '#64748b' }}>TIME</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: lowTime ? C.red : C.cyan, animation: lowTime ? 'tb-pulse 1s infinite' : 'none' }}>{fmt(time)}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 22, display: 'flex', gap: 2 }}>
                {[0, 1, 2].map((i) => (
                  <span key={i} style={{ color: i < hearts ? C.red : '#334155', textShadow: i < hearts ? `0 0 10px ${C.red}` : 'none', transition: 'all .3s' }}>
                    ♥
                  </span>
                ))}
              </div>
              <button type="button" className="tb-ico" title="Pause (Esc)" onClick={() => setPaused(true)}>
                ❚❚
              </button>
            </div>
          </header>
          <main style={{ flex: 1, minHeight: 0 }}>
            {L.kind === 'click' ? <ClickLevel key={run} spec={L.spec} ctx={ctx} boss={isBoss} /> : <FillLevel key={run} spec={L.spec} ctx={ctx} boss={isBoss} />}
          </main>
          <footer className="tb-foot">
            <div key={msg?.t ?? 'desc'} className="tb-status" style={{ color: footColor, borderColor: footColor + '66' }}>
              {msg ? msg.t : L.desc}
            </div>
            <div className="tb-keys">{L.kind === 'click' ? 'Click or Tab + Enter on nodes · Enter next round · Esc pause' : 'Type digits · Enter submit · Backspace delete · Esc pause'}</div>
          </footer>
        </div>
      )}

      {/* OVERLAYS */}
      {screen === 'play' && flash > 0 && <div key={flash} className="tb-flash" />}

      {screen === 'play' && L && status === 'intro' && !paused && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(5,8,14,.55)', pointerEvents: 'none' }}>
          <div key={run} style={{ textAlign: 'center', animation: 'tb-intro 1.8s ease both', padding: 16 }}>
            <div style={{ fontSize: 12, letterSpacing: '.5em', color: isBoss ? C.red : C.violet }}>{isBoss ? 'BOSS MISSION' : `MISSION ${String(lvl + 1).padStart(2, '0')}`}</div>
            <div className="tb-title" style={{ fontSize: 'clamp(28px,7vw,56px)', fontWeight: 900, marginTop: 8, color: C.cyan }}>
              {L.name.toUpperCase()}
            </div>
            <div style={{ fontSize: 13, marginTop: 8, color: C.amber, maxWidth: 520 }}>{L.desc}</div>
          </div>
        </div>
      )}

      {screen === 'play' && paused && (
        <div className="tb-overlay">
          <div className="tb-panel">
            <h2 style={{ fontSize: 30, fontWeight: 900, color: '#fff', marginBottom: 4 }}>PAUSED</h2>
            <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 20 }}>Systems frozen. NULL is waiting.</p>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <Btn primary label="RESUME" onClick={() => setPaused(false)} />
              <Btn label="RESTART LEVEL" onClick={() => startLevel(lvl)} />
              <Btn label="EXIT GAME" onClick={exitGame} />
            </div>
          </div>
        </div>
      )}

      {screen === 'play' && L && status === 'won' && ready && reward && (
        <div className="tb-overlay">
          <div className="tb-panel">
            <div style={{ fontSize: 12, letterSpacing: '.4em', color: C.green }}>{isBoss ? 'BOSS DEFEATED' : 'BREACH SUCCESSFUL'}</div>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: '8px 0' }}>{isBoss ? 'NULL DESTROYED' : 'LEVEL COMPLETE'}</h2>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: '#cbd5e1', marginBottom: 16 }}>{winText || L.desc}</p>
            <ConceptCard name={L.name} />
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, fontSize: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <span style={{ border: `1px solid ${C.amber}66`, color: C.amber, borderRadius: 999, padding: '4px 12px' }}>+{reward.xp} XP</span>
              <span style={{ border: `1px solid ${C.cyan}66`, color: C.cyan, borderRadius: 999, padding: '4px 12px' }}>+{reward.pts} PTS</span>
              <span style={{ border: `1px solid ${C.red}66`, color: C.red, borderRadius: 999, padding: '4px 12px' }}>{'♥'.repeat(hearts)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Btn primary label={isBoss ? 'CLAIM MASTER KEY' : 'NEXT LEVEL ▶'} onClick={nextLevel} />
            </div>
            <p style={{ marginTop: 12, fontSize: 10, letterSpacing: '.2em', color: '#64748b' }}>PRESS ENTER</p>
          </div>
        </div>
      )}

      {screen === 'play' && status === 'lost' && (
        <div className="tb-overlay">
          <div className="tb-panel" style={{ borderColor: C.red + '88', boxShadow: `0 0 60px ${C.red}44` }}>
            <div style={{ fontSize: 12, letterSpacing: '.4em', color: C.red }}>CONNECTION LOST</div>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: '8px 0' }}>SYSTEM FAILURE</h2>
            <p style={{ fontSize: 13, color: '#cbd5e1', marginBottom: 14 }}>{loss}</p>
            <ConceptCard name={L.name} lost />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <Btn primary label="RETRY LEVEL" onClick={() => startLevel(lvl)} />
              <Btn label="EXIT GAME" onClick={exitGame} />
            </div>
          </div>
        </div>
      )}

      {/* VICTORY */}
      {screen === 'victory' && (
        <div className="tb-abs" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 16 }}>
          <Backdrop />
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: 80, filter: `drop-shadow(0 0 30px ${C.amber})`, animation: 'tb-bob 2s ease-in-out infinite' }}>🗝</div>
            <p style={{ marginTop: 14, fontSize: 12, letterSpacing: '.5em', color: C.green }}>NULL DEFEATED</p>
            <h1 className="tb-title" style={{ fontSize: 'clamp(28px,6vw,56px)', fontWeight: 900, color: C.amber }}>
              {title} MASTERED
            </h1>
            <p style={{ maxWidth: 440, margin: '12px auto 0', fontSize: 14, color: '#cbd5e1' }}>Vector City is a little safer. You cleared every mission in this sector.</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 20, fontSize: 14, flexWrap: 'wrap' }}>
              <span style={{ border: `1px solid ${C.amber}66`, color: C.amber, borderRadius: 999, padding: '6px 16px' }}>+{finalXp} XP</span>
              <span style={{ border: `1px solid ${C.cyan}66`, color: C.cyan, borderRadius: 999, padding: '6px 16px' }}>SCORE {score}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginTop: 24 }}>
              <Btn primary label="PLAY AGAIN" onClick={() => startGame(0)} />
              <Btn label="EXIT GAME" onClick={exitGame} />
            </div>
          </div>
        </div>
      )}

      {bursts.map((p) => (
        <span
          key={p.id}
          className="tb-p"
          style={{ left: p.x, top: p.y, background: p.color, boxShadow: `0 0 8px ${p.color}`, ['--dx' as string]: `${p.dx}px`, ['--dy' as string]: `${p.dy}px` }}
        />
      ))}
    </div>
  )
}

/* ============================================================
   PUBLIC COMPONENT (portal into document.body)
   ============================================================ */
export default function TopicBreachGame(props: Props) {
  const levels = useMemo(() => buildLevels(props.topic), [props.topic])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
      // Wait a tick so a StrictMode re-mount doesn't kick us out of fullscreen.
      window.setTimeout(() => {
        if (!document.querySelector('.tb-root')) void leaveFs()
      }, 0)
    }
  }, [])

  if (levels.length === 0) {
    return createPortal(
      <div style={{ position: 'fixed', inset: 0, zIndex: 2147483000, background: C.void, color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: 'monospace' }}>
        <p>No playable missions for this topic yet.</p>
        <button type="button" onClick={props.onExit} style={{ padding: '10px 20px', borderRadius: 10, border: `1px solid ${C.cyan}`, background: 'transparent', color: C.cyan, cursor: 'pointer' }}>
          EXIT GAME
        </button>
      </div>,
      document.body,
    )
  }

  return createPortal(<Inner {...props} levels={levels} />, document.body)
}
