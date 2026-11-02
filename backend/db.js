const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let supabase = null;
let isConfigured = false;

if (supabaseUrl && supabaseKey && !supabaseUrl.includes("your-project")) {
  supabase = createClient(supabaseUrl, supabaseKey);
  isConfigured = true;
  console.log("Connected to Supabase client at", supabaseUrl);
} else {
  console.log("\x1b[33m%s\x1b[0m", "⚠️  SUPABASE_URL not configured. Using local JSON store fallback at backend/data/store.json");
}

// In-memory / JSON fallback stores
const mem = {
  users: new Map(),
  sessions: new Map(),
  attendance: new Map(),
  rewards: new Map(),
  messages: new Map(),
};

const STORE_FILE = path.join(__dirname, "data", "store.json");

function loadStore() {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = JSON.parse(fs.readFileSync(STORE_FILE, "utf8"));
      if (raw.users) raw.users.forEach((u) => mem.users.set(u.walletAddress.toLowerCase(), u));
      if (raw.sessions) raw.sessions.forEach((s) => mem.sessions.set(Number(s.sessionId), s));
      if (raw.attendance) raw.attendance.forEach((a) => mem.attendance.set(`${a.sessionId}:${a.student.toLowerCase()}`, a));
      if (raw.rewards) raw.rewards.forEach((r) => mem.rewards.set(r.txHash, r));
      if (raw.messages) raw.messages.forEach((m) => mem.messages.set(m.id, m));
      console.log(`Loaded persisted store: ${mem.users.size} users, ${mem.sessions.size} sessions, ${mem.attendance.size} attendance records, ${mem.messages.size} messages`);
    }
  } catch (e) {
    console.warn("Could not load local store:", e.message);
  }
}

