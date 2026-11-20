import { useEffect, useMemo, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { topics } from "../data/topics";
import type { Topic } from "../data/topics";
import TopicNotesPdf from "../components/TopicNotesPdf";
import ArrayBreachGame from "../components/ArrayBreachGame";
import TopicBreachGame from "../components/TopicBreachGame";
import "./TopicPage.css";

const TABS = [
  { id: "learn", label: "Learn", icon: "📘" },
  { id: "notes", label: "Notes", icon: "📝" },
  { id: "videos", label: "Videos", icon: "🎬" },
  { id: "practice", label: "Practice", icon: "💻" },
  { id: "game", label: "Quiz Game", icon: "🎮" },
];

export default function TopicPage() {
  const { slug } = useParams();
  const topic = topics[slug ?? ""];
  const [tab, setTab] = useState("learn");

  useEffect(() => setTab("learn"), [slug]);

  if (!topic) return <Navigate to="/dashboard" replace />;

  return (
    <div className="tp-wrap">
      <Link to="/dashboard" className="tp-back">&larr; back to dashboard</Link>

      <header className="tp-hero">
        <div className="tp-icon">{topic.icon}</div>
        <div className="tp-hero-text">
          <p className="tp-eyebrow">// topic.{topic.slug}</p>
          <h1>{topic.title}</h1>
          <p className="tp-tagline">{topic.tagline}</p>
          <div className="tp-progress">
            <div className="tp-bar"><span style={{ width: `${topic.progress}%` }} /></div>
            <small>{topic.progress}% complete</small>
          </div>
        </div>
      </header>

      <nav className="tp-tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? "active" : ""} onClick={() => setTab(t.id)}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </nav>

      <section className="tp-panel">
        {tab === "learn" && <Learn topic={topic} />}
        {tab === "notes" && <Notes topic={topic} />}
        {tab === "videos" && <Videos topic={topic} />}
        {tab === "practice" && <Practice topic={topic} />}
        {tab === "game" && <QuizGame key={topic.slug} topic={topic} />}
      </section>
    </div>
  );
}

function Learn({ topic }: { topic: Topic }) {
  const [playing, setPlaying] = useState(false);
  const [startAt, setStartAt] = useState<number | undefined>(undefined);
  const isArrays = topic.slug === "arrays";

  const launch = (i?: number) => {
    // Request fullscreen here, inside the click, so the browser allows it.
    if (!isArrays && !document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {
        /* overlay still fills the viewport */
      });
    }
    setStartAt(i);
    setPlaying(true);
  };

  return (
    <>
      <p className="tp-muted">🎮 Tap “Play” on any concept to learn it by doing.</p>

      <div className="tp-card tp-wide" style={{ textAlign: "center", marginBottom: 16 }}>
        <h3>🎮 {isArrays ? "Array Breach" : `${topic.title} Breach`}</h3>
        <p>Full-screen cyberpunk game: every concept is a mission, and the last one is the NULL boss.</p>
        <button className="tp-btn" onClick={() => launch()}>▶ Play {isArrays ? "Array Breach" : `${topic.title} Breach`}</button>
      </div>

      <div className="tp-grid">
        {topic.concepts.map((c, i) => (
          <div className="tp-card" key={c.name}>
            <h3>{c.name}</h3>
            <p>{c.desc}</p>
            <button className="tp-btn" onClick={() => launch(i)}>🎮 Play</button>
          </div>
        ))}
      </div>

      {playing && isArrays && (
        <ArrayBreachGame
          onComplete={(xp) => {
            /* put your existing XP code here, e.g. addXp(xp) */
            console.log("Array Breach XP:", xp);
          }}
          onExit={() => setPlaying(false)}
        />
      )}

      {playing && !isArrays && (
        <TopicBreachGame
          topic={topic}
          startAt={startAt}
          onComplete={(xp) => {
            /* put your existing XP code here, e.g. addXp(xp) */
            console.log(`${topic.title} Breach XP:`, xp);
          }}
          onExit={() => setPlaying(false)}
        />
      )}
    </>
  );
}

