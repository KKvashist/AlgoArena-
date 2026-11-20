// Express routes for the personalised DSA journey.
// Mounted by auth.js at /api/auth/journey, so it reuses the existing login token and users.json.

import { Router } from "express";
import {
  HttpError,
  emptyJourney,
  buildView,
  saveOnboarding,
  startAssessment,
  cancelAssessment,
  submitAnswer,
  markIntroSeen,
  recordQuiz,
  completeLesson,
  saveLessonPosition,
  completeMission,
} from "./journey-engine.js";

export function createJourneyRouter({ readUsers, writeUsers, requireAuth }) {
  const router = Router();
  router.use(requireAuth);

  // Load the user, run the handler, save, reply. Everything inside is synchronous,
  // so two requests can never interleave and overwrite each other.
  //   handler(journey, body, user) -> extra fields for the response (or undefined)
  //   opts.save = false for read-only routes
  const route = (handler, { save = true } = {}) => (req, res) => {
    try {
      const users = readUsers();
      const user = users.find((u) => u.id === req.userId);
      if (!user) return res.status(401).json({ error: "User not found." });

      const journey = structuredClone(user.journey ?? emptyJourney());
      const extra = handler(journey, req.body ?? {}, user) ?? {};
      if (save) {
        user.journey = journey;
        writeUsers(users);
      }
      res.json({ journey: buildView(user, journey), ...extra });
    } catch (err) {
      const status = err instanceof HttpError ? err.status : 500;
      if (status === 500) console.error("JOURNEY ERROR:", err);
      res.status(status).json({ error: status === 500 ? "Something went wrong on the server." : err.message });
    }
  };

  router.get("/", route(() => undefined, { save: false }));

  router.put("/onboarding", route((j, body) => saveOnboarding(j, body)));

  router.post("/assessment/start", route((j) => startAssessment(j)));

  router.post("/assessment/cancel", route((j) => cancelAssessment(j)));

  router.post("/assessment/answer", route((j, body) => submitAnswer(j, body)));

  router.post("/quiz-result", route((j, body, user) => recordQuiz(j, body, user)));

  router.post("/lessons/complete", route((j, body, user) => completeLesson(j, user, body)));

  router.post("/lessons/position", route((j, body) => saveLessonPosition(j, body)));

  router.post("/intro-seen", route((j) => markIntroSeen(j)));

  router.post("/missions/complete", route((j, body, user) => {
    if (typeof body.missionId !== "string") throw new HttpError(400, "missionId is required.");
    return { completed: completeMission(j, body.missionId, user) };
  }));

  return router;
}