function saveStore() {
  if (isConfigured) return;
  try {
    const dir = path.dirname(STORE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const payload = {
      users: Array.from(mem.users.values()),
      sessions: Array.from(mem.sessions.values()),
      attendance: Array.from(mem.attendance.values()),
      rewards: Array.from(mem.rewards.values()),
      messages: Array.from(mem.messages.values()),
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(payload, null, 2));
  } catch (e) {
    console.warn("Could not save store:", e.message);
  }
}

loadStore();

// Converters between Postgres snake_case and Javascript camelCase
function toUser(row) {
  if (!row) return null;
  const roll = row.roll_no || row.rollNo || "";
  const name = row.name || "";
  const emailDefault = roll ? `${roll}@college.edu` : name ? `${name.toLowerCase().replace(/\s+/g, ".")}@attendify.edu` : "";
  return {
    walletAddress: row.wallet_address || row.walletAddress,
    name: name,
    rollNo: roll,
    email: row.email || emailDefault,
    password: row.password || "student@123",
    privateKey: row.private_key || row.privateKey || "",
    department: row.department || "Computer Science & Engineering",
    semester: row.semester || "Semester 6",
    role: row.role || "none",
    createdAt: row.created_at || row.createdAt || new Date(),
  };
}

function toSession(row) {
  if (!row) return null;
  return {
    sessionId: Number(row.session_id ?? row.sessionId),
    subject: row.subject,
    createdBy: (row.created_by || row.createdBy || "").toLowerCase(),
    date: row.date || new Date(),
    txHash: row.tx_hash || row.txHash || "",
  };
}

function toAttendance(row) {
  if (!row) return null;
  return {
    sessionId: Number(row.session_id ?? row.sessionId),
    student: (row.student || "").toLowerCase(),
    status: row.status || "present",
    txHash: row.tx_hash || row.txHash || "",
    markedAt: row.marked_at || row.markedAt || new Date(),
  };
}

function toReward(row) {
  if (!row) return null;
  return {
    student: (row.student || "").toLowerCase(),
    percent: Number(row.percent),
    amountWei: String(row.amount_wei || row.amountWei || "0"),
    txHash: row.tx_hash || row.txHash || "",
    claimedAt: row.claimed_at || row.claimedAt || new Date(),
  };
}

const db = {
  isSupabaseConfigured: () => isConfigured,

  users: {
    async findByRole(role) {
      if (isConfigured) {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("role", role)
          .order("roll_no", { ascending: true });
        if (error) throw error;
        return (data || []).map(toUser);
      }
      return Array.from(mem.users.values())
        .filter((u) => u.role === role)
        .sort((a, b) => (a.rollNo || "").localeCompare(b.rollNo || ""))
        .map(toUser);
    },

    async findByAddress(addr) {
      const key = (addr || "").toLowerCase();
      if (isConfigured) {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("wallet_address", key)
          .maybeSingle();
        if (error) throw error;
        return toUser(data);
      }
      return toUser(mem.users.get(key));
    },

    async findByIdentifier(id) {
      const clean = (id || "").toLowerCase().trim();
      if (isConfigured) {
        try {
          const { data, error } = await supabase
            .from("users")
            .select("*")
            .or(`roll_no.ilike.${clean},wallet_address.ilike.${clean}`)
            .maybeSingle();
          if (!error && data) {
            const userObj = toUser(data);
            const cached = mem.users.get(userObj.walletAddress?.toLowerCase());
            if (cached?.privateKey) userObj.privateKey = cached.privateKey;
            if (cached?.password) userObj.password = cached.password;
            return userObj;
          }
        } catch (_err) {}
      }
      // Search in memory
      for (const u of mem.users.values()) {
        const r = (u.rollNo || "").toLowerCase();
        const e = (u.email || "").toLowerCase();
        const w = (u.walletAddress || "").toLowerCase();
        const n = (u.name || "").toLowerCase();
        if (r === clean || e === clean || w === clean || n === clean) {
          return toUser(u);
        }
      }
      return null;
    },

    async findManyByAddresses(addresses) {
      const keys = (addresses || []).map((a) => (a || "").toLowerCase());
      if (!keys.length) return [];
      if (isConfigured) {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .in("wallet_address", keys);
        if (error) throw error;
        return (data || []).map(toUser);
      }
      return keys.map((k) => mem.users.get(k)).filter(Boolean).map(toUser);
    },

    async upsertRole(addr, role, extra = {}) {
      const key = (addr || "").toLowerCase();
      if (isConfigured) {
        const { data, error } = await supabase
          .from("users")
          .upsert({ wallet_address: key, role, ...extra }, { onConflict: "wallet_address" })
          .select()
          .single();
        if (error) throw error;
        return toUser(data);
      }
      const existing = mem.users.get(key) || { walletAddress: key, name: "", rollNo: "" };
      const updated = { ...existing, role, ...extra };
      mem.users.set(key, updated);
      saveStore();
      return toUser(updated);
    },

    async upsertProfile(addr, name, rollNo, department, semester, email, password, privateKey) {
      const key = (addr || "").toLowerCase();
      const dept = department || "Computer Science & Engineering";
      const sem = semester || "Semester 6";
      const userEmail = email || (rollNo ? `${rollNo}@college.edu` : "");
      const userPass = password || "student@123";

      if (isConfigured) {
        const payload = {
          wallet_address: key,
          name: String(name).trim(),
          roll_no: String(rollNo || "").trim(),
          department: dept,
          semester: sem,
          role: "student",
          email: userEmail,
        };
        const { data, error } = await supabase
          .from("users")
          .upsert(payload, { onConflict: "wallet_address" })
          .select()
          .single();
        if (error) throw error;
        return toUser(data);
      }

      const existing = mem.users.get(key) || { walletAddress: key };
      const updated = {
        ...existing,
        walletAddress: key,
        name: String(name).trim(),
        rollNo: String(rollNo || "").trim(),
        department: dept,
        semester: sem,
        role: "student",
        email: userEmail,
        password: userPass,
        privateKey: privateKey || existing.privateKey || "",
      };
      mem.users.set(key, updated);
      saveStore();
      return toUser(updated);
    },
  },

  sessions: {
    async findAll() {
      if (isConfigured) {
        const { data, error } = await supabase
          .from("sessions")
          .select("*")
          .order("session_id", { ascending: false });
        if (error) throw error;
        return (data || []).map(toSession);
      }
      return Array.from(mem.sessions.values())
        .sort((a, b) => b.sessionId - a.sessionId)
        .map(toSession);
    },

    async upsert(sessionId, subject, createdBy, txHash, date = new Date()) {
      const id = Number(sessionId);
      const isoDate = (date instanceof Date ? date : new Date(date)).toISOString();
      if (isConfigured) {
        const { data, error } = await supabase
          .from("sessions")
          .upsert(
            { session_id: id, subject: String(subject), created_by: (createdBy || "").toLowerCase(), tx_hash: txHash, date: isoDate },
            { onConflict: "session_id" }
          )
          .select()
          .single();
        if (error) throw error;
        return toSession(data);
      }
      const item = { sessionId: id, subject: String(subject), createdBy: (createdBy || "").toLowerCase(), txHash, date: new Date(isoDate) };
      mem.sessions.set(id, item);
      saveStore();
      return toSession(item);
    },
  },

  attendance: {
    async findBySession(sessionId) {
      const id = Number(sessionId);
      if (isConfigured) {
        const { data, error } = await supabase
          .from("attendance")
          .select("*")
          .eq("session_id", id);
        if (error) throw error;
        return (data || []).map(toAttendance);
      }
      return Array.from(mem.attendance.values())
        .filter((a) => a.sessionId === id)
        .map(toAttendance);
    },

    async findByStudent(student) {
      const key = (student || "").toLowerCase();
      if (isConfigured) {
        const { data, error } = await supabase
          .from("attendance")
          .select("*")
          .eq("student", key)
          .order("session_id", { ascending: false });
        if (error) throw error;
        return (data || []).map(toAttendance);
      }
      return Array.from(mem.attendance.values())
        .filter((a) => a.student === key)
        .sort((a, b) => b.sessionId - a.sessionId)
        .map(toAttendance);
    },

    async upsert(sessionId, student, status = "present", txHash, markedAt = new Date()) {
      const id = Number(sessionId);
      const key = (student || "").toLowerCase();
      const isoDate = (markedAt instanceof Date ? markedAt : new Date(markedAt)).toISOString();
      if (isConfigured) {
        const { data, error } = await supabase
          .from("attendance")
          .upsert(
            { session_id: id, student: key, status, tx_hash: txHash, marked_at: isoDate },
            { onConflict: "session_id,student" }
          )
          .select()
          .maybeSingle();
        if (error) throw error;
        return toAttendance(data);
      }
      const item = { sessionId: id, student: key, status, txHash, markedAt: new Date(isoDate) };
      mem.attendance.set(`${id}:${key}`, item);
      saveStore();
      return toAttendance(item);
    },
  },

  rewards: {
    async findAll(filter = {}) {
      if (isConfigured) {
        let query = supabase.from("rewards").select("*").order("claimed_at", { ascending: false });
        if (filter.student) {
          query = query.eq("student", filter.student.toLowerCase());
        }
        const { data, error } = await query;
        if (error) throw error;
        return (data || []).map(toReward);
      }
      let list = Array.from(mem.rewards.values());
      if (filter.student) {
        const s = filter.student.toLowerCase();
        list = list.filter((r) => r.student === s);
      }
      return list.sort((a, b) => new Date(b.claimedAt) - new Date(a.claimedAt)).map(toReward);
    },

    async upsert(student, percent, amountWei, txHash, claimedAt = new Date()) {
      const key = (student || "").toLowerCase();
      const isoDate = (claimedAt instanceof Date ? claimedAt : new Date(claimedAt)).toISOString();
      if (isConfigured) {
        const { data, error } = await supabase
          .from("rewards")
          .upsert(
            { student: key, percent: Number(percent), amount_wei: String(amountWei), tx_hash: txHash, claimed_at: isoDate },
            { onConflict: "tx_hash" }
          )
          .select()
          .maybeSingle();
        if (error) throw error;
        return toReward(data);
      }
      const item = { student: key, percent: Number(percent), amountWei: String(amountWei), txHash, claimedAt: new Date(isoDate) };
      mem.rewards.set(txHash, item);
      saveStore();
      return toReward(item);
    },
  },

  messages: {
    async findAll() {
      return Array.from(mem.messages.values())
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    async findByStudent(studentAddress) {
      const key = (studentAddress || "").toLowerCase();
      return Array.from(mem.messages.values())
        .filter((m) => (m.studentAddress || "").toLowerCase() === key)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    async create({ studentAddress, studentName, rollNo, subject, category, message }) {
      const id = "msg_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
      const item = {
        id,
        studentAddress: (studentAddress || "").toLowerCase(),
        studentName: studentName || "Student",
        rollNo: rollNo || "",
        subject: subject || "Student Query",
        category: category || "General Feedback",
        message: message || "",
        status: "Pending", // "Pending" | "Reviewed" | "Resolved"
        reply: null,
        repliedAt: null,
        repliedBy: null,
        createdAt: new Date().toISOString(),
      };
      mem.messages.set(id, item);
      saveStore();
      return item;
    },

    async reply(id, replyText, repliedBy = "Ms. Sarabjit Kaur (Assistant Professor)", status = "Resolved") {
      const item = mem.messages.get(id);
      if (!item) return null;
      item.reply = replyText;
      item.repliedAt = new Date().toISOString();
      item.repliedBy = repliedBy;
      item.status = status;
      mem.messages.set(id, item);
      saveStore();
      return item;
    },
  },
};

module.exports = db;