function Notes({ topic }: { topic: Topic }) {
  return (
    <div className="tp-notes">
      {/* PDF notes for this topic (view + download) */}
      <TopicNotesPdf />

      {topic.notes.map((n) => (
        <article className="tp-card" key={n.heading}>
          <h3>{n.heading}</h3>
          {n.points && <ul>{n.points.map((p) => <li key={p}>{p}</li>)}</ul>}
          {n.code && <pre><code>{n.code}</code></pre>}
        </article>
      ))}
    </div>
  );
}

function Videos({ topic }: { topic: Topic }) {
  return (
    <div className="tp-grid">
      {topic.videos.map((v) => (
        <div className="tp-card" key={v.title}>
          <h3>{v.title}</h3>
          {v.youtubeId ? (
            <div className="tp-video">
              <iframe src={`https://www.youtube.com/embed/${v.youtubeId}`} title={v.title} allowFullScreen />
            </div>
          ) : (
            <a className="tp-btn" href={`https://www.youtube.com/results?search_query=${encodeURIComponent(v.query)}`} target="_blank" rel="noreferrer">
              ▶ Watch on YouTube
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

function Practice({ topic }: { topic: Topic }) {
  const key = `algoarena:solved:${topic.slug}`;
  const [solved, setSolved] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(key) ?? "[]") || []; } catch { return []; }
  });

  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(solved)); } catch { /* ignore */ }
  }, [key, solved]);

  const toggle = (name: string) => setSolved((s) => (s.includes(name) ? s.filter((x) => x !== name) : [...s, name]));

  return (
    <div className="tp-card">
      <p className="tp-muted">{solved.length}/{topic.problems.length} solved</p>
      <ul className="tp-problems">
        {topic.problems.map((p) => (
          <li key={p.name}>
            <label>
              <input type="checkbox" checked={solved.includes(p.name)} onChange={() => toggle(p.name)} />
              <a href={p.url} target="_blank" rel="noreferrer">{p.name}</a>
            </label>
            <span className={`tp-diff ${p.difficulty.toLowerCase()}`}>{p.difficulty}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function QuizGame({ topic }: { topic: Topic }) {
  const questions = useMemo(() => topic.quiz, [topic]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const q = questions[i];

  const choose = (idx: number) => {
    if (picked !== null) return;
    setPicked(idx);
    if (idx === q.answer) setScore((s) => s + 1);
  };

  const next = () => {
    if (i + 1 >= questions.length) return setDone(true);
    setI(i + 1);
    setPicked(null);
  };

  const restart = () => { setI(0); setPicked(null); setScore(0); setDone(false); };

  if (done) {
    return (
      <div className="tp-card tp-center">
        <h3>Round complete</h3>
        <p className="tp-score">{score}/{questions.length}</p>
        <p className="tp-muted">+{score * 10} XP earned</p>
        <button className="tp-btn" onClick={restart}>Play again</button>
      </div>
    );
  }

  return (
    <div className="tp-card">
      <p className="tp-muted">Question {i + 1} of {questions.length} · Score {score}</p>
      <h3>{q.q}</h3>
      <div className="tp-options">
        {q.options.map((o, idx) => {
          let cls = "";
          if (picked !== null) {
            if (idx === q.answer) cls = "correct";
            else if (idx === picked) cls = "wrong";
          }
          return <button key={o} className={cls} onClick={() => choose(idx)}>{o}</button>;
        })}
      </div>
      {picked !== null && (
        <>
          <p className="tp-why">{picked === q.answer ? "✅ Correct. " : "❌ Not quite. "}{q.why}</p>
          <button className="tp-btn" onClick={next}>{i + 1 >= questions.length ? "Finish" : "Next →"}</button>
        </>
      )}
    </div>
  );
}
