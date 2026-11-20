// Pure logic for the personalised DSA journey. No Express, no file access.
// Every function takes / returns plain objects so it is easy to test.

import {
  REALMS,
  ONBOARDING_STEPS,
  QUESTIONS,
  SLOTS,
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  LEVELS,
  FAMILIARITY,
  MISSION_MINUTES,
  XP_REWARD,
  QUIZ_PASS_RATIO,
  PRACTICE_TARGET,
} from "./journey-data.js";

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const realmById = new Map(REALMS.map((r, i) => [r.id, { ...r, index: i }]));
const questionById = new Map(QUESTIONS.map((q) => [q.id, q]));
const stepByKey = new Map(ONBOARDING_STEPS.map((s) => [s.key, s]));
const PLAYABLE_TOPICS = new Set(REALMS.filter((r) => r.topicSlug).map((r) => r.id));

const RANKS = [
  { min: 0, rank: "Rookie Coder", level: "Beginner" },
  { min: 25, rank: "Script Cadet", level: "Elementary" },
  { min: 45, rank: "Code Knight", level: "Intermediate" },
  { min: 65, rank: "Algo Ranger", level: "Advanced" },
  { min: 85, rank: "Arena Master", level: "Expert" },
];

const TOPIC_LABELS = { foundations: "Programming basics" };
for (const o of stepByKey.get("studied").options) TOPIC_LABELS[o.value] = o.label;

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const now = () => new Date().toISOString();

export function countInversions(arr) {
  let n = 0;
  for (let i = 0; i < arr.length; i++) for (let j = i + 1; j < arr.length; j++) if (arr[i] > arr[j]) n++;
  return n;
}

// puzzle id -> { optimal swaps, allowed swaps }
const puzzleInfo = new Map();
for (const q of QUESTIONS) {
  if (q.type === "puzzle") {
    const optimal = countInversions(q.array);
    puzzleInfo.set(q.id, { optimal, maxMoves: optimal + q.slack });
  }
}

const freshAttempt = () => ({ started: false, completed: false, difficulty: 2, currentId: null, asked: [], result: null, startedAt: null, completedAt: null });

export const emptyJourney = () => ({
  version: 1,
  onboarding: { step: 0, answers: {}, completed: false, completedAt: null },
  assessment: freshAttempt(),
  latestResult: null, // newest finished assessment (kept while a retake is in progress)
  assessmentHistory: [], // every finished assessment, oldest first
  roadmap: null,
  roadmapHistory: [], // earlier versions of the one evolving roadmap
  topicHistory: {}, // topic id -> [{ at, pct, level, source }]
  quizHistory: [], // every finished quiz attempt: { at, realmId, correct, total }
  activity: [], // completed missions with timestamps (drives the streak)
  lessons: {}, // realm id -> { done: [lessonId], current, step, skipped }
  completedMissions: [],
  introSeen: false,
  position: null,
  createdAt: now(),
  updatedAt: now(),
});

/* ------------------------------------------------------------------ */
/* onboarding                                                          */
/* ------------------------------------------------------------------ */

function cleanAnswer(key, value) {
  const step = stepByKey.get(key);
  if (!step) throw new HttpError(400, `Unknown answer "${key}".`);
  const allowed = step.options.map((o) => o.value);
  if (step.multi) {
    if (!Array.isArray(value) || value.length === 0) throw new HttpError(400, "Please pick at least one option.");
    const uniq = [...new Set(value)];
    if (!uniq.every((v) => allowed.includes(v))) throw new HttpError(400, `Invalid choice for "${key}".`);
    return uniq.includes("none") ? ["none"] : uniq;
  }
  if (!allowed.includes(value)) throw new HttpError(400, `Invalid choice for "${key}".`);
  return value;
}

export function saveOnboarding(j, body) {
  if (j.onboarding.completed) throw new HttpError(409, "Onboarding is already complete.");

  const incoming = body.answers;
  if (incoming !== undefined && (incoming === null || typeof incoming !== "object" || Array.isArray(incoming))) {
    throw new HttpError(400, "answers must be an object.");
  }
  const answers = { ...j.onboarding.answers };
  for (const [key, value] of Object.entries(incoming ?? {})) answers[key] = cleanAnswer(key, value);

  const step = Number.isInteger(body.step) ? clamp(body.step, 0, ONBOARDING_STEPS.length) : j.onboarding.step;

  if (body.completed) {
    const missing = ONBOARDING_STEPS.filter((s) => answers[s.key] === undefined).map((s) => s.key);
    if (missing.length) throw new HttpError(400, `Please answer every question first (missing: ${missing.join(", ")}).`);
    j.onboarding.completed = true;
    j.onboarding.completedAt = now();
    j.onboarding.step = ONBOARDING_STEPS.length;
    j.onboarding.answers = answers;
    // The student came to learn, not to be tested: the roadmap exists straight away,
    // built from what they told us. The optional skill check refines it later.
    j.roadmap = generateRoadmap(answers, null, null);
    j.roadmap.version = 1;
    syncPosition(j);
    return;
  }
  j.onboarding.step = step;
  j.onboarding.answers = answers;
}

