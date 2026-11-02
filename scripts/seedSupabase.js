const path = require("path");
const { createClient } = require(path.join(__dirname, "../backend/node_modules/@supabase/supabase-js"));
const store = require(path.join(__dirname, "../backend/data/store.json"));

const SUPABASE_URL = "https://clysxjfbggouvsopcgoa.supabase.co";
const SUPABASE_KEY = "sb_publishable_7moMRm7t71XxXp_Sk7Ek8w_o5j3fbUg";

const client = createClient(SUPABASE_URL, SUPABASE_KEY);

async function seed() {
  console.log("🌱 Seeding Supabase database with Attendify cohort records...");

  // 1. Seed Users (Admin, Faculty, 38 Students)
  const usersPayload = (store.users || [])
    .filter((u) => u.walletAddress && u.role && u.role !== "none")
    .map((u) => ({
      wallet_address: u.walletAddress.toLowerCase(),
      name: u.name || "",
      roll_no: u.rollNo || "",
      department: u.department || "Computer Science & Engineering",
      semester: u.semester || "Semester 6",
      role: u.role || "student",
    }));

  if (usersPayload.length > 0) {
    const { error: userErr } = await client
      .from("users")
      .upsert(usersPayload, { onConflict: "wallet_address" });
    if (userErr) {
      console.error("❌ Error upserting users:", userErr.message);
    } else {
      console.log(`✅ Upserted ${usersPayload.length} users into Supabase 'users' table!`);
    }
  }

  // 2. Seed Sessions (CS601 - CS605)
  const sessionsPayload = (store.sessions || []).map((s) => ({
    session_id: Number(s.sessionId),
    subject: s.subject,
    created_by: (s.createdBy || "0x70997970c51812dc3a010c7d01b50e0d17dc79c8").toLowerCase(),
    tx_hash: s.txHash || "0x5defef7d8b12cc0d066301fa82",
    date: s.date || new Date().toISOString(),
  }));

  if (sessionsPayload.length > 0) {
    const { error: sessErr } = await client
      .from("sessions")
      .upsert(sessionsPayload, { onConflict: "session_id" });
    if (sessErr) {
      console.error("❌ Error upserting sessions:", sessErr.message);
    } else {
      console.log(`✅ Upserted ${sessionsPayload.length} academic sessions into Supabase 'sessions' table!`);
    }
  }

  // 3. Seed Attendance Marks
  const attendancePayload = (store.attendance || []).map((a) => ({
    session_id: Number(a.sessionId),
    student: (a.student || "").toLowerCase(),
    status: a.status || "present",
    tx_hash: a.txHash || "0x5defef7d8b12cc0d066301fa82",
    marked_at: a.markedAt || new Date().toISOString(),
  }));

  if (attendancePayload.length > 0) {
    const { error: attErr } = await client
      .from("attendance")
      .upsert(attendancePayload, { onConflict: "session_id,student" });
    if (attErr) {
      console.error("❌ Error upserting attendance:", attErr.message);
    } else {
      console.log(`✅ Upserted ${attendancePayload.length} roll call marks into Supabase 'attendance' table!`);
    }
  }

  console.log("✨ Supabase Database synchronization complete!");
}

seed().catch(console.error);
