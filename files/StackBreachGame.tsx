import { useState, useEffect, useRef, useMemo } from "react";
import {
  Heart, Zap, Layers, Terminal, CheckCircle2, XCircle, Timer,
  RotateCcw, Trophy, ChevronRight, Hand, Ban,
} from "lucide-react";

// ---------------------------------------------------------------------
// CODING BOSS LAYERS — real in-browser test runner
// ---------------------------------------------------------------------
type Test = { args: any[]; expected: any };
type Boss = { title: string; prompt: string; starter: string; tests: Test[] };

const CODING: Boss[] = [
  {
    title: "Valid Parentheses",
    prompt: "Write solve(s) that returns true if every ( ) [ ] { } in string s is balanced and correctly nested, false otherwise.",
    starter: "function solve(s) {\n  // your code here\n}",
    tests: [
      { args: ["()"], expected: true },
      { args: ["([{}])"], expected: true },
      { args: ["([)]"], expected: false },
      { args: [""], expected: true },
      { args: ["((("], expected: false },
    ],
  },
  {
    title: "Min Stack",
    prompt: "Write solve(ops) where ops is a list like [\"push\",5], [\"pop\"], [\"getMin\"]. Return an array of every getMin result, in order.",
    starter: "function solve(ops) {\n  const stack = [];\n  const results = [];\n  for (const [cmd, val] of ops) {\n    // handle push / pop / getMin here\n  }\n  return results;\n}",
    tests: [
      { args: [[["push", 5], ["push", 3], ["getMin"], ["pop"], ["getMin"], ["push", 1], ["getMin"]]], expected: [3, 5, 1] },
      { args: [[["push", -2], ["push", 0], ["push", -3], ["getMin"], ["pop"], ["getMin"]]], expected: [-3, -2] },
    ],
  },
  {
    title: "Next Greater Element",
    prompt: "Write solve(arr) returning, for each element, the next element to its right that is greater, or -1. Aim for an O(n) monotonic-stack approach.",
    starter: "function solve(arr) {\n  // your code here\n}",
    tests: [
      { args: [[4, 5, 2, 10]], expected: [5, 10, 10, -1] },
      { args: [[1, 2, 3, 4]], expected: [2, 3, 4, -1] },
      { args: [[5, 4, 3, 2, 1]], expected: [-1, -1, -1, -1, -1] },
    ],
  },
];

function runUserCode(code: string, tests: Test[]) {
  try {
    // eslint-disable-next-line no-new-func
    const factory = new Function(`${code}\nreturn solve;`);
    const solve = factory();
    if (typeof solve !== "function") throw new Error("solve is not defined");
    return tests.map((t) => {
      let out, pass, err: string | null = null;
      try {
        out = solve(...t.args);
        pass = JSON.stringify(out) === JSON.stringify(t.expected);
      } catch (e: any) {
        err = e.message;
        pass = false;
      }
      return { ...t, out, pass, err };
    });
  } catch (e: any) {
    return tests.map((t) => ({ ...t, out: undefined, pass: false, err: e.message }));
  }
}

// ---------------------------------------------------------------------
// WAVE (Crate Catch) content
// ---------------------------------------------------------------------
type Op = ["push", number] | ["pop"];
const WAVES: { ops: Op[]; crateMs: number }[] = [
  { ops: [["push", 5], ["push", 3], ["pop"], ["push", 8], ["pop"], ["pop"]], crateMs: 3000 },
  { ops: [["push", 2], ["push", 9], ["pop"], ["push", 4], ["push", 1], ["pop"], ["pop"], ["pop"]], crateMs: 2200 },
  { ops: [["push", 6], ["pop"], ["pop"], ["push", 7], ["push", 3], ["push", 1], ["pop"], ["pop"], ["pop"], ["pop"]], crateMs: 1600 },
];

function correctActionFor(cmd: string, stackLen: number) {
  if (cmd === "push") return "PUSH";
  return stackLen === 0 ? "BLOCK" : "POP";
}