/* ------------------------------------------------------------------ */
/* assessment                                                          */
/* ------------------------------------------------------------------ */

const selfPrior = (a) => (Math.max(0, LEVELS.indexOf(a.level)) + Math.max(0, FAMILIARITY.indexOf(a.dsaFamiliarity))) / 6;

function startDifficulty(a) {
  const avg = (Math.max(0, LEVELS.indexOf(a.level)) + Math.max(0, FAMILIARITY.indexOf(a.dsaFamiliarity))) / 2;
  return avg < 1.5 ? 1 : avg < 2.5 ? 2 : 3;
}

function pickQuestion(assessment, answers) {
  const slot = SLOTS[assessment.asked.length];
  if (!slot) return null;
  const used = new Set(assessment.asked.map((a) => a.id));
  const askedTopics = new Set(assessment.asked.map((a) => a.topic));
  const studied = new Set(answers.studied ?? []);

  let best = null;
  let bestScore = Infinity;
  for (const q of QUESTIONS) {
    if (q.cat !== slot.cat || used.has(q.id)) continue;
    if (slot.type && q.type !== slot.type) continue;
    let score = Math.abs(q.diff - assessment.difficulty) * 10; // adapt to the player
    if (askedTopics.has(q.topic)) score += 4; // spread coverage
    if (studied.has(q.topic)) score -= 2; // verify what they say they know
    if (PLAYABLE_TOPICS.has(q.topic)) score -= 1.5; // topics we have missions for
    score += Math.random();
    if (score < bestScore) {
      best = q;
      bestScore = score;
    }
  }
  return best;
}

export function startAssessment(j) {
  if (!j.onboarding.completed) throw new HttpError(409, "Finish onboarding first.");
  if (j.assessment.started && !j.assessment.completed) return; // already in progress: resume
  if (j.assessment.completed) {
    // A reassessment: keep the old result, start a fresh attempt.
    j.latestResult = j.assessment.result;
    j.assessment = freshAttempt();
  }
  const a = j.assessment;
  a.started = true;
  a.startedAt = now();
  a.difficulty = startDifficulty(j.onboarding.answers);
  const first = pickQuestion(a, j.onboarding.answers);
  a.currentId = first.id;
}

// The student changed their mind: drop the unfinished attempt, keep everything else.
export function cancelAssessment(j) {
  if (j.assessment.started && !j.assessment.completed) j.assessment = freshAttempt();
}

