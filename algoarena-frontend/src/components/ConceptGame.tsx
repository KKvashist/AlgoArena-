import { useEffect, useMemo, useRef, useState } from 'react'
import type { ClickGameSpec, FillGameSpec, GameSpec, PointerGameSpec, WindowGameSpec } from '../data/games'
import './ConceptGame.css'
import ConceptCard from './ConceptCard'

export default function ConceptGame({ spec, title }: { spec: GameSpec; title: string }) {
  return (
    <div className="cg-shell">
      <div className="cg-head">
        <span className="cg-mission">MISSION</span>
        <span className="cg-title">{title}</span>
      </div>
      <Body spec={spec} title={title} />
    </div>
  )
}

function Body({ spec, title }: { spec: GameSpec; title: string }) {
  switch (spec.kind) {
    case 'click':
      return <ClickGame spec={spec} title={title} />
    case 'pointers':
      return <PointersGame spec={spec} title={title} />
    case 'window':
      return <WindowGame spec={spec} title={title} />
    case 'fill':
      return <FillGame spec={spec} title={title} />
    case 'memo':
      return <MemoGame title={title} />
  }
}

/* ================= SHARED GAME-FEEL PIECES ================= */
const CONFETTI = ['#22d3ee', '#8b5cf6', '#fbbf24', '#34d399', '#f472b6']

function Confetti() {
  return (
    <div className="cg-confetti" aria-hidden="true">
      {Array.from({ length: 30 }, (_, i) => (
        <span
          key={i}
          style={{
            left: `${(i * 37) % 100}%`,
            background: CONFETTI[i % CONFETTI.length],
            animationDelay: `${(i % 8) * 0.07}s`,
            animationDuration: `${1.4 + (i % 5) * 0.25}s`,
          }}
        />
      ))}
    </div>
  )
}

function Stars({ mistakes }: { mistakes: number }) {
  const n = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1
  return (
    <div className="cg-stars" aria-label={`${n} out of 3 stars`}>
      {[0, 1, 2].map((i) => (
        <span key={i} className={i < n ? 'on' : ''} style={{ animationDelay: `${i * 0.2}s` }}>★</span>
      ))}
    </div>
  )
}

function Bar({ value, max }: { value: number; max: number }) {
  return (
    <div className="cg-progress">
      <span style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
    </div>
  )
}

function Hearts({ lost }: { lost: number }) {
  return (
    <span className="cg-hearts" aria-label={`${Math.max(0, 3 - lost)} lives`}>
      {[0, 1, 2].map((i) => (
        <span key={i} className={i < lost ? 'cg-heart lost' : 'cg-heart'}>♥</span>
      ))}
    </span>
  )
}

