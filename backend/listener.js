// Mirrors on-chain events into the Supabase database so reports and dashboards are fast.
// The blockchain stays the single source of truth; every row carries its txHash.
const { contract } = require("./chain");
const db = require("./db");

const ts = (n) => new Date(Number(n) * 1000);

async function onSession(sessionId, subject, by, timestamp, txHash) {
  await db.sessions.upsert(Number(sessionId), subject, by, txHash, ts(timestamp));
}
async function onAttendance(sessionId, student, by, timestamp, txHash) {
  await db.attendance.upsert(Number(sessionId), student, "present", txHash, ts(timestamp));
}
async function onReward(student, percent, amount, timestamp, txHash) {
  await db.rewards.upsert(student, percent, amount, txHash, ts(timestamp));
}
async function onStudent(student) {
  await db.users.upsertRole(student, "student");
}

async function backfill() {
  const sessions = await contract.queryFilter("SessionCreated");
  for (const e of sessions) await onSession(e.args[0], e.args[1], e.args[2], e.args[3], e.transactionHash);
  const marks = await contract.queryFilter("AttendanceMarked");
  for (const e of marks) await onAttendance(e.args[0], e.args[1], e.args[2], e.args[3], e.transactionHash);
  const claims = await contract.queryFilter("RewardClaimed");
  for (const e of claims) await onReward(e.args[0], e.args[1], e.args[2], e.args[3], e.transactionHash);
  const regs = await contract.queryFilter("StudentRegistered");
  for (const e of regs) await onStudent(e.args[0]);
  console.log(`Backfilled ${sessions.length} sessions, ${marks.length} attendance marks, ${claims.length} rewards`);
}

function start() {
  contract.on("SessionCreated", (id, subject, by, t, ev) => onSession(id, subject, by, t, ev.log.transactionHash));
  contract.on("AttendanceMarked", (id, s, by, t, ev) => onAttendance(id, s, by, t, ev.log.transactionHash));
  contract.on("RewardClaimed", (s, p, a, t, ev) => onReward(s, p, a, t, ev.log.transactionHash));
  contract.on("StudentRegistered", (s) => onStudent(s));
  console.log("Listening to contract events...");
}

module.exports = { backfill, start };
