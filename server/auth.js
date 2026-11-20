import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createJourneyRouter } from "./journey.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.join(__dirname, "users.json");

// Read the secret lazily because dotenv loads after this module is imported
const getSecret = () => process.env.JWT_SECRET || "dev-secret-change-me";

function readUsers() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch {
    return [];
  }
}
function writeUsers(users) {
  fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
}

const publicUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  xp: u.xp,
  level: u.level,
  // Number of sessions started. 1 = brand-new account. Accounts created before this
  // field existed have clearly been here before, so they count as returning.
  loginCount: u.loginCount ?? 2,
  lastLoginAt: u.lastLoginAt ?? null,
});
const signToken = (u) => jwt.sign({ id: u.id }, getSecret(), { expiresIn: "7d" });

// Middleware for protected routes
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Login required." });
  try {
    req.userId = jwt.verify(token, getSecret()).id;
    next();
  } catch {
    res.status(401).json({ error: "Session expired. Please log in again." });
  }
}

const router = Router();
const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

router.post("/signup", async (req, res) => {
  const name = String(req.body.name ?? "").trim();
  const email = String(req.body.email ?? "").trim().toLowerCase();
  const password = String(req.body.password ?? "");

  if (name.length < 2) return res.status(400).json({ error: "Name must be at least 2 characters." });
  if (!emailOk(email)) return res.status(400).json({ error: "Please enter a valid email address." });
  if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters." });

  const users = readUsers();
  if (users.some((u) => u.email === email)) {
    return res.status(409).json({ error: "An account with this email already exists. Please log in." });
  }

  const user = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    name,
    email,
    passwordHash: await bcrypt.hash(password, 10),
    xp: 0,
    level: 1,
    createdAt: new Date().toISOString(),
    loginCount: 1,
    lastLoginAt: new Date().toISOString(),
  };
  users.push(user);
  writeUsers(users);

  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

router.post("/login", async (req, res) => {
  const email = String(req.body.email ?? "").trim().toLowerCase();
  const password = String(req.body.password ?? "");

  const users = readUsers();
  const user = users.find((u) => u.email === email);
  const ok = user && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) return res.status(401).json({ error: "Incorrect email or password." });

  // Remember this visit on the server (never only in the browser).
  user.loginCount = (user.loginCount ?? 1) + 1;
  user.lastLoginAt = new Date().toISOString();
  writeUsers(users);

  res.json({ token: signToken(user), user: publicUser(user) });
});

router.get("/me", requireAuth, (req, res) => {
  const user = readUsers().find((u) => u.id === req.userId);
  if (!user) return res.status(401).json({ error: "User not found." });
  res.json({ user: publicUser(user) });
});

// Add XP to the logged-in user. Level up every 100 XP.
router.post("/xp", requireAuth, (req, res) => {
  const amount = Math.max(1, Math.min(20, Number(req.body.amount) || 0));
  const users = readUsers();
  const user = users.find((u) => u.id === req.userId);
  if (!user) return res.status(401).json({ error: "User not found." });

  user.xp += amount;
  user.level = Math.floor(user.xp / 100) + 1;
  writeUsers(users);

  res.json({ user: publicUser(user) });
});

// Personalised DSA journey (onboarding, assessment, roadmap, mission progress).
// Stored on the same user record in users.json, under `user.journey`.
router.use("/journey", createJourneyRouter({ readUsers, writeUsers, requireAuth }));

export default router;