/* ================= CLICK GAME ================= */
function ClickGame({ spec, title }: { spec: ClickGameSpec; title: string }) {
  const [ri, setRi] = useState(0)
  const [picked, setPicked] = useState<string[]>([])
  const [wrong, setWrong] = useState<string | null>(null)
  const [mistakes, setMistakes] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [finished, setFinished] = useState(false)
  const [combo, setCombo] = useState(0)

  const round = spec.rounds[ri]
  const solved = picked.length === round.answer.length
  const byId = Object.fromEntries(spec.nodes.map((n) => [n.id, n]))

  const click = (id: string) => {
    if (solved || picked.includes(id)) return
    const ok = round.ordered ? round.answer[picked.length] === id : round.answer.includes(id)
    if (ok) {
      setPicked([...picked, id])
      setWrong(null)
      setCombo((c) => c + 1)
    } else {
      setWrong(id)
      setMistakes((m) => m + 1)
      setCombo(0)
      setShowHint(true)
      window.setTimeout(() => setWrong(null), 500)
    }
  }

  const next = () => {
    if (ri + 1 >= spec.rounds.length) {
      setFinished(true)
      return
    }
    setRi(ri + 1)
    setPicked([])
    setShowHint(false)
  }

  const restart = () => {
    setRi(0)
    setPicked([])
    setWrong(null)
    setMistakes(0)
    setCombo(0)
    setShowHint(false)
    setFinished(false)
  }

  if (finished) {
    return (
      <div className="cg-box cg-center cg-win">
        <Confetti />
        <h4>🎉 Mission complete!</h4>
        <Stars mistakes={mistakes} />
        <p className="cg-big">{mistakes === 0 ? 'Perfect run' : `${mistakes} wrong click${mistakes > 1 ? 's' : ''}`}</p>
        <p className="cg-xp">+{Math.max(10, spec.rounds.length * 10 - mistakes * 2)} XP</p>
        <ConceptCard name={title} />
        <button className="cg-btn" onClick={restart}>Play again</button>
      </div>
    )
  }

  return (
    <div className="cg-box">
      <Bar value={ri + (solved ? 1 : 0)} max={spec.rounds.length} />
      <div className="cg-stats">
        <span>Round {ri + 1}/{spec.rounds.length}</span>
        <Hearts lost={mistakes} />
        {combo >= 2 && <span className="cg-combo">🔥 x{combo}</span>}
      </div>
      <h4 className="cg-prompt">{round.prompt}</h4>

      <svg viewBox="0 0 400 220" className="cg-svg" role="img" aria-label="Game board">
        {spec.edges.map((e) => {
          const a = byId[e.from]
          const b = byId[e.to]
          return (
            <g key={`${e.from}-${e.to}`}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={`cg-edge${picked.includes(e.from) && picked.includes(e.to) ? ' lit' : ''}`} />
              {spec.weights && e.w !== undefined && (
                <text x={(a.x + b.x) / 2 + 6} y={(a.y + b.y) / 2 - 4} className="cg-w">{e.w}</text>
              )}
            </g>
          )
        })}
        {spec.nodes.map((n) => {
          const order = picked.indexOf(n.id)
          const cls = `cg-node${order >= 0 ? ' done' : ''}${wrong === n.id ? ' wrong' : ''}`
          return (
            <g
              key={n.id}
              className={cls}
              role="button"
              tabIndex={0}
              aria-label={`${n.label}${n.sub ? ` ${n.sub}` : ''}${order >= 0 ? ', selected' : ''}`}
              aria-pressed={order >= 0}
              onClick={() => click(n.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  click(n.id)
                }
              }}
            >
              {n.shape === 'box' ? (
                <rect x={n.x - 22} y={n.y - 20} width={44} height={40} rx={6} />
              ) : (
                <circle cx={n.x} cy={n.y} r={18} />
              )}
              <text x={n.x} y={n.y} textAnchor="middle" dominantBaseline="central" className="cg-label">{n.label}</text>
              {n.sub && <text x={n.x} y={n.y + 34} textAnchor="middle" className="cg-sub">{n.sub}</text>}
              {round.ordered && order >= 0 && <text x={n.x + 17} y={n.y - 15} className="cg-badge">{order + 1}</text>}
            </g>
          )
        })}
      </svg>

      {!solved && (
        <button className="cg-link" onClick={() => setShowHint(!showHint)}>{showHint ? 'Hide hint' : '💡 Show hint'}</button>
      )}
      {showHint && !solved && <p className="cg-hint">{round.hint}</p>}
      {solved && (
        <>
          <p className="cg-ok">✅ {round.explain}</p>
          <button className="cg-btn" onClick={next}>{ri + 1 >= spec.rounds.length ? 'Finish' : 'Next round →'}</button>
        </>
      )}
    </div>
  )
}

