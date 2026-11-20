import { useState } from "react";
import { CheckCircle2, XCircle, RotateCcw, Brain } from "lucide-react";

const QUESTIONS = [
  { q: "A Stack follows which ordering principle?", opts: ["FIFO", "LIFO", "Random", "Priority-based"], a: 1, why: "Last-In-First-Out — the most recently pushed element is always the first one popped." },
  { q: "Which operation removes the top element of a stack?", opts: ["enqueue()", "peek()", "pop()", "shift()"], a: 2, why: "pop() removes and returns the top element. peek()/top() only reads it." },
  { q: "Time complexity of push/pop on an array-based stack?", opts: ["O(n)", "O(log n)", "O(1)", "O(n log n)"], a: 2, why: "Both operate only on the end of the underlying array — constant time, no shifting needed." },
  { q: "What structure does a program's call stack use to track recursive calls?", opts: ["Queue", "Stack", "Heap (tree)", "Graph"], a: 1, why: "Each function call is pushed on entry and popped on return — classic LIFO." },
  { q: "A Stack Overflow occurs when...", opts: ["popping an empty stack", "pushing beyond capacity", "peeking an empty stack", "the stack is sorted wrong"], a: 1, why: "Overflow = too many pushes with no room left (e.g. runaway recursion). The empty-stack case is underflow." },
  { q: "Which feature is classically implemented using a stack?", opts: ["Undo/Redo", "Round-robin scheduling", "BFS traversal", "LRU cache eviction"], a: 0, why: "Each action is pushed; undo pops the most recent one — a direct LIFO fit." },
  { q: "Stacks are the natural fit for checking...", opts: ["sorted arrays", "balanced parentheses", "shortest paths", "duplicate elements"], a: 1, why: "Push opening brackets, pop and match on closing ones — mismatches surface immediately." },
  { q: "Converting an infix expression to postfix classically uses a...", opts: ["Queue", "Stack", "Linked List", "Trie"], a: 1, why: "A stack holds operators until precedence rules say it's time to pop them into the output." },
  { q: "peek() / top() does what?", opts: ["removes the top element", "removes the bottom element", "returns the top element without removing it", "clears the stack"], a: 2, why: "It's a read-only look at the top — the stack is unchanged afterward." },
  { q: "A 'monotonic stack' keeps its elements in...", opts: ["random order", "insertion order only", "strictly increasing or decreasing order", "sorted alphabetical order"], a: 2, why: "Used in problems like Next Greater Element — elements are popped whenever the order would break." },
];

export default function StackQuiz() {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const current = QUESTIONS[idx];

  function pick(i: number) {
    if (selected !== null) return;
    setSelected(i);
    if (i === current.a) setScore((s) => s + 1);
  }
  function next() {
    if (idx + 1 >= QUESTIONS.length) {
      setDone(true);
    } else {
      setIdx((i) => i + 1);
      setSelected(null);
    }
  }
  function reset() {
    setIdx(0);
    setSelected(null);
    setScore(0);
    setDone(false);
  }

  if (done) {
    return (
      <div className="bg-panel border border-panel-border rounded-2xl p-10 text-center max-w-xl mx-auto">
        <Brain size={28} className="text-cyan mx-auto mb-3" />
        <div className="text-xl font-display font-bold text-white mb-1">{score}/{QUESTIONS.length}</div>
        <p className="text-fog/50 text-sm mb-6">
          {score === QUESTIONS.length ? "Clean sweep — Stack fundamentals are solid." : "Review the ones you missed, then try again."}
        </p>
        <button onClick={reset} className="inline-flex items-center gap-2 bg-cyan/10 border border-cyan/30 text-cyan px-4 py-2 rounded-full text-sm font-mono hover:bg-cyan/20">
          <RotateCcw size={14} /> Retake quiz
        </button>
      </div>
    );
  }

  return (
    <div className="bg-panel border border-panel-border rounded-2xl p-6 max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-4 text-xs font-mono text-fog/50">
        <span>Question {idx + 1} / {QUESTIONS.length}</span>
        <span>score {score}</span>
      </div>
      <div className="text-[15px] text-white mb-5">{current.q}</div>
      <div className="grid grid-cols-1 gap-2.5 mb-4">
        {current.opts.map((opt, i) => {
          const isCorrect = selected !== null && i === current.a;
          const isWrongPick = selected === i && i !== current.a;
          return (
            <button
              key={i}
              onClick={() => pick(i)}
              disabled={selected !== null}
              className={`text-left px-4 py-3 rounded-xl border text-sm transition-colors flex items-center justify-between ${
                isCorrect ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-300"
                : isWrongPick ? "border-rose-400/50 bg-rose-400/10 text-rose-300"
                : "border-panel-border hover:border-cyan/30 text-fog/80"
              }`}
            >
              {opt}
              {isCorrect && <CheckCircle2 size={15} />}
              {isWrongPick && <XCircle size={15} />}
            </button>
          );
        })}
      </div>
      {selected !== null && (
        <div className="bg-void/40 border border-panel-border rounded-xl p-3 mb-4">
          <p className="text-xs text-fog/60 leading-relaxed">{current.why}</p>
        </div>
      )}
      <button
        onClick={next}
        disabled={selected === null}
        className="w-full py-2.5 rounded-xl border border-cyan/30 bg-cyan/10 text-cyan text-sm font-mono font-medium hover:bg-cyan/20 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {idx + 1 >= QUESTIONS.length ? "Finish" : "Next question"}
      </button>
    </div>
  );
}