const norm = (s) => String(s).toLowerCase().replace(/[\s[\]()'"`]/g, "");

function judge(q, payload) {
  if (q.type === "mcq") {
    const idx = payload.answer;
    if (!Number.isInteger(idx) || idx < 0 || idx >= q.options.length) throw new HttpError(400, "Pick one of the options.");
    return { correct: idx === q.answer, correctAnswer: q.options[q.answer] };
  }
  if (q.type === "typed") {
    if (typeof payload.answer !== "string" || !payload.answer.trim()) throw new HttpError(400, "Type an answer first.");
    return { correct: q.accept.map(norm).includes(norm(payload.answer)), correctAnswer: q.accept[0] };
  }
  // puzzle: the client sends the list of adjacent swaps it made (index i swaps i and i+1)
  const info = puzzleInfo.get(q.id);
  if (payload.skipped === true) {
    return { correct: false, correctAnswer: `${info.optimal} swaps`, detail: "Skipped." };
  }
  const moves = payload.moves;
  if (!Array.isArray(moves) || moves.length > 80 || !moves.every((m) => Number.isInteger(m) && m >= 0 && m < q.array.length - 1)) {
    throw new HttpError(400, "Invalid puzzle moves.");
  }
  const arr = [...q.array];
  for (const m of moves) [arr[m], arr[m + 1]] = [arr[m + 1], arr[m]];
  const sorted = arr.every((v, i) => i === 0 || arr[i - 1] <= v);
  const correct = sorted && moves.length <= info.maxMoves;
  let detail;
  if (!sorted) detail = "The blocks were not sorted.";
  else if (!correct) detail = `Sorted in ${moves.length} swaps, but the limit was ${info.maxMoves}.`;
  else detail = `Sorted in ${moves.length} swaps (best possible: ${info.optimal}).`;
  return { correct, correctAnswer: `${info.optimal} swaps`, detail };
}

export function submitAnswer(j, payload) {
  const a = j.assessment;
  if (!a.started || a.completed || !a.currentId) throw new HttpError(409, "There is no open question.");
  if (payload.questionId !== a.currentId) throw new HttpError(409, "That is not the current question.");

  const q = questionById.get(a.currentId);
  const verdict = judge(q, payload);

  a.asked.push({ id: q.id, cat: q.cat, topic: q.topic, diff: q.diff, correct: verdict.correct, at: now() });
  a.difficulty = clamp(a.difficulty + (verdict.correct ? 1 : -1), 1, 3);

  const next = pickQuestion(a, j.onboarding.answers);
  let finished = false;
  if (next) {
    a.currentId = next.id;
  } else {
    a.currentId = null;
    finalizeAssessment(j);
    finished = true;
  }
  return { feedback: { correct: verdict.correct, correctAnswer: verdict.correctAnswer, why: q.why, detail: verdict.detail }, finished };
}

function tally(asked) {
  const cats = {};
  const topics = {};
  let weight = 0;
  let got = 0;
  let correct = 0;
  for (const a of asked) {
    const c = (cats[a.cat] ??= { asked: 0, correct: 0 });
    c.asked++;
    const t = (topics[a.topic] ??= { asked: 0, weight: 0, got: 0 });
    t.asked++;
    t.weight += a.diff;
    weight += a.diff;
    if (a.correct) {
      c.correct++;
      t.got += a.diff;
      got += a.diff;
      correct++;
    }
  }
  return { cats, topics, pct: weight ? got / weight : 0, correct };
}

function classify(stat) {
  const score = stat.got / stat.weight;
  if (stat.weight >= 2 && score >= 0.75) return "strong";
  if (score < 0.5) return "weak";
  return "ok";
}

function finalizeAssessment(j) {
  const a = j.assessment;
  const answers = j.onboarding.answers;
  const t = tally(a.asked);

  const skillScore = Math.round(100 * (0.8 * t.pct + 0.2 * selfPrior(answers)));
  const rankIndex = RANKS.findLastIndex((r) => skillScore >= r.min);

  const categories = {};
  for (const cat of Object.keys(CATEGORY_LABELS)) {
    const c = t.cats[cat];
    categories[cat] = c ? { pct: Math.round((100 * c.correct) / c.asked), asked: c.asked, correct: c.correct } : { pct: null, asked: 0, correct: 0 };
  }
  const topics = {};
  for (const [id, s] of Object.entries(t.topics)) {
    topics[id] = { pct: Math.round((100 * s.got) / s.weight), weight: s.weight, level: classify(s) };
  }

  a.result = {
    skillScore,
    rankIndex,
    rank: RANKS[rankIndex].rank,
    skillLevel: RANKS[rankIndex].level,
    assessmentPct: Math.round(100 * t.pct),
    correct: t.correct,
    total: a.asked.length,
    categories,
    topics,
  };
  a.completed = true;
  a.completedAt = now();

  // History: nothing is overwritten, only appended.
  j.latestResult = a.result;
  (j.assessmentHistory ??= []).push({ at: a.completedAt, skillScore: skillScore, rank: a.result.rank, assessmentPct: a.result.assessmentPct, topics: topics });
  j.topicHistory ??= {};
  for (const [id, s] of Object.entries(topics)) (j.topicHistory[id] ??= []).push({ at: a.completedAt, pct: s.pct, level: s.level, source: "assessment" });

  // One evolving roadmap: keep the old version in history, keep every completed mission.
  const prev = j.roadmap;
  if (prev) (j.roadmapHistory ??= []).push({ version: prev.version ?? 1, generatedAt: prev.generatedAt, source: prev.source, order: prev.order });
  j.roadmap = generateRoadmap(answers, a.result, prev);
  j.roadmap.version = (prev?.version ?? 0) + 1;
  syncPosition(j);
}

/* ------------------------------------------------------------------ */
/* roadmap                                                             */
/* ------------------------------------------------------------------ */

function generateRoadmap(answers, result, prev) {
  const claimed = new Set(answers.studied ?? []);
  const prevInfo = new Map((prev?.order ?? []).map((o) => [o.id, o]));
  const prior = selfPrior(answers);
  const hardGoal = answers.goal === "interview" || answers.goal === "competitive";

  const info = new Map();
  for (const r of REALMS) {
    const stat = result?.topics[r.id];
    const before = prevInfo.get(r.id);
    if (!stat && before) {
      // Not covered by this assessment: keep what we already knew, never reset it.
      info.set(r.id, { ...before, claimed: claimed.has(r.id) });
      continue;
    }
    const mastery = stat ? stat.level : "unknown";
    // Fast-track only with real evidence, and only if the player also claims the knowledge.
    const fast = !!stat && mastery === "strong" && stat.weight >= 3 && stat.pct >= 80 && (claimed.has(r.id) || prior >= 0.5);
    info.set(r.id, { id: r.id, track: fast ? "fast" : "full", mastery, pct: stat ? stat.pct : null, claimed: claimed.has(r.id) });
  }

  const priority = (id) => {
    const r = realmById.get(id);
    const i = info.get(id);
    let p = r.difficulty;
    if (i.mastery === "weak") p -= 0.6; // fix gaps first
    if (i.track === "fast") p += 0.6; // already strong, can wait
    if (hardGoal && ["recursion", "trees", "graphs", "dp"].includes(id)) p -= 0.4;
    return p;
  };

  const placed = new Set();
  const remaining = REALMS.map((r) => r.id);
  const order = [];
  while (remaining.length) {
    const ready = remaining.filter((id) => realmById.get(id).prereqs.every((p) => placed.has(p)));
    ready.sort((x, y) => priority(x) - priority(y) || realmById.get(x).index - realmById.get(y).index);
    const pick = ready[0];
    order.push(info.get(pick));
    placed.add(pick);
    remaining.splice(remaining.indexOf(pick), 1);
  }
  return { generatedAt: now(), source: result ? "assessment" : "self", version: 1, order };
}

function missionDefs(realm, track, mastery, done = new Set()) {
  const factor = mastery === "weak" ? 1.25 : 1;
  const mins = (t) => Math.max(5, Math.round((MISSION_MINUTES[t] * factor) / 5) * 5);
  // Teaching order: understand first, then play, then practise, then prove it with the quiz.
  const defs = [
    { type: "learn", title: "Learn the concepts", desc: `Work through ${realm.lessons.length} short lessons: explanations, diagrams and step-by-step examples.`, target: realm.lessons.length },
    { type: "game", title: `Play ${realm.game}`, desc: "Apply what you learned. Clear every level of the full-screen Breach game and defeat the NULL boss.", target: 1 },
    { type: "practice", title: `Solve ${PRACTICE_TARGET} practice problems`, desc: `Tick off ${PRACTICE_TARGET} problems in the Practice tab.`, target: PRACTICE_TARGET },
    { type: "quiz", title: `Pass the ${realm.title} quiz`, desc: `Score at least ${Math.round(QUIZ_PASS_RATIO * 100)}% in the Quiz Game tab.`, target: QUIZ_PASS_RATIO },
  ];
  // Proven strong in the skill check: the lessons stay available but are not required.
  return defs
    .map((d) => ({ ...d, id: `${realm.id}:${d.type}`, minutes: mins(d.type) }))
    // ...but anything the student already finished stays visible and counted: progress is never dropped.
    .filter((d) => !(track === "fast" && (d.type === "practice" || d.type === "learn")) || done.has(d.id));
}

// Why this topic, how urgent, and what kind of study it needs most. Focus keys:
// concepts | notes | videos | game | quiz | practice
function recommend(it, isNext) {
  if (!it.playable) return { priority: null, reason: "", focus: [] };
  const { mastery, pct, claimed, track } = it.o;
  const score = pct === null ? "" : ` (${pct}%)`;
  if (it.completed) return { priority: "low", reason: "All missions cleared. Revisit only if you feel rusty.", focus: [] };
  if (it.state === "locked") return { priority: "low", reason: "Locked until its prerequisites are cleared.", focus: [] };
  if (mastery === "weak") {
    return { priority: "high", reason: `Your skill check showed gaps here${score}${claimed ? ", even though you said you had studied it" : ""}. Re-read the lessons first, then play and practise.`, focus: ["lessons", "videos", "game", "practice", "quiz"] };
  }
  if (track === "fast") return { priority: "low", reason: `You tested strong here${score}. The boss and the quiz are enough to confirm it.`, focus: ["game", "quiz"] };
  if (mastery === "ok") return { priority: isNext ? "high" : "medium", reason: `A decent base${score}. Quizzes and real problems will lock it in.`, focus: ["quiz", "practice"] };
  if (claimed) return { priority: isNext ? "high" : "medium", reason: "You said you have studied this, but it is not tested yet. Pass the quiz to confirm it, then try problems.", focus: ["quiz", "practice"] };
  return { priority: isNext ? "high" : "medium", reason: "New for you. Start with the lessons, then play the game, practise and take the quiz.", focus: ["lessons", "videos", "game", "practice", "quiz"] };
}

function lessonsView(j, realm) {
  if (!realm.lessons) return null;
  const st = (j.lessons ?? {})[realm.id] ?? { done: [], current: null, step: 0 };
  const firstOpen = realm.lessons.find((id) => !st.done.includes(id)) ?? null;
  return { ids: realm.lessons, done: st.done, current: st.current && realm.lessons.includes(st.current) ? st.current : firstOpen, step: st.step ?? 0, skipped: !!st.skipped };
}

function deriveRoadmap(j) {
  const done = new Set(j.completedMissions);

  const items = j.roadmap.order.map((o, i) => {
    const realm = realmById.get(o.id);
    const playable = !!realm.topicSlug;
    const missions = playable ? missionDefs(realm, o.track, o.mastery, done).map((m) => ({ ...m, done: done.has(m.id), isNext: false, locked: false, lockedReason: "" })) : [];
    // A beginner never plays before learning: the game opens once the lessons are done.
    const learn = missions.find((m) => m.type === "learn");
    if (learn && !learn.done) {
      const game = missions.find((m) => m.type === "game");
      if (game && !game.done) {
        game.locked = true;
        game.lockedReason = "Finish the lessons first. The game unlocks when you have learned the concepts.";
      }
    }
    const completed = playable && missions.every((m) => m.done);
    return { o, realm, playable, missions, completed, order: i + 1 };
  });
  const byId = new Map(items.map((it) => [it.realm.id, it]));

  // A prerequisite is satisfied if it was proven strong or is finished. A realm with no
  // content yet cannot be played, so it passes the question on to ITS prerequisites
  // (otherwise Trees would unlock before Arrays just because Recursion has no content).
  const satisfied = (id) => {
    const it = byId.get(id);
    if (!it.playable) return it.realm.prereqs.every(satisfied);
    return it.o.track === "fast" || it.completed;
  };
  // The playable realms that actually stand in the way of `id`.
  const blockers = (id) =>
    byId.get(id).realm.prereqs.flatMap((p) => {
      if (satisfied(p)) return [];
      return byId.get(p).playable ? [p] : blockers(p);
    });
  for (const it of items) {
    const unlocked = it.playable && it.realm.prereqs.every(satisfied);
    it.state = !it.playable ? "coming-soon" : it.completed ? "completed" : unlocked ? "unlocked" : "locked";
  }

  // Recommended mission: earliest unlocked realm on the full track, then fast-track ones.
  const pick = (fast) => items.find((it) => it.state === "unlocked" && (it.o.track === "fast") === fast);
  const nextItem = pick(false) ?? pick(true);
  let next = null;
  if (nextItem) {
    const m = nextItem.missions.find((x) => !x.done && !x.locked);
    m.isNext = true;
    next = { missionId: m.id, type: m.type, title: m.title, minutes: m.minutes, realmId: nextItem.realm.id, realmTitle: nextItem.realm.title, topicSlug: nextItem.realm.topicSlug };
  }

  const realms = items.map((it) => {
    const total = it.missions.length;
    const finished = it.missions.filter((m) => m.done).length;
    const lockedBy = it.state === "locked" ? [...new Set(blockers(it.realm.id))].map((p) => realmById.get(p).title) : [];
    let note = "";
    if (it.playable) {
      if (it.o.track === "fast") note = "You tested strong here. Prove it with the boss and the quiz.";
      else if (it.o.mastery === "weak" && it.o.claimed) note = "You said you studied this, but the assessment shows gaps. Worth a proper pass.";
      else if (it.o.mastery === "weak") note = "The assessment shows room to grow here. Full track.";
      else if (it.o.mastery === "unknown" && it.o.claimed) note = "You said you have studied this. The optional skill check can fast-track it.";
    } else {
      note = "Learning content for this realm is still being built.";
    }
    const rec = recommend(it, !!nextItem && nextItem.realm.id === it.realm.id);
    return {
      id: it.realm.id,
      order: it.order,
      priority: rec.priority,
      reason: rec.reason,
      focus: rec.focus,
      title: it.realm.title,
      icon: it.realm.icon,
      blurb: it.realm.blurb,
      difficulty: it.realm.difficulty,
      difficultyLabel: DIFFICULTY_LABELS[it.realm.difficulty],
      state: it.state,
      track: it.o.track,
      mastery: it.o.mastery,
      score: it.o.pct,
      note,
      topicSlug: it.realm.topicSlug,
      percent: total ? Math.round((100 * finished) / total) : 0,
      minutes: it.missions.reduce((s, m) => s + m.minutes, 0),
      remainingMinutes: it.missions.filter((m) => !m.done).reduce((s, m) => s + m.minutes, 0),
      lockedBy,
      lessons: lessonsView(j, it.realm),
      recommended: !!nextItem && nextItem.realm.id === it.realm.id,
      missions: it.missions,
    };
  });

  const playable = realms.filter((r) => r.topicSlug);
  const totalMissions = playable.reduce((s, r) => s + r.missions.length, 0);
  const doneMissions = playable.reduce((s, r) => s + r.missions.filter((m) => m.done).length, 0);
  const remainingMinutes = playable.reduce((s, r) => s + r.remainingMinutes, 0);
  const daily = j.onboarding.answers.dailyMinutes || 30;

  return {
    realms,
    next,
    summary: {
      totalMissions,
      doneMissions,
      percent: totalMissions ? Math.round((100 * doneMissions) / totalMissions) : 0,
      totalMinutes: playable.reduce((s, r) => s + r.minutes, 0),
      remainingMinutes,
      daysLeft: Math.ceil(remainingMinutes / daily),
      playableRealms: playable.length,
      totalRealms: realms.length,
      finishedRealms: playable.filter((r) => r.state === "completed").length,
    },
  };
}

function syncPosition(j) {
  if (!j.roadmap) return;
  const { next } = deriveRoadmap(j);
  j.position = next ? { realmId: next.realmId, missionId: next.missionId } : { realmId: null, missionId: null };
  j.updatedAt = now();
}

export function completeMission(j, missionId, user, opts = {}) {
  if (!j.roadmap) throw new HttpError(409, "Create your journey first.");
  const before = deriveRoadmap(j);
  const realm = before.realms.find((r) => r.missions.some((m) => m.id === missionId));
  if (!realm) throw new HttpError(404, "That mission is not part of your roadmap.");
  if (realm.state === "locked") throw new HttpError(403, "That realm is still locked.");
  if (j.completedMissions.includes(missionId)) return null; // already done, nothing changes

  const mission = realm.missions.find((m) => m.id === missionId);
  if (mission.locked) throw new HttpError(403, mission.lockedReason);
  j.completedMissions.push(missionId);
  (j.activity ??= []).push({ at: now(), missionId, type: mission.type });
  if (j.activity.length > 500) j.activity.splice(0, j.activity.length - 500);
  const after = deriveRoadmap(j);
  syncPosition(j);

  const realmCompleted = after.realms.find((r) => r.id === realm.id).state === "completed";
  // XP only for real first-time completions, never for repeats.
  let gained = opts.xp ?? XP_REWARD[mission.type] ?? 0;
  if (realmCompleted && opts.xp === undefined) gained += XP_REWARD.realm;
  let xp = null;
  if (user && gained > 0) {
    user.xp = (user.xp ?? 0) + gained;
    user.level = Math.floor(user.xp / 100) + 1;
    xp = { gained, total: user.xp, level: user.level };
  }

  const stateBefore = new Map(before.realms.map((r) => [r.id, r.state]));
  return {
    missionId,
    missionTitle: mission.title,
    realmId: realm.id,
    realmTitle: realm.title,
    realmCompleted,
    xp,
    unlocked: after.realms.filter((r) => r.state === "unlocked" && stateBefore.get(r.id) === "locked").map((r) => ({ id: r.id, title: r.title })),
  };
}

const realmBySlug = (slug) => REALMS.find((r) => r.topicSlug && r.topicSlug === slug);

function openRealm(j, slug) {
  if (!j.roadmap) throw new HttpError(409, "Create your journey first.");
  const realm = realmBySlug(slug);
  if (!realm || !realm.lessons) throw new HttpError(404, "Unknown topic.");
  const view = deriveRoadmap(j).realms.find((r) => r.id === realm.id);
  if (view.state === "locked") throw new HttpError(403, "That realm is still locked.");
  return realm;
}

// A lesson is finished (its checkpoint was passed). Finishing the last one completes the Learn mission.
export function completeLesson(j, user, body) {
  const realm = openRealm(j, body.topicSlug);
  if (!realm.lessons.includes(body.lessonId)) throw new HttpError(404, "Unknown lesson.");
  const st = ((j.lessons ??= {})[realm.id] ??= { done: [], current: null, step: 0 });
  if (!st.done.includes(body.lessonId)) st.done.push(body.lessonId);
  st.current = realm.lessons.find((id) => !st.done.includes(id)) ?? null;
  st.step = 0;
  j.updatedAt = now();
  let completed = null;
  const all = realm.lessons.every((id) => st.done.includes(id));
  const learnId = `${realm.id}:learn`;
  if (all && !j.completedMissions.includes(learnId) && deriveRoadmap(j).realms.find((r) => r.id === realm.id).missions.some((m) => m.id === learnId)) {
    completed = completeMission(j, learnId, user);
  }
  return { completed };
}

// Where the student stopped inside a lesson, so they can leave and resume.
export function saveLessonPosition(j, body) {
  const realm = openRealm(j, body.topicSlug);
  if (!realm.lessons.includes(body.lessonId)) throw new HttpError(404, "Unknown lesson.");
  if (!Number.isInteger(body.step) || body.step < 0 || body.step > 60) throw new HttpError(400, "Invalid step.");
  const st = ((j.lessons ??= {})[realm.id] ??= { done: [], current: null, step: 0 });
  st.current = body.lessonId;
  st.step = body.step;
}

// A finished quiz attempt (pass or fail). It feeds performance data, never XP or unlocks by itself.
export function recordQuiz(j, body, user) {
  if (!j.roadmap) throw new HttpError(409, "Create your journey first.");
  const realm = REALMS.find((r) => r.topicSlug && r.topicSlug === body.topicSlug);
  const { correct, total } = body;
  if (!realm) throw new HttpError(404, "Unknown topic.");
  if (!Number.isInteger(total) || total < 1 || total > 50 || !Number.isInteger(correct) || correct < 0 || correct > total) {
    throw new HttpError(400, "Invalid quiz result.");
  }
  const at = now();
  (j.quizHistory ??= []).push({ at, realmId: realm.id, correct, total });
  if (j.quizHistory.length > 100) j.quizHistory.splice(0, j.quizHistory.length - 100);
  j.topicHistory ??= {};
  (j.topicHistory[realm.id] ??= []).push({ at, pct: Math.round((100 * correct) / total), source: "quiz" });
  j.updatedAt = at;

  // Passing the quiz before the lessons proves they already know the topic: skip the lessons
  // (no XP for lessons they did not take) instead of forcing a beginner course on an expert.
  let skippedLessons = false;
  const passed = correct / total >= QUIZ_PASS_RATIO;
  const learnId = `${realm.id}:learn`;
  if (passed && !j.completedMissions.includes(learnId)) {
    const view = deriveRoadmap(j).realms.find((r) => r.id === realm.id);
    if (view.state !== "locked" && view.missions.some((m) => m.id === learnId)) {
      ((j.lessons ??= {})[realm.id] ??= { done: [], current: null, step: 0 }).skipped = true;
      completeMission(j, learnId, user, { xp: 0 });
      skippedLessons = true;
    }
  }
  return { skippedLessons };
}

export function markIntroSeen(j) {
  if (!j.roadmap) throw new HttpError(409, "Finish onboarding first.");
  j.introSeen = true;
  syncPosition(j);
}

/* ------------------------------------------------------------------ */
/* view: what the browser gets (never contains answers)                */
/* ------------------------------------------------------------------ */

function publicQuestion(j) {
  const a = j.assessment;
  if (!a.currentId) return null;
  const q = questionById.get(a.currentId);
  const out = {
    id: q.id,
    cat: q.cat,
    catLabel: CATEGORY_LABELS[q.cat],
    type: q.type,
    diff: q.diff,
    q: q.q,
    number: a.asked.length + 1,
    total: SLOTS.length,
  };
  if (q.code) out.code = q.code;
  if (q.type === "mcq") out.options = q.options;
  if (q.type === "typed") out.placeholder = q.placeholder;
  if (q.type === "puzzle") {
    out.array = q.array;
    out.maxMoves = puzzleInfo.get(q.id).maxMoves;
  }
  return out;
}

const optionLabel = (key, value) => stepByKey.get(key).options.find((o) => o.value === value)?.label ?? String(value);

function buildProfile(user, j) {
  const r = j.latestResult ?? j.assessment.result; // null until the optional skill check is taken
  const a = j.onboarding.answers;
  const topicList = r ? Object.entries(r.topics).map(([id, t]) => ({ id, label: TOPIC_LABELS[id] ?? id, pct: t.pct, level: t.level })) : [];
  return {
    name: user.name,
    source: r ? "assessment" : "self",
    rank: r ? r.rank : null,
    rankIndex: r ? r.rankIndex : null,
    skillLevel: r ? r.skillLevel : null,
    skillScore: r ? r.skillScore : null,
    assessmentPct: r ? r.assessmentPct : null,
    correct: r ? r.correct : null,
    total: r ? r.total : null,
    language: a.language,
    languageLabel: optionLabel("language", a.language),
    levelLabel: optionLabel("level", a.level),
    familiarityLabel: optionLabel("dsaFamiliarity", a.dsaFamiliarity),
    goalLabel: optionLabel("goal", a.goal),
    dailyMinutes: a.dailyMinutes,
    studied: (a.studied ?? []).filter((x) => x !== "none").map((x) => optionLabel("studied", x)),
    categories: r ? Object.entries(r.categories).map(([id, c]) => ({ id, label: CATEGORY_LABELS[id], ...c })) : [],
    strong: topicList.filter((t) => t.level === "strong").sort((x, y) => y.pct - x.pct).slice(0, 4),
    weak: topicList.filter((t) => t.level === "weak").sort((x, y) => x.pct - y.pct).slice(0, 4),
    assessmentsTaken: (j.assessmentHistory ?? []).length || (r ? 1 : 0),
    // every finished skill check, oldest first: lets the dashboard show how much the student has improved
    scoreHistory: (j.assessmentHistory ?? []).map((h) => ({ at: h.at, skillScore: h.skillScore, rank: h.rank })),
  };
}

const dayOf = (iso) => iso.slice(0, 10);

function buildStats(j, d) {
  const days = new Set([...(j.activity ?? []).map((a) => dayOf(a.at)), ...(j.quizHistory ?? []).map((q) => dayOf(q.at))]);
  const today = new Date();
  const key = (offset) => new Date(today.getTime() - offset * 86400000).toISOString().slice(0, 10);
  let streak = 0;
  for (let i = days.has(key(0)) ? 0 : 1; days.has(key(i)); i++) streak++; // today not yet done does not break it
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const day = key(13 - i);
    const n = (j.activity ?? []).filter((a) => dayOf(a.at) === day).length + (j.quizHistory ?? []).filter((q) => dayOf(q.at) === day).length;
    return { day, n };
  });
  const title = (id) => realmById.get(id)?.title ?? id;
  const quizzes = (j.quizHistory ?? []).slice(-8).map((q) => ({ at: q.at, realm: title(q.realmId), correct: q.correct, total: q.total, pct: Math.round((100 * q.correct) / q.total) }));
  const topics = d.realms
    .filter((r) => r.topicSlug)
    .map((r) => {
      const hist = (j.topicHistory ?? {})[r.id] ?? [];
      const latest = hist.length ? hist[hist.length - 1].pct : null;
      return { id: r.id, title: r.title, icon: r.icon, assessment: r.score, latest, attempts: hist.length, percent: r.percent, history: hist.slice(-6).map((h) => h.pct) };
    });
  const scored = topics.filter((t) => t.latest !== null).sort((a, b) => b.latest - a.latest);
  return {
    streak,
    activeDays: days.size,
    last14,
    quizzes,
    topics,
    strongest: scored.slice(0, 2).map((t) => ({ id: t.id, title: t.title, pct: t.latest })),
    weakest: scored.length > 1 ? scored.slice(-2).reverse().map((t) => ({ id: t.id, title: t.title, pct: t.latest })) : [],
    missionsDone: d.summary.doneMissions,
    missionsPending: d.summary.totalMissions - d.summary.doneMissions,
    priorities: d.realms.filter((r) => r.priority === "high").map((r) => ({ id: r.id, title: r.title, reason: r.reason })),
    roadmapVersions: (j.roadmapHistory ?? []).length + 1,
  };
}