/* ================= TWO POINTERS ================= */
function PointersGame({ spec, title }: { spec: PointerGameSpec; title: string }) {
  const [pi, setPi] = useState(0)
  const puzzle = spec.puzzles[pi]
  const [l, setL] = useState(0)
  const [r, setR] = useState(puzzle.arr.length - 1)
  const [mistakes, setMistakes] = useState(0)
  const [steps, setSteps] = useState(0)
  const [msg, setMsg] = useState('')
  const [allDone, setAllDone] = useState(false)

  const sum = puzzle.arr[l] + puzzle.arr[r]
  const won = sum === puzzle.target

  const load = (i: number) => {
    setPi(i)
    setL(0)
    setR(spec.puzzles[i].arr.length - 1)
    setMistakes(0)
    setSteps(0)
    setMsg('')
  }

  const move = (dir: 'L' | 'R') => {
    if (won) return
    const need = sum < puzzle.target ? 'L' : 'R'
    if (dir !== need) {
      setMistakes((m) => m + 1)
      setMsg(
        sum < puzzle.target
          ? `Sum ${sum} is too SMALL. Moving the right pointer left makes it even smaller. Move the LEFT pointer right to get a bigger sum.`
          : `Sum ${sum} is too BIG. Moving the left pointer right makes it even bigger. Move the RIGHT pointer left to get a smaller sum.`,
      )
      return
    }
    setSteps((s) => s + 1)
    setMsg(sum < puzzle.target ? `${sum} < ${puzzle.target}, so we need a bigger sum.` : `${sum} > ${puzzle.target}, so we need a smaller sum.`)
    if (dir === 'L') setL(l + 1)
    else setR(r - 1)
  }

  if (allDone) {
    return (
      <div className="cg-box cg-center cg-win">
        <Confetti />
        <h4>🎉 Both puzzles solved!</h4>
        <Stars mistakes={mistakes} />
        <p className="cg-muted">You found each pair without any nested loop. That is O(n).</p>
        <p className="cg-xp">+20 XP</p>
        <ConceptCard name={title} />
        <button className="cg-btn" onClick={() => { setAllDone(false); load(0) }}>Play again</button>
      </div>
    )
  }

  return (
    <div className="cg-box">
      <Bar value={pi + (won ? 1 : 0)} max={spec.puzzles.length} />
      <div className="cg-stats">
        <span>Puzzle {pi + 1}/{spec.puzzles.length}</span>
        <span>Steps {steps}</span>
        <Hearts lost={mistakes} />
      </div>
      <h4 className="cg-prompt">Find two numbers that add up to {puzzle.target}</h4>
      <p className="cg-muted">The array is sorted. Decide which pointer to move each time.</p>

      <div className="cg-array">
        {puzzle.arr.map((v, i) => (
          <div key={i} className="cg-cellwrap">
            <div className="cg-ptr">{i === l ? 'L' : ''}{i === r ? 'R' : ''}</div>
            <div className={`cg-cell${i === l || i === r ? ' active' : ''}${won && (i === l || i === r) ? ' win' : ''}${i < l || i > r ? ' dim' : ''}`}>{v}</div>
            <div className="cg-idx">[{i}]</div>
          </div>
        ))}
      </div>

      <p className="cg-sum">{puzzle.arr[l]} + {puzzle.arr[r]} = <b>{sum}</b> {won ? '🎯' : sum < puzzle.target ? '(too small)' : '(too big)'}</p>

      {!won && (
        <div className="cg-row">
          <button className="cg-btn" onClick={() => move('L')}>Move L → (bigger sum)</button>
          <button className="cg-btn" onClick={() => move('R')}>← Move R (smaller sum)</button>
        </div>
      )}
      {msg && !won && <p className="cg-hint">{msg}</p>}
      {won && (
        <>
          <p className="cg-ok">✅ Found it: {puzzle.arr[l]} + {puzzle.arr[r]} = {puzzle.target} in {steps} steps. Each step threw away one candidate for good.</p>
          <button className="cg-btn" onClick={() => (pi + 1 < spec.puzzles.length ? load(pi + 1) : setAllDone(true))}>
            {pi + 1 < spec.puzzles.length ? 'Next puzzle →' : 'Finish'}
          </button>
        </>
      )}
    </div>
  )
}

