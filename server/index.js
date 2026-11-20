import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import { GoogleGenAI } from "@google/genai";
import authRouter from "./auth.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "100kb" }));

// ---- Rate limits: only AI routes are tight; auth/journey are generous ----
const limitMsg = (error) => ({ error });
const chatLimiter = rateLimit({ windowMs: 60_000, max: 20, standardHeaders: true, legacyHeaders: false, message: limitMsg("Too many AI requests. Please wait a minute.") });
const apiLimiter = rateLimit({ windowMs: 60_000, max: 600, standardHeaders: true, legacyHeaders: false, message: limitMsg("Too many requests. Please slow down.") });
const loginLimiter = rateLimit({ windowMs: 15 * 60_000, max: 50, standardHeaders: true, legacyHeaders: false, message: limitMsg("Too many attempts. Try again in a few minutes.") });

app.get("/api/health", (_req, res) => res.json({ ok: true, models: MODELS }));
app.use("/api/chat", chatLimiter);
app.use("/api/auth/login", loginLimiter);
app.use("/api/auth/signup", loginLimiter);
app.use("/api/auth", apiLimiter, authRouter);

// ---- Gemini ----
if (!process.env.GEMINI_API_KEY) console.warn("WARNING: GEMINI_API_KEY is not set. Arena AI will not work.");
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODELS = [
  ...new Set(
    [process.env.GEMINI_MODEL, process.env.GEMINI_FALLBACK_MODEL, "gemini-2.5-flash", "gemini-2.5-flash-lite"].filter(Boolean)
  ),
];

const SYSTEM_PROMPT = `You are "Arena AI", the mentor inside AlgoArena, a gamified DSA learning platform.
- Always reply in English, even if the student writes in another language or mixes languages.
- Answer students' questions on DSA, programming, CS subjects, academics, career and general doubts.
- You are text-only: do not generate images, audio or video. If asked, politely say you only help with Q&A.
- Explain step by step in simple language, and treat the student as a beginner unless the context says otherwise.
- Put all code in fenced Markdown code blocks with the language name.
- For DSA problems, give the intuition first, then the approach, then code, then time and space complexity.
- If a student seems to be solving a practice problem, offer hints first before the full solution.
- If the message starts with a [STUDENT CONTEXT ...] block, use it to personalise the answer (their level, weak topics, next mission, available lessons and links). Never mention that a context block exists, and only recommend topics and links listed in it.
- Refuse harmful, illegal or unsafe requests briefly and politely.
- Keep answers concise unless the student asks for detail.`;

const BUSY_MSG = "The AI is busy right now. Please try again in 10 seconds.";
const EMPTY_MSG = "The AI returned an empty response. Please try again.";
const ERROR_MSG = "AI service error. Please try again.";
const MODEL_MSG = "The AI model is not available right now. Please tell the admin to check GEMINI_MODEL.";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const text = (err) => String(err?.message ?? "");
const isBusy = (err) => err?.status === 503 || err?.status === 429 || /UNAVAILABLE|overloaded|RESOURCE_EXHAUSTED/i.test(text(err));
const isMissing = (err) => err?.status === 404 || /is not found|not supported for generateContent/i.test(text(err));

// Gemini 2.5 "thinks" before answering (slow first word). Off for flash models.
const THINK = process.env.GEMINI_THINKING_BUDGET !== undefined ? Number(process.env.GEMINI_THINKING_BUDGET) : 0;
const configFor = (model) => ({
  systemInstruction: SYSTEM_PROMPT,
  temperature: 0.6,
  maxOutputTokens: 2048,
  ...(/flash/i.test(model) && Number.isFinite(THINK) ? { thinkingConfig: { thinkingBudget: THINK } } : {}),
});

// Remember which model last worked.
let preferred = null;
const orderedModels = () => (preferred ? [preferred, ...MODELS.filter((m) => m !== preferred)] : MODELS);

function toContents(messages) {
  return messages
    .slice(-20)
    .filter((m) => m && typeof m === "object")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: String(m.content ?? "").slice(0, 6000) }],
    }));
}

function replyText(response) {
  const parts = response?.candidates?.[0]?.content?.parts ?? [];
  return response?.text || parts.filter((p) => p.text && !p.thought).map((p) => p.text).join("");
}

app.post("/api/chat", async (req, res) => {
  const { messages } = req.body ?? {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array required" });
  }
  const contents = toContents(messages);
  let missing = 0;
  let busy = false;

  for (let pass = 0; pass < 3; pass++) {
    if (pass > 0) { if (!busy) break; await sleep(1200 * pass); }
    for (const model of orderedModels()) {
      try {
        const reply = replyText(await ai.models.generateContent({ model, contents, config: configFor(model) }));
        if (!reply) return res.status(502).json({ error: EMPTY_MSG });
        preferred = model;
        return res.json({ reply, model });
      } catch (err) {
        console.error("GEMINI ERROR:", model, err?.status, text(err).slice(0, 200));
        if (isMissing(err)) { missing++; continue; }
        if (!isBusy(err)) return res.status(500).json({ error: ERROR_MSG });
        busy = true;
      }
    }
  }
  if (busy) return res.status(503).json({ error: BUSY_MSG });
  res.status(missing ? 502 : 500).json({ error: missing ? MODEL_MSG : ERROR_MSG });
});

app.post("/api/chat/stream", async (req, res) => {
  const { messages } = req.body ?? {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array required" });
  }
  const contents = toContents(messages);
  let sent = false;
  let missing = 0;
  let busy = false;

  for (let pass = 0; pass < 3; pass++) {
    if (pass > 0) { if (!busy) break; await sleep(1200 * pass); }
    for (const model of orderedModels()) {
      try {
        const stream = await ai.models.generateContentStream({ model, contents, config: configFor(model) });
        for await (const chunk of stream) {
          if (!chunk.text) continue;
          if (!sent) {
            res.setHeader("Content-Type", "text/plain; charset=utf-8");
            res.setHeader("Cache-Control", "no-cache");
            sent = true;
          }
          res.write(chunk.text);
        }
        if (!sent) return res.status(502).json({ error: EMPTY_MSG });
        preferred = model;
        return res.end();
      } catch (err) {
        console.error("STREAM ERROR:", model, err?.status, text(err).slice(0, 200));
        if (sent) return res.end();
        if (isMissing(err)) { missing++; continue; }
        if (!isBusy(err)) return res.status(500).json({ error: ERROR_MSG });
        busy = true;
      }
    }
  }

  if (busy) return res.status(503).json({ error: BUSY_MSG });
  res.status(missing ? 502 : 500).json({ error: missing ? MODEL_MSG : ERROR_MSG });
});

app.use("/api", (_req, res) => res.status(404).json({ error: "Not found." }));
app.use((err, _req, res, _next) => {
  console.error("UNHANDLED:", err);
  if (res.headersSent) return res.end();
  res.status(err?.status === 400 || err?.type === "entity.parse.failed" ? 400 : 500).json({ error: err?.type === "entity.parse.failed" ? "Invalid JSON." : "Server error." });
});

app.listen(process.env.PORT || 8787, () =>
  console.log(`AI server running on port ${process.env.PORT || 8787} | models: ${MODELS.join(", ")}`)
);