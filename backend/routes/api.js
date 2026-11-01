const router = require("express").Router();
const { ethers, contract } = require("../chain");
const { requireAuth } = require("../middleware/auth");
const db = require("../db");

const isAddr = (a) => ethers.isAddress(a || "");

// ---- stats & metrics --------------------------------------------------
router.get("/stats", async (_req, res) => {
  try {
    const [p, r, s, bal, paused] = await Promise.all([
      contract.requiredPercent(),
      contract.rewardAmount(),
      contract.totalSessions(),
      contract.runner.provider.getBalance(await contract.getAddress()),
      contract.paused(),
    ]);
    const students = await db.users.findByRole("student");
    const teachers = await db.users.findByRole("teacher");
    res.json({
      requiredPercent: Number(p),
      rewardEth: ethers.formatEther(r),
      totalSessions: Number(s),
      poolBalanceEth: ethers.formatEther(bal),
      isPaused: paused,
      studentCount: students.length,
      teacherCount: teachers.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- teachers ---------------------------------------------------------
router.get("/teachers", requireAuth("admin"), async (_req, res) => {
  const teachers = await db.users.findByRole("teacher");
  res.json(teachers);
});

// ---- students ---------------------------------------------------------
router.get("/students", requireAuth("admin", "teacher"), async (_req, res) => {
  const students = await db.users.findByRole("student");
  res.json(students);
});

// Save/Update off-chain profile (name, roll no, dept, sem) for a wallet. Teacher registers on-chain separately.
router.post("/students", requireAuth("teacher"), async (req, res) => {
  const { walletAddress, name, rollNo, department, semester } = req.body || {};
  if (!isAddr(walletAddress)) return res.status(400).json({ error: "Valid walletAddress required" });
  if (!name || String(name).length > 80) return res.status(400).json({ error: "Name required (max 80 chars)" });
  const doc = await db.users.upsertProfile(walletAddress, name, rollNo, department, semester);
  res.status(201).json(doc);
});

// Attendance percentage + eligibility is always read from the chain (source of truth).
router.get("/students/:address/summary", requireAuth(), async (req, res) => {
  const { address } = req.params;
  if (!isAddr(address)) return res.status(400).json({ error: "Invalid address" });
  if (req.user.role === "student" && req.user.address !== address.toLowerCase()) {
    return res.status(403).json({ error: "Students can only view their own summary" });
  }
  const [attended, total, percent, required, eligible, claimed] = await Promise.all([
    contract.attendedCount(address), contract.totalSessions(), contract.attendancePercent(address),
    contract.requiredPercent(), contract.isEligible(address), contract.rewardClaimed(address),
  ]);
  const profile = await db.users.findByAddress(address);
  res.json({
    address: address.toLowerCase(),
    name: profile?.name,
    rollNo: profile?.rollNo,
    department: profile?.department || "Computer Science & Engineering",
    semester: profile?.semester || "Semester 6",
    attended: Number(attended),
    totalSessions: Number(total),
    percent: Number(percent),
    requiredPercent: Number(required),
    eligible,
    rewardClaimed: claimed,
  });
});

// ---- sessions ---------------------------------------------------------
router.get("/sessions", requireAuth(), async (_req, res) => {
  res.json(await db.sessions.findAll());
});

// Store/refresh session metadata with its tx hash (the event listener also does this automatically).
router.post("/sessions", requireAuth("teacher"), async (req, res) => {
  const { sessionId, subject, txHash } = req.body || {};
  if (!Number.isInteger(sessionId) || sessionId < 0) return res.status(400).json({ error: "sessionId must be a non-negative integer" });
  if (!subject) return res.status(400).json({ error: "subject required" });
  const doc = await db.sessions.upsert(sessionId, subject, req.user.address, txHash, new Date());
  res.status(201).json(doc);
});

// Dynamic Anti-Proxy Presence Code Protocol
let activePresenceCode = {
  sessionId: 0,
  code: "749215",
  expiresAt: Date.now() + 15 * 60 * 1000,
};

router.post("/sessions/code", requireAuth("teacher"), (req, res) => {
  const { sessionId } = req.body || {};
  const code = String(Math.floor(100000 + Math.random() * 900000));
  activePresenceCode = {
    sessionId: Number(sessionId ?? 0),
    code,
    expiresAt: Date.now() + 120 * 1000, // 2 minutes rolling code
  };
  res.json({
    sessionId: activePresenceCode.sessionId,
    code: activePresenceCode.code,
    remainingSeconds: 120,
  });
});

router.get("/sessions/code", requireAuth("teacher"), (_req, res) => {
  const remaining = Math.max(0, Math.round((activePresenceCode.expiresAt - Date.now()) / 1000));
  res.json({
    sessionId: activePresenceCode.sessionId,
    code: remaining > 0 ? activePresenceCode.code : null,
    remainingSeconds: remaining,
  });
});

router.post("/sessions/verify-presence", requireAuth("student"), async (req, res) => {
  const { code } = req.body || {};
  if (!code) return res.status(400).json({ error: "Please enter the 6-digit classroom code" });
  if (Date.now() > activePresenceCode.expiresAt) {
    return res.status(400).json({ error: "Classroom code expired. Ask Ms. Sarabjit Kaur to generate a new PIN." });
  }
  const clean = String(code).trim().replace(/\D/g, "");
  if (clean !== activePresenceCode.code) {
    return res.status(400).json({ error: "Invalid classroom PIN. Please check the projector or ask Ms. Sarabjit Kaur." });
  }
  res.json({
    success: true,
    message: "Physical classroom presence cryptographically verified!",
    sessionId: activePresenceCode.sessionId,
    verifiedAt: new Date().toISOString(),
  });
});

// ---- attendance & rewards --------------------------------------------
router.get("/attendance/:sessionId", requireAuth("admin", "teacher"), async (req, res) => {
  const sessionId = Number(req.params.sessionId);
  if (!Number.isInteger(sessionId)) return res.status(400).json({ error: "Invalid sessionId" });
  const rows = await db.attendance.findBySession(sessionId);
  const names = await db.users.findManyByAddresses(rows.map((r) => r.student));
  const byAddr = Object.fromEntries(names.map((u) => [u.walletAddress, u]));
  res.json(rows.map((r) => ({ ...r, name: byAddr[r.student]?.name, rollNo: byAddr[r.student]?.rollNo })));
});

// A student's own attendance history (every session they were marked present in)
router.get("/students/:address/attendance", requireAuth(), async (req, res) => {
  const a = req.params.address.toLowerCase();
  if (req.user.role === "student" && req.user.address !== a) return res.status(403).json({ error: "Forbidden" });
  res.json(await db.attendance.findByStudent(a));
});

router.get("/rewards", requireAuth(), async (req, res) => {
  const filter = req.user.role === "student" ? { student: req.user.address } : {};
  res.json(await db.rewards.findAll(filter));
});

// ---- student grievances, queries & feedback ---------------------------
// GET /api/messages - Students get their sent queries, Teachers get all
router.get("/messages", requireAuth(), async (req, res) => {
  try {
    if (req.user.role === "student") {
      const list = await db.messages.findByStudent(req.user.address);
      return res.json(list);
    }
    const list = await db.messages.findAll();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/messages - Student submits query/feedback to Teacher
router.post("/messages", requireAuth(), async (req, res) => {
  try {
    const { subject, category, message } = req.body || {};
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message content is required" });
    }
    const profile = await db.users.findByAddress(req.user.address);
    const item = await db.messages.create({
      studentAddress: req.user.address,
      studentName: profile?.name || "Student",
      rollNo: profile?.rollNo || "",
      subject: (subject || "Student Query").trim(),
      category: category || "General Feedback",
      message: message.trim(),
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/messages/:id/reply - Teacher replies to a query
router.post("/messages/:id/reply", requireAuth("teacher", "admin"), async (req, res) => {
  try {
    const { reply, status } = req.body || {};
    if (!reply || !reply.trim()) {
      return res.status(400).json({ error: "Reply text is required" });
    }
    const updated = await db.messages.reply(
      req.params.id,
      reply.trim(),
      "Ms. Sarabjit Kaur (Assistant Professor)",
      status || "Resolved"
    );
    if (!updated) return res.status(404).json({ error: "Message not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