/* ================= SLIDING WINDOW ================= */
function WindowGame({ spec, title }: { spec: WindowGameSpec; title: string }) {
  const { arr, k } = spec
  const sums = useMemo(() => {
    const out: number[] = []
    for (let s = 0; s + k <= arr.length; s++) out.push(arr.slice(s, s + k).reduce((a, b) => a + b, 0))
    return out
  }, [arr, k])

  const [s, setS] = useState(0)
  const [score, setScore] = useState(0)
  const [tries, setTries] = useState(0)
  const [msg, setMsg] = useState('')

  const last = sums.length - 1
  const done = s === last
  const best = Math.max(...sums)

  const guess = (g: 'up' | 'down' | 'same') => {
    if (done) return
    const cur = sums[s]
    const nxt = sums[s + 1]
    const actual = nxt > cur ? 'up' : nxt < cur ? 'down' : 'same'
    setTries((t) => t + 1)
    if (g === actual) setScore((x) => x + 1)
    setMsg(`${g === actual ? '✅' : '❌'} The window drops ${arr[s]} and adds ${arr[s + k]}: ${cur} − ${arr[s]} + ${arr[s + k]} = ${nxt}. No need to re-add the whole window.`)
    setS(s + 1)
  }

  const restart = () => { setS(0); setScore(0); setTries(0); setMsg('') }

  return (
    <div className="cg-box">
      <Bar value={s} max={last} />
      <div className="cg-stats">
        <span>Window size k = {k}</span>
        <span>Correct guesses {score}/{tries}</span>
      </div>
      <h4 className="cg-prompt">Slide the window and predict: will the sum go up or down?</h4>

      <div className="cg-array">
        {arr.map((v, i) => (
          <div key={i} className="cg-cellwrap">
            <div className="cg-ptr" />
            <div className={`cg-cell${i >= s && i < s + k ? ' active' : ''}${done && sums[s] === best && i >= s && i < s + k ? ' win' : ''}`}>{v}</div>
            <div className="cg-idx">[{i}]</div>
          </div>
        ))}
      </div>

      <p className="cg-sum">Current window [{s}..{s + k - 1}] sum = <b>{sums[s]}</b></p>

      {!done ? (
        <div className="cg-row">
          <button className="cg-btn" onClick={() => guess('up')}>▲ Goes up</button>
          <button className="cg-btn" onClick={() => guess('same')}>＝ Same</button>
          <button className="cg-btn" onClick={() => guess('down')}>▼ Goes down</button>
        </div>
      ) : (
        <>
          <div className="cg-win">
            <Confetti />
            <Stars mistakes={tries - score} />
            <p className="cg-xp">+{10 + score * 5} XP</p>
          </div>
          <p className="cg-ok">🏁 Reached the end. The best window sum seen was <b>{best}</b> (starting at index {sums.indexOf(best)}). You scanned the array once, so O(n).</p>
          <ConceptCard name={title} />
          <button className="cg-btn" onClick={restart}>Play again</button>
        </>
      )}
      {msg && <p className="cg-hint">{msg}</p>}
    </div>
  )
}

/* ================= FILL THE TABLE ================= */
function FillGame({ spec, title }: { spec: FillGameSpec; title: string }) {
  const [vals, setVals] = useState<(number | null)[]>(() => spec.cells.map((c) => c.given ?? null))
  const [input, setInput] = useState('')
  const [mistakes, setMistakes] = useState(0)
  const [revealWork, setRevealWork] = useState(false)
  const [finalInput, setFinalInput] = useState('')
  const [finalDone, setFinalDone] = useState(false)
  const [finalWrong, setFinalWrong] = useState(false)

  const active = vals.findIndex((v) => v === null)
  const tableDone = active === -1
  const cell = active >= 0 ? spec.cells[active] : null

  // On narrow screens the table scrolls sideways; keep the cell being filled in view.
  const tableRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const box = tableRef.current
    const el = box?.querySelector<HTMLElement>('.cg-col.current')
    if (box && el) box.scrollTo({ left: Math.max(0, el.offsetLeft - box.clientWidth / 2 + el.offsetWidth / 2), behavior: 'smooth' })
  }, [active])

  const submit = () => {
    if (!cell || input.trim() === '') return
    if (Number(input) === cell.answer) {
      setVals(vals.map((v, i) => (i === active ? cell.answer : v)))
      setInput('')
      setRevealWork(false)
    } else {
      setMistakes((m) => m + 1)
      setRevealWork(true)
    }
  }

  const submitFinal = () => {
    if (!spec.final || finalInput.trim() === '') return
    if (Number(finalInput) === spec.final.answer) {
      setFinalDone(true)
      setFinalWrong(false)
    } else {
      setMistakes((m) => m + 1)
      setFinalWrong(true)
    }
  }

  const restart = () => {
    setVals(spec.cells.map((c) => c.given ?? null))
    setInput('')
    setMistakes(0)
    setRevealWork(false)
    setFinalInput('')
    setFinalDone(false)
    setFinalWrong(false)
  }

  const complete = tableDone && (!spec.final || finalDone)

  return (
    <div className="cg-box">
      <Bar value={vals.filter((v) => v !== null).length} max={spec.cells.length} />
      <div className="cg-stats">
        <span>{vals.filter((v) => v !== null).length}/{spec.cells.length} cells</span>
        <Hearts lost={mistakes} />
      </div>
      <h4 className="cg-prompt">{spec.intro}</h4>

      <div className="cg-table" ref={tableRef}>
        {spec.cells.map((c, i) => (
          <div key={c.label} className={`cg-col${i === active ? ' current' : ''}`}>
            <div className="cg-top">{c.top ?? ''}</div>
            <div className="cg-name">{c.label}</div>
            <div className="cg-val">{vals[i] ?? '?'}</div>
          </div>
        ))}
      </div>

      {cell && (
        <div className="cg-fillbox">
          <p>Fill <b>{cell.label}</b></p>
          <p className="cg-rule">{cell.rule}</p>
          <div className="cg-row">
            <input
              className="cg-input"
              inputMode="numeric"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="value"
              aria-label={`Value for ${cell.label}`}
              autoFocus
            />
            <button className="cg-btn" onClick={submit}>Check</button>
          </div>
          {revealWork && <p className="cg-hint">❌ Not quite. Work it out: {cell.work}</p>}
        </div>
      )}

      {tableDone && spec.final && !finalDone && (
        <div className="cg-fillbox">
          <p>{spec.final.q}</p>
          <div className="cg-row">
            <input
              className="cg-input"
              inputMode="numeric"
              value={finalInput}
              onChange={(e) => setFinalInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitFinal()}
              placeholder="answer"
              aria-label="Final answer"
            />
            <button className="cg-btn" onClick={submitFinal}>Check</button>
          </div>
          {finalWrong && <p className="cg-hint">❌ Not yet. Look at the table you just built.</p>}
        </div>
      )}

      {finalDone && spec.final && <p className="cg-ok">✅ {spec.final.explain}</p>}
      {complete && (
        <>
          <div className="cg-win">
            <Confetti />
            <Stars mistakes={mistakes} />
            <p className="cg-xp">+{Math.max(10, 30 - mistakes * 3)} XP</p>
          </div>
          <p className="cg-ok">🎉 Done with {mistakes} mistake{mistakes === 1 ? '' : 's'}.</p>
          <ConceptCard name={title} />
          <button className="cg-btn" onClick={restart}>Play again</button>
        </>
      )}
    </div>
  )
}