export function buildView(user, j = user.journey ?? emptyJourney()) {
  // "assessment" only while a skill check is actually in progress; otherwise the journey is ready.
  const inAssessment = j.assessment.started && !j.assessment.completed;
  const stage = !j.onboarding.completed ? "onboarding" : inAssessment ? "assessment" : "complete";
  const view = {
    stage,
    introSeen: j.introSeen,
    onboarding: {
      step: j.onboarding.step,
      answers: j.onboarding.answers,
      completed: j.onboarding.completed,
      steps: j.onboarding.completed ? undefined : ONBOARDING_STEPS,
    },
    assessment: {
      started: inAssessment, // false once a check is finished, so "retake" shows the intro again
      completed: j.assessment.completed,
      hasResult: !!(j.latestResult ?? j.assessment.result),
      answered: j.assessment.asked.length,
      total: SLOTS.length,
      current: publicQuestion(j),
    },
    profile: null,
    roadmap: null,
    next: null,
    position: j.position,
    stats: null,
  };
  if (j.roadmap) {
    const d = deriveRoadmap(j);
    view.profile = buildProfile(user, j);
    view.roadmap = { generatedAt: j.roadmap.generatedAt, version: j.roadmap.version ?? 1, source: j.roadmap.source ?? "assessment", realms: d.realms, summary: d.summary };
    view.next = d.next;
    view.stats = buildStats(j, d);
  }
  return view;
}