// ---------------------------------------------------------------------
// STAGE SEQUENCE
// ---------------------------------------------------------------------
type Stage =
  | { type: "wave"; wave: (typeof WAVES)[number] }
  | { type: "vault"; n: number }
  | { type: "boss"; boss: Boss };

const STAGES: Stage[] = [
  { type: "wave", wave: WAVES[0] },
  { type: "vault", n: 4 },
  { type: "boss", boss: CODING[0] },
  { type: "wave", wave: WAVES[1] },
  { type: "vault", n: 5 },
  { type: "boss", boss: CODING[1] },
  { type: "wave", wave: WAVES[2] },
  { type: "vault", n: 6 },
  { type: "boss", boss: CODING[2] },
];
const MAX_LIVES = 3;

function shuffledStack(n: number) {
  const arr = Array.from({ length: n }, (_, i) => i + 1);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function isSortedAscTopSmallest(arr: number[]) {
  for (let i = 0; i < arr.length - 1; i++) if (arr[i] < arr[i + 1]) return false;
  return true;
}

export default function StackBreachGame() {
  const [stageIdx, setStageIdx] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [xp, setXp] = useState(0);
  const stage = STAGES[stageIdx];
  const gameOver = lives <= 0;
  const gameWon = stageIdx >= STAGES.length;

  function resetGame() {
    setStageIdx(0);
    setLives(MAX_LIVES);
    setXp(0);
  }
  function nextStage(gained: number) {
    setXp((x) => x + gained);
    setStageIdx((i) => i + 1);
  }

  return (
    <div className="min-h-screen px-8 py-10 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-cyan" />
          <h1 className="text-2xl font-display font-bold text-white">Stack Breach</h1>
        </div>
        <p className="text-xs font-mono text-cyan/60">// firewall.stack</p>
      </div>
      <p className="text-sm text-fog/50 mb-6">
        3 crate-catch waves · 3 sort vaults · 3 coding boss layers.
      </p>

      {/* HUD */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className="flex items-center gap-1.5 bg-panel border border-panel-border rounded-full px-3 py-1.5">
          {Array.from({ length: MAX_LIVES }).map((_, i) => (
            <Heart key={i} size={15} className={i < lives ? "text-rose-400 fill-rose-400" : "text-fog/20"} />
          ))}
        </div>
        <div className="flex items-center gap-1.5 bg-panel border border-panel-border rounded-full px-3 py-1.5 text-sm font-mono text-violet">
          <Zap size={14} /> {xp} XP
        </div>
        <div className="flex items-center gap-1 ml-1">
          {STAGES.map((s, i) => (
            <div
              key={i}
              title={s.type}
              className={`w-2.5 h-2.5 rounded-full ${
                i < stageIdx ? "bg-cyan" : i === stageIdx ? "bg-cyan animate-pulse" : "bg-panel-border"
              }`}
            />
          ))}
        </div>
      </div>

      {gameWon ? (
        <ResultPanel win xp={xp} misses={MAX_LIVES - lives} onRetry={resetGame} />
      ) : gameOver ? (
        <ResultPanel win={false} stage={stageIdx} total={STAGES.length} onRetry={resetGame} />
      ) : stage.type === "wave" ? (
        <WavePanel key={stageIdx} wave={stage.wave} onLoseLife={() => setLives((l) => Math.max(0, l - 1))} onDone={(g) => nextStage(g)} />
      ) : stage.type === "vault" ? (
        <VaultPanel key={stageIdx} n={stage.n} onDone={(g) => nextStage(g)} />
      ) : (
        <BossPanel key={stageIdx} boss={stage.boss} onDone={(g) => nextStage(g)} />
      )}
    </div>
  );
}

function ResultPanel({
  win, xp, misses, stage, total, onRetry,
}: { win: boolean; xp?: number; misses?: number; stage?: number; total?: number; onRetry: () => void }) {
  return win ? (
    <div className="bg-panel border border-panel-border rounded-2xl p-10 text-center">
      <Trophy size={36} className="text-cyan mx-auto mb-3" />
      <div className="text-xl font-display font-bold text-white mb-1">SYSTEM COMPROMISED</div>
      <p className="text-fog/50 text-sm mb-6">All 9 stages cleared — Stack fully mastered.</p>
      <div className="flex justify-center gap-6 text-sm font-mono text-fog/60 mb-6">
        <span>{xp} XP earned</span>
        <span>{misses} mistakes made</span>
      </div>
      <button onClick={onRetry} className="inline-flex items-center gap-2 bg-cyan/10 border border-cyan/30 text-cyan px-4 py-2 rounded-full text-sm font-mono hover:bg-cyan/20">
        <RotateCcw size={14} /> Breach again
      </button>
    </div>
  ) : (
    <div className="bg-panel border border-panel-border rounded-2xl p-10 text-center">
      <XCircle size={32} className="text-rose-400 mx-auto mb-3" />
      <div className="text-xl font-display font-bold text-white mb-1">CONNECTION TERMINATED</div>
      <p className="text-fog/50 text-sm mb-6">Reached stage {(stage ?? 0) + 1}/{total} before the firewall held.</p>
      <button onClick={onRetry} className="inline-flex items-center gap-2 bg-cyan/10 border border-cyan/30 text-cyan px-4 py-2 rounded-full text-sm font-mono hover:bg-cyan/20">
        <RotateCcw size={14} /> Retry breach
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------
// WAVE PANEL
// ---------------------------------------------------------------------
function WavePanel({
  wave, onLoseLife, onDone,
}: { wave: (typeof WAVES)[number]; onLoseLife: () => void; onDone: (xp: number) => void }) {
  const [idx, setIdx] = useState(0);
  const [display, setDisplay] = useState<number[]>([]);
  const [msLeft, setMsLeft] = useState(wave.crateMs);
  const [flash, setFlash] = useState<"good" | "bad" | null>(null);
  const [score, setScore] = useState(0);
  const doneRef = useRef(false);

  const crate = wave.ops[idx];
  const correct = crate ? correctActionFor(crate[0], display.length) : null;

  useEffect(() => {
    if (!crate || doneRef.current) return;
    setMsLeft(wave.crateMs);
    const start = Date.now();
    const tick = setInterval(() => {
      const left = wave.crateMs - (Date.now() - start);
      if (left <= 0) {
        clearInterval(tick);
        resolve(null);
      } else {
        setMsLeft(left);
      }
    }, 80);
    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  function resolve(pick: string | null) {
    if (doneRef.current) return;
    const isCorrect = pick === correct;
    setFlash(isCorrect ? "good" : "bad");
    if (isCorrect) {
      setScore((s) => s + 10);
      setDisplay((d) => (crate[0] === "push" ? [...d, (crate as ["push", number])[1]] : d.slice(0, -1)));
    } else {
      onLoseLife();
    }
    setTimeout(() => {
      setFlash(null);
      if (idx + 1 >= wave.ops.length) {
        doneRef.current = true;
        onDone(score + (isCorrect ? 10 : 0));
      } else {
        setIdx((i) => i + 1);
      }
    }, 400);
  }

  const pct = Math.max(0, Math.min(100, (msLeft / wave.crateMs) * 100));

  return (
    <div className="bg-panel border border-panel-border rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Timer size={15} className="text-cyan" />
        <span className="text-sm text-fog/70">Crate Catch — crate {idx + 1}/{wave.ops.length}</span>
        <span className="ml-auto text-xs font-mono text-fog/50">score {score}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-6">
        <div>
          <div className="h-1.5 rounded-full bg-void/40 overflow-hidden mb-4">
            <div className="h-full bg-gradient-to-r from-cyan to-rose-400 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div
            className={`rounded-2xl border px-6 py-8 text-center font-mono text-lg mb-4 transition-colors ${
              flash === "good" ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-300"
              : flash === "bad" ? "border-rose-400/50 bg-rose-400/10 text-rose-300"
              : "border-panel-border bg-void/30 text-white"
            }`}
          >
            {crate ? (crate[0] === "push" ? `push(${(crate as ["push", number])[1]})` : "pop()") : "—"}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => resolve("PUSH")} disabled={!!flash} className="py-3 rounded-xl border border-cyan/30 bg-cyan/10 text-cyan text-sm font-mono font-medium hover:bg-cyan/20">PUSH</button>
            <button onClick={() => resolve("POP")} disabled={!!flash} className="py-3 rounded-xl border border-violet/30 bg-violet/10 text-violet text-sm font-mono font-medium hover:bg-violet/20">POP</button>
            <button onClick={() => resolve("BLOCK")} disabled={!!flash} className="py-3 rounded-xl border border-amber/30 bg-amber/10 text-amber text-sm font-mono font-medium hover:bg-amber/20 flex items-center justify-center gap-1">
              <Ban size={13} /> BLOCK
            </button>
          </div>
          <p className="text-[11px] text-fog/40 mt-2">BLOCK = correct call when pop() would underflow an empty stack.</p>
        </div>

        <div>
          <div className="text-xs font-mono text-fog/50 mb-2">live stack</div>
          <div className="flex flex-col-reverse gap-1 min-h-[160px] justify-start border border-panel-border rounded-xl p-2 bg-void/30">
            {display.length === 0 && <div className="text-fog/30 text-xs text-center py-4">empty</div>}
            {display.map((v, i) => (
              <div key={i} className="bg-void/50 border border-panel-border rounded-lg text-center text-sm py-1.5 text-white">
                {v}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// VAULT PANEL
// ---------------------------------------------------------------------
function VaultPanel({ n, onDone }: { n: number; onDone: (xp: number) => void }) {
  const [source, setSource] = useState<number[]>(() => shuffledStack(n));
  const [aux, setAux] = useState<number[]>([]);
  const [held, setHeld] = useState<{ from: "source" | "aux"; val: number } | null>(null);
  const [moves, setMoves] = useState(0);
  const par = n * 3;
  const solved = aux.length === 0 && source.length === n && isSortedAscTopSmallest(source);

  useEffect(() => {
    if (solved) {
      const bonus = moves <= par ? 60 : 40;
      const t = setTimeout(() => onDone(bonus), 500);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solved]);

  function lift(from: "source" | "aux") {
    if (held) return;
    const pile = from === "source" ? source : aux;
    if (pile.length === 0) return;
    const val = pile[pile.length - 1];
    if (from === "source") setSource((s) => s.slice(0, -1));
    else setAux((a) => a.slice(0, -1));
    setHeld({ from, val });
  }
  function drop(to: "source" | "aux") {
    if (!held) return;
    if (to === "source") setSource((s) => [...s, held.val]);
    else setAux((a) => [...a, held.val]);
    setHeld(null);
    setMoves((m) => m + 1);
  }
  function reset() {
    setSource(shuffledStack(n));
    setAux([]);
    setHeld(null);
    setMoves(0);
  }

  const targetPreview = useMemo(
    () => [...source, ...aux, ...(held ? [held.val] : [])].sort((a, b) => b - a),
    [source, aux, held]
  );

  return (
    <div className="bg-panel border border-panel-border rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-1">
        <Hand size={15} className="text-violet" />
        <span className="text-sm text-fog/70">Build-the-Breach — sort into ascending order, smallest on top</span>
      </div>
      <p className="text-xs font-mono text-fog/40 mb-4">
        Only the top crate of either pile can be lifted. Moves: {moves} (par {par})
      </p>

      {held && (
        <div className="mb-4 flex items-center gap-3 bg-violet/10 border border-violet/30 rounded-xl px-3 py-2">
          <span className="text-xs text-violet">holding crate [{held.val}] — drop it on:</span>
          <button onClick={() => drop("source")} className="text-xs px-3 py-1 rounded-full border border-panel-border hover:border-cyan/30 text-fog/70">Source</button>
          <button onClick={() => drop("aux")} className="text-xs px-3 py-1 rounded-full border border-panel-border hover:border-cyan/30 text-fog/70">Aux</button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <PileColumn label="Source" pile={source} onLift={() => lift("source")} disabled={!!held} />
        <PileColumn label="Aux" pile={aux} onLift={() => lift("aux")} disabled={!!held} />
      </div>

      <div className="flex items-center justify-between mt-5">
        <span className="text-[11px] font-mono text-fog/40">target: {targetPreview.join(" → ")} (top → bottom)</span>
        <button onClick={reset} className="inline-flex items-center gap-1.5 text-xs text-fog/50 hover:text-fog/80">
          <RotateCcw size={12} /> reshuffle
        </button>
      </div>

      {solved && (
        <div className="mt-4 text-sm text-emerald-300 flex items-center gap-2">
          <CheckCircle2 size={15} /> Sorted — vault breached.
        </div>
      )}
    </div>
  );
}

function PileColumn({
  label, pile, onLift, disabled,
}: { label: string; pile: number[]; onLift: () => void; disabled: boolean }) {
  return (
    <div>
      <div className="text-xs font-mono text-fog/50 mb-2">{label}</div>
      <div className="flex flex-col-reverse gap-1 min-h-[180px] border border-panel-border rounded-xl p-2 bg-void/30">
        {pile.length === 0 && <div className="text-fog/30 text-xs text-center py-4">empty</div>}
        {pile.map((v, i) => {
          const isTop = i === pile.length - 1;
          return (
            <button
              key={i}
              onClick={isTop && !disabled ? onLift : undefined}
              disabled={!isTop || disabled}
              className={`rounded-lg text-center text-sm py-1.5 border transition-colors ${
                isTop && !disabled
                  ? "bg-cyan/10 border-cyan/30 text-cyan hover:bg-cyan/20 cursor-pointer"
                  : "bg-void/50 border-panel-border text-fog/40"
              }`}
            >
              {v}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// BOSS PANEL
// ---------------------------------------------------------------------
function BossPanel({ boss, onDone }: { boss: Boss; onDone: (xp: number) => void }) {
  const [code, setCode] = useState(boss.starter);
  const [results, setResults] = useState<ReturnType<typeof runUserCode> | null>(null);
  const [cleared, setCleared] = useState(false);

  function run() {
    const r = runUserCode(code, boss.tests);
    setResults(r);
    if (r.every((t) => t.pass) && !cleared) {
      setCleared(true);
      setTimeout(() => onDone(50), 700);
    }
  }

  return (
    <div className="bg-panel border border-panel-border rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-1">
        <Terminal size={15} className="text-violet" />
        <span className="text-[15px] text-white font-medium">{boss.title}</span>
        <span className="text-[11px] font-mono text-violet/70 ml-auto">boss layer</span>
      </div>
      <p className="text-sm text-fog/50 mb-4 leading-relaxed">{boss.prompt}</p>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        spellCheck={false}
        className="w-full h-40 bg-void/40 border border-panel-border rounded-xl p-3 text-[13px] font-mono text-cyan focus:outline-none focus:border-cyan/40 resize-none"
      />
      <button onClick={run} className="mt-3 inline-flex items-center gap-2 bg-violet/10 border border-violet/30 text-violet px-4 py-2 rounded-full text-sm font-mono hover:bg-violet/20">
        <ChevronRight size={14} /> Run tests
      </button>
      {results && (
        <div className="mt-4 space-y-1.5">
          {results.map((r, i) => (
            <div key={i} className={`flex items-center gap-2 text-xs font-mono px-3 py-2 rounded-lg border ${r.pass ? "border-emerald-400/30 bg-emerald-400/5 text-emerald-300" : "border-rose-400/30 bg-rose-400/5 text-rose-300"}`}>
              {r.pass ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
              test {i + 1}: {r.pass ? "passed" : r.err ? `error — ${r.err}` : `got ${JSON.stringify(r.out)}, expected ${JSON.stringify(r.expected)}`}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