/* ================= MEMO SIMULATOR ================= */
function MemoGame({ title }: { title: string }) {
  const [n, setN] = useState(6)

  const { naive, memo, counts } = useMemo(() => {
    const counts: number[] = Array(n + 1).fill(0)
    let naive = 0
    const slow = (x: number): number => {
      naive++
      counts[x]++
      return x < 2 ? x : slow(x - 1) + slow(x - 2)
    }
    slow(n)

    let memo = 0
    const cache = new Map<number, number>()
    const fast = (x: number): number => {
      memo++
      const hit = cache.get(x)
      if (hit !== undefined) return hit
      const v = x < 2 ? x : fast(x - 1) + fast(x - 2)
      cache.set(x, v)
      return v
    }
    fast(n)
    return { naive, memo, counts }
  }, [n])

  return (
    <div className="cg-box">
      <h4 className="cg-prompt">See how much work is repeated when you compute fib({n}) without remembering answers</h4>
      <label className="cg-slider">
        n = <b>{n}</b>
        <input type="range" min={2} max={20} value={n} onChange={(e) => setN(Number(e.target.value))} />
      </label>

      <div className="cg-compare">
        <div>
          <p className="cg-muted">Plain recursion</p>
          <div className="cg-barwrap"><div className="cg-bar bad" style={{ width: '100%' }} /></div>
          <p className="cg-big">{naive.toLocaleString()} calls</p>
        </div>
        <div>
          <p className="cg-muted">With memoization</p>
          <div className="cg-barwrap"><div className="cg-bar good" style={{ width: `${Math.max(2, (memo / naive) * 100)}%` }} /></div>
          <p className="cg-big">{memo} calls</p>
        </div>
      </div>

      <p className="cg-muted">How many times each subproblem was computed (plain recursion):</p>
      <div className="cg-chips">
        {counts.map((c, k) => (k <= n ? <span key={k} className={`cg-chip${c > 1 ? ' rep' : ''}`}>fib({k}) × {c}</span> : null))}
      </div>
      <p className="cg-ok">💡 The same small problems are solved again and again. That is “overlapping subproblems”. Drag the slider up to see plain recursion explode while memoization grows by only about 2 calls per step.</p>
      <ConceptCard name={title} compact />
    </div>
  )
}

export type { GameSpec }
