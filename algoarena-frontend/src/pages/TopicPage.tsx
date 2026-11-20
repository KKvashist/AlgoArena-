import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams, useSearchParams, Navigate } from "react-router-dom";
import { topics } from "../data/topics";
import type { Topic } from "../data/topics";
import TopicNotesPdf from "../components/TopicNotesPdf";
import ArrayBreachGame from "../components/ArrayBreachGame";
import TopicBreachGame from "../components/TopicBreachGame";
import MissionBar from "../journey/MissionBar";
import Lessons from "../journey/Lessons";
import { findRealm } from "../journey/paths";
import { saveLastVisit } from "../journey/lastVisit";
import { useAuth } from "../context/AuthContext";
import { useJourney } from "../context/JourneyContext";
import "./TopicPage.css";

const TABS = [
  { id: "lessons", label: "Lessons", icon: "📚" },
  { id: "learn", label: "Play", icon: "🎮" },
  { id: "notes", label: "Notes", icon: "📝" },
  { id: "videos", label: "Videos", icon: "🎬" },
  { id: "practice", label: "Practice", icon: "💻" },
  { id: "game", label: "Quiz Game", icon: "🎮" },
];

export default function TopicPage() {
  const { slug } = useParams();
  const topic = topics[slug ?? ""];
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const { journey, completeMission, recordQuiz } = useJourney();
  const { user } = useAuth();

  // Remember where the student is, so "Get Started" continues from here (the game never auto-launches on resume).
  const uid = user?.id;
  const here = location.pathname + location.search.replace(/&?launch=1/, "");
  useEffect(() => {
    if (uid && topics[slug ?? ""]) saveLastVisit(uid, here);
  }, [uid, slug, here]);

  // The tab lives in the URL (?tab=...) so journey missions can deep-link to it.
  const tabParam = params.get("tab") ?? "";
  // New students land on the lessons; the game is the "Play" tab.
  const tab = TABS.some((t) => t.id === tabParam) ? tabParam : "lessons";
  const setTab = (id: string) => {
    const p = new URLSearchParams(params);
    p.set("tab", id);
    p.delete("launch");
    setParams(p, { replace: true });
  };

  if (!topic) return <Navigate to="/dashboard" replace />;

  // Personal journey: real progress + mission hooks (all optional, nothing changes without a journey).
  const realm = findRealm(journey, topic.slug);
  const missionOf = (type: "learn" | "game" | "quiz" | "practice") => realm?.missions.find((m) => m.type === type);
  const progress = realm ? realm.percent : topic.progress;
  const activeMission = params.get("mission");
  const gameMission = missionOf("game");
  const gameLock = gameMission?.locked ? gameMission.lockedReason : "";
  const autoLaunch = params.get("launch") === "1" && !gameLock;

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
            <div className="tp-bar"><span style={{ width: `${progress}%` }} /></div>
            <small>{progress}% complete</small>
          </div>
        </div>
      </header>

      <MissionBar slug={topic.slug} activeMission={activeMission} />

      <nav className="tp-tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? "active" : ""} onClick={() => setTab(t.id)}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </nav>

      <section className="tp-panel">
        {tab === "lessons" && <Lessons key={topic.slug} slug={topic.slug} />}
        {tab === "learn" && (
          <Learn
            key={`${topic.slug}:${autoLaunch ? location.key : ""}`}
            topic={topic}
            autoLaunch={autoLaunch}
            lock={gameLock}
            slug={topic.slug}
            onGameWin={() => { const m = missionOf("game"); if (m) void completeMission(m.id); }}
          />
        )}
        {tab === "notes" && <Notes topic={topic} />}
        {tab === "videos" && <Videos topic={topic} />}
        {tab === "practice" && (
          <Practice
            topic={topic}
            need={missionOf("practice")?.target}
            onEnough={() => { const m = missionOf("practice"); if (m) void completeMission(m.id); }}
          />
        )}
        {tab === "game" && (
          <QuizGame
            key={topic.slug}
            topic={topic}
            passRatio={missionOf("quiz")?.target}
            onFinished={(correct, total) => (journey?.roadmap ? recordQuiz(topic.slug, correct, total) : undefined)}
            onPassed={() => { const m = missionOf("quiz"); if (m) void completeMission(m.id); }}
          />
        )}
      </section>
    </div>
  );
}

function Learn({ topic, autoLaunch, lock, slug, onGameWin }: { topic: Topic; autoLaunch: boolean; lock: string; slug: string; onGameWin: () => void }) {
  const [playing, setPlaying] = useState(autoLaunch);
  const [startAt, setStartAt] = useState<number | undefined>(undefined);
  const isArrays = topic.slug === "arrays";

  // Opened from a journey mission ("ENTER THE ARENA"): go straight into the game.
  useEffect(() => {
    if (autoLaunch && !isArrays && !document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {
        /* overlay still fills the viewport */
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  if (lock) {
    return (
      <div className="tp-card tp-wide" style={{ textAlign: "center" }} data-testid="game-locked">
        <h3>🔒 {isArrays ? "Array Breach" : `${topic.title} Breach`} is locked</h3>
        <p>{lock}</p>
        <p className="tp-muted">The game is where you APPLY what you learned. Finish the short lessons first, then come back to play.</p>
        <Link className="tp-btn" to={`/topic/${slug}?tab=lessons`}>📚 Go to the lessons</Link>
      </div>
    );
  }

  return (
    <>
      <p className="tp-muted">🎮 Play to apply the concepts you learned in the lessons.</p>

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
            onGameWin();
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
            // Only the full run (not a single concept) counts for the journey mission.
            if (startAt === undefined) onGameWin();
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

function Practice({ topic, need, onEnough }: { topic: Topic; need?: number; onEnough: () => void }) {
  const key = `algoarena:solved:${topic.slug}`;
  const [solved, setSolved] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(key) ?? "[]") || []; } catch { return []; }
  });

  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(solved)); } catch { /* ignore */ }
  }, [key, solved]);

  // Journey mission: enough problems ticked off.
  const enough = need !== undefined && solved.length >= need;
  useEffect(() => {
    if (enough) onEnough();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enough]);

  const toggle = (name: string) => setSolved((s) => (s.includes(name) ? s.filter((x) => x !== name) : [...s, name]));

  return (
    <div className="tp-card">
      <p className="tp-muted">{solved.length}/{topic.problems.length} solved{need !== undefined ? ` · mission needs ${need}` : ""}</p>
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

function QuizGame({ topic, passRatio, onPassed, onFinished }: { topic: Topic; passRatio?: number; onPassed: () => void; onFinished?: (correct: number, total: number) => Promise<void> | void }) {
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
    if (i + 1 >= questions.length) {
      // Real result goes to the learning history (pass or fail); passing also completes the mission.
      // Sequential on purpose, so the second server reply can never be older than the first.
      const passed = passRatio !== undefined && score / questions.length >= passRatio;
      void (async () => {
        await onFinished?.(score, questions.length);
        if (passed) onPassed();
      })();
      return setDone(true);
    }
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
