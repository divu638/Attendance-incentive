import React, { useEffect, useState, useCallback } from "react";
import {
  Users,
  CalendarCheck,
  PlusCircle,
  BarChart3,
  History,
  UserCheck,
  UserPlus,
  CheckCircle2,
  Settings as SettingsIcon,
  Search,
  CheckSquare,
  Square,
  Sparkles,
  MessageSquare,
  Send,
  Clock,
  MessageCircle,
  Filter,
  ArrowRight,
  Download,
} from "lucide-react";
import { isAddress } from "../chain.js";
import { api } from "../api.js";
import RegisterGrid from "../components/RegisterGrid.jsx";
import BlockchainExplorer from "../components/BlockchainExplorer.jsx";

const short = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "");

export default function Teacher({ contract, address, sendTx, notify, activeTab, setActiveTab, theme, toggleTheme }) {
  const [form, setForm] = useState({
    wallet: "",
    name: "",
    roll: "",
    department: "Computer Science & Engineering",
    semester: "Semester 6",
  });
  const [subject, setSubject] = useState("");
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState("");
  const [picked, setPicked] = useState({});
  const [already, setAlready] = useState(new Set());
  const [search, setSearch] = useState("");
  const [tick, setTick] = useState(0);
  const [messages, setMessages] = useState([]);
  const [msgFilter, setMsgFilter] = useState("all");
  const [replyText, setReplyText] = useState({});
  const [submittingReply, setSubmittingReply] = useState({});
  const [activePin, setActivePin] = useState(null);
  const [pinSeconds, setPinSeconds] = useState(0);

  useEffect(() => {
    if (!activePin || pinSeconds <= 0) return;
    const timer = setInterval(() => {
      setPinSeconds((s) => {
        if (s <= 1) {
          clearInterval(timer);
          setActivePin(null);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activePin, pinSeconds]);

  async function handleGeneratePin() {
    try {
      const res = await api.generateSessionCode(Number(sessionId || 0));
      setActivePin(res);
      setPinSeconds(res.remainingSeconds || 120);
      notify(`⚡ Live Classroom PIN: ${res.code} (Expires in 2 mins)`);
    } catch (e) {
      notify("Failed to generate PIN: " + e.message, "error");
    }
  }

  const exportCSV = async () => {
    try {
      const rows = [
        ["Roll No", "Student Name", "Department", "Semester", "Wallet Address", "Attended Sessions", "Total Sessions", "Attendance %", "Incentive Eligibility", "Certified By"],
      ];

      for (const s of students) {
        const pct = await contract.attendancePercent(s.walletAddress);
        const count = await contract.attendedCount(s.walletAddress);
        const total = await contract.totalSessions();
        const eligible = await contract.isEligible(s.walletAddress);
        rows.push([
          `"${s.rollNo || ""}"`,
          `"${s.name || ""}"`,
          `"${s.department || "Department of Engineering Block"}"`,
          `"${s.semester || "Semester 6"}"`,
          `"${s.walletAddress}"`,
          Number(count),
          Number(total),
          `${Number(pct)}%`,
          eligible ? "ELIGIBLE FOR 0.01 ETH" : "PENDING CRITERIA",
          "Ms. Sarabjit Kaur (Assistant Professor)",
        ]);
      }

      const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Attendify_Attendance_Register_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      notify("📥 Certified Attendance Register exported to CSV successfully!");
    } catch (e) {
      notify("Export failed: " + e.message, "error");
    }
  };

  const load = useCallback(async () => {
    try {
      const [st, se, msgs] = await Promise.all([
        api.students(),
        api.sessions(),
        api.messages().catch(() => []),
      ]);
      setStudents(st);
      setSessions(se);
      setMessages(msgs || []);
      if (se.length && sessionId === "") setSessionId(String(se[0].sessionId));
    } catch (e) {
      notify(e.message, "error");
    }
  }, [sessionId, notify]);

  useEffect(() => {
    load();
  }, [load, tick]);

  useEffect(() => {
    if (sessionId === "") return;
    api.attendance(sessionId)
      .then((rows) => setAlready(new Set(rows.map((r) => r.student))))
      .catch(() => setAlready(new Set()));
  }, [sessionId, tick]);

  const refresh = () => setTick((t) => t + 1);

  async function handleReply(id) {
    const text = (replyText[id] || "").trim();
    if (!text) {
      notify("Please enter a reply before resolving this ticket.", "error");
      return;
    }
    setSubmittingReply((p) => ({ ...p, [id]: true }));
    try {
      await api.replyMessage(id, { reply: text, status: "Resolved" });
      notify("✅ Response sent to student and query marked as Resolved!");
      setReplyText((p) => ({ ...p, [id]: "" }));
      const updated = await api.messages();
      setMessages(updated);
    } catch (e) {
      notify("Failed to send reply: " + e.message, "error");
    } finally {
      setSubmittingReply((p) => ({ ...p, [id]: false }));
    }
  }

  const guard = (ok, msg) => {
    if (!ok) notify(msg, "error");
    return ok;
  };

  async function register(e) {
    e.preventDefault();
    if (!guard(isAddress(form.wallet), "Enter a valid Ethereum wallet address (0x...).")) return;
    if (!guard(form.name.trim().length > 0, "Student name is required.")) return;
    if (!guard(form.roll.trim().length > 0, "Roll number is required.")) return;

    const tx = await sendTx(`Register ${form.name} on blockchain`, () => contract.registerStudent(form.wallet));
    if (tx) {
      try {
        await api.saveStudent({
          walletAddress: form.wallet,
          name: form.name.trim(),
          rollNo: form.roll.trim(),
          department: form.department,
          semester: form.semester,
        });
        notify(`🎉 Student ${form.name} enrolled and mapped in database!`);
      } catch (err) {
        notify("Saved on blockchain, but DB sync error: " + err.message, "error");
      }
      setForm({
        wallet: "",
        name: "",
        roll: "",
        department: "Computer Science & Engineering",
        semester: "Semester 6",
      });
      refresh();
    }
  }

  async function create(e) {
    e.preventDefault();
    if (!guard(subject.trim().length > 0, "Subject name cannot be empty.")) return;

    const tx = await sendTx(`Create Session "${subject}" on blockchain`, () => contract.createSession(subject.trim()));
    if (tx) {
      try {
        await api.saveSession({ subject: subject.trim() });
        notify(`⏱️ Academic session "${subject}" created on-chain!`);
      } catch (err) {
        notify("Session created on blockchain, DB error: " + err.message, "error");
      }
      setSubject("");
      refresh();
    }
  }

  const toggleStudent = (w) => {
    if (already.has(w)) return;
    setPicked((p) => ({ ...p, [w]: !p[w] }));
  };

  const selectAllEligible = () => {
    const next = {};
    filteredStudents.forEach((s) => {
      if (!already.has(s.walletAddress)) {
        next[s.walletAddress] = true;
      }
    });
    setPicked(next);
  };

  const deselectAll = () => setPicked({});

  async function mark() {
    const list = Object.keys(picked).filter((k) => picked[k] && !already.has(k));
    if (!guard(list.length > 0, "Select at least one unmarked student.")) return;

    const tx = await sendTx(`Mark ${list.length} student${list.length > 1 ? "s" : ""} present`, () =>
      contract.markAttendanceBatch(Number(sessionId), list)
    );
    if (tx) {
      notify(`✅ Successfully marked ${list.length} student(s) on-chain!`);
      setPicked({});
      refresh();
    }
  }

  const filteredStudents = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      (s.name || "").toLowerCase().includes(q) ||
      (s.rollNo || "").toLowerCase().includes(q) ||
      s.walletAddress.toLowerCase().includes(q)
    );
  });

  const selectedCount = Object.keys(picked).filter((k) => picked[k] && !already.has(k)).length;
  const pendingMessages = messages.filter((m) => m.status === "Pending");
  const resolvedMessages = messages.filter((m) => m.status === "Resolved");
  const filteredMessages = messages.filter((m) => {
    if (msgFilter === "pending") return m.status === "Pending";
    if (msgFilter === "resolved") return m.status === "Resolved";
    return true;
  });

  return (
    <div>
      {/* 1. OVERVIEW TAB */}
      {activeTab === "overview" && (
        <>
          {/* Welcome Banner for Ms. Sarabjit Kaur */}
          <div className="card" style={{ background: "linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)", border: "1px solid rgba(56, 189, 248, 0.3)", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
                  <span style={{ fontSize: "1.4rem" }}>👩‍🏫</span>
                  <h2 style={{ margin: 0, fontSize: "1.35rem" }}>Welcome, Ms. Sarabjit Kaur</h2>
                  <span style={{ fontSize: "0.75rem", background: "var(--secondary-light)", color: "var(--secondary)", padding: "0.2rem 0.5rem", borderRadius: "99px", fontWeight: 800 }}>
                    FACULTY PORTAL
                  </span>
                </div>
                <div style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>
                  Assistant Professor • Department of Engineering Block • Web3 Attendance & Smart Contracts
                </div>
              </div>
              {pendingMessages.length > 0 && (
                <button
                  type="button"
                  className="btn-primary"
                  style={{ fontSize: "0.85rem", padding: "0.55rem 1rem", display: "flex", alignItems: "center", gap: "0.4rem" }}
                  onClick={() => setActiveTab("messages")}
                >
                  <MessageSquare size={16} />
                  <span>{pendingMessages.length} Student {pendingMessages.length === 1 ? "Query" : "Queries"} Awaiting Reply ➔</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid-4">
            <div className="stat-box">
              <div className="stat-header">
                <span className="stat-label">Enrolled Students</span>
                <div className="stat-icon-wrapper" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                  🎒
                </div>
              </div>
              <div className="stat-value">{students.length}</div>
              <span className="stat-sub">Registered across classes</span>
            </div>

            <div className="stat-box">
              <div className="stat-header">
                <span className="stat-label">Conducted Sessions</span>
                <div className="stat-icon-wrapper" style={{ background: "var(--secondary-light)", color: "var(--secondary)" }}>
                  ⏱️
                </div>
              </div>
              <div className="stat-value">{sessions.length}</div>
              <span className="stat-sub">Logged on blockchain</span>
            </div>

            <div className="stat-box">
              <div className="stat-header">
                <span className="stat-label">Session Present</span>
                <div className="stat-icon-wrapper" style={{ background: "var(--emerald-light)", color: "var(--emerald)" }}>
                  ✅
                </div>
              </div>
              <div className="stat-value">{already.size} Students</div>
              <span className="stat-sub">Attended active session</span>
            </div>

            <div
              className="stat-box"
              style={{ cursor: "pointer" }}
              onClick={() => setActiveTab("messages")}
              title="Click to view student messages"
            >
              <div className="stat-header">
                <span className="stat-label">Student Helpdesk</span>
                <div className="stat-icon-wrapper" style={{ background: "rgba(245, 158, 11, 0.15)", color: "var(--amber)" }}>
                  💬
                </div>
              </div>
              <div className="stat-value">{messages.length} Queries</div>
              <span className="stat-sub" style={{ color: pendingMessages.length > 0 ? "var(--amber)" : "var(--emerald)", fontWeight: 700 }}>
                {pendingMessages.length > 0 ? `⏳ ${pendingMessages.length} need reply` : "✅ All tickets resolved"}
              </span>
            </div>
          </div>

          <div className="grid-2">
            <div className="card">
              <h3>⚡ Quick Mark Attendance</h3>
              <p className="muted" style={{ fontSize: "0.88rem", marginBottom: "1rem" }}>
                Active session #{sessions.length > 0 ? Number(sessionId) + 1 : 1}: {sessions[0]?.subject || "Create session first"}
              </p>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <button type="button" className="btn-primary" onClick={selectAllEligible} disabled={!sessions.length}>
                  Select All Unmarked
                </button>
                <button type="button" className="btn-emerald" onClick={mark} disabled={selectedCount === 0}>
                  Submit ({selectedCount}) On-Chain
                </button>
              </div>
            </div>

            <div className="card">
              <h3>📅 Recent Academic Sessions</h3>
              {sessions.length === 0 ? (
                <p className="muted">No sessions held yet.</p>
              ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {sessions.slice(0, 3).map((s) => (
                    <li key={s.sessionId} style={{ display: "flex", justifyContent: "space-between", padding: "0.6rem 0", borderBottom: "1px solid var(--border)" }}>
                      <span>Session #{s.sessionId + 1}: <strong>{s.subject}</strong></span>
                      <span className="muted" style={{ fontSize: "0.8rem" }}>{s.date ? new Date(s.date).toLocaleDateString() : "Active"}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Anti-Proxy Live Classroom PIN Generator */}
          <div className="card" style={{ background: "linear-gradient(135deg, rgba(139, 92, 246, 0.06) 0%, rgba(56, 189, 248, 0.06) 100%)", border: "1px solid rgba(139, 92, 246, 0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <span style={{ fontSize: "1.4rem" }}>🛡️</span>
                  <h3 style={{ margin: 0 }}>Anti-Proxy Live Classroom Presence Code</h3>
                  <span style={{ fontSize: "0.72rem", background: "var(--primary-light)", color: "var(--primary)", padding: "0.15rem 0.45rem", borderRadius: "99px", fontWeight: 800 }}>
                    PROJECTOR DISPLAY
                  </span>
                </div>
                <p className="muted" style={{ margin: "0.3rem 0 0", fontSize: "0.85rem", maxWidth: "60ch" }}>
                  Project this dynamic 6-digit PIN on the classroom screen. Students in the room enter this rolling PIN on their portal to verify physical presence.
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                {activePin ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", background: "var(--bg-app)", padding: "0.6rem 1.2rem", borderRadius: "8px", border: "2px solid var(--primary)" }}>
                    <div>
                      <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 800 }}>LIVE CLASS PIN</div>
                      <div style={{ fontSize: "1.7rem", fontWeight: 900, letterSpacing: "3px", color: "var(--primary)", fontFamily: "monospace" }}>
                        {activePin.code.slice(0, 3)}-{activePin.code.slice(3)}
                      </div>
                    </div>
                    <div style={{ borderLeft: "1px solid var(--border)", paddingLeft: "0.8rem", textAlign: "center" }}>
                      <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase" }}>EXPIRES IN</div>
                      <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--amber)" }}>
                        {pinSeconds}s
                      </div>
                    </div>
                  </div>
                ) : null}

                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleGeneratePin}
                  style={{ padding: "0.75rem 1.2rem", display: "flex", alignItems: "center", gap: "0.4rem" }}
                >
                  <span>⚡ {activePin ? "Refresh 6-Digit PIN" : "Generate Live Classroom PIN"}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <h3>📊 Master Attendance Register Matrix</h3>
            <RegisterGrid refreshKey={tick} />
          </div>
        </>
      )}

      {/* 2. ENROLL STUDENT TAB */}
      {activeTab === "registerStudent" && (
        <div className="card" style={{ maxWidth: "680px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "1.8rem" }}>📝</span>
            <h2 style={{ margin: 0 }}>Enroll New Student On-Chain</h2>
          </div>
          <p className="muted" style={{ marginBottom: "1.5rem" }}>
            Registers student wallet address into the Ethereum contract and maps profile metadata into the database.
          </p>

          <form onSubmit={register}>
            <div className="form-group" style={{ marginBottom: "1.2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                <label className="form-label" style={{ fontWeight: 700, margin: 0 }}>
                  Student Ethereum Wallet Address *
                </label>
                <button
                  type="button"
                  style={{
                    background: "rgba(139, 92, 246, 0.15)",
                    border: "1px solid rgba(139, 92, 246, 0.35)",
                    color: "var(--primary)",
                    borderRadius: "6px",
                    padding: "0.2rem 0.6rem",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                  onClick={() => {
                    const randAddr = "0x" + Array.from(crypto.getRandomValues(new Uint8Array(20))).map((b) => b.toString(16).padStart(2, "0")).join("");
                    setForm({ ...form, wallet: randAddr });
                    notify("Generated new valid test wallet address!");
                  }}
                >
                  🎲 Auto-Generate Test Wallet
                </button>
              </div>
              <input
                type="text"
                className="form-input"
                placeholder="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
                value={form.wallet}
                onChange={(e) => setForm({ ...form, wallet: e.target.value.trim() })}
                required
              />
              <small style={{ color: "var(--text-muted)", fontSize: "0.78rem", display: "block", marginTop: "0.35rem" }}>
                💡 Students copy this address from their <strong>MetaMask</strong> wallet. For testing, click <strong>🎲 Auto-Generate Test Wallet</strong>.
              </small>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" style={{ display: "block", fontWeight: 700, marginBottom: "0.4rem" }}>Full Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Alice Johnson"
                  value={form.name}
                  maxLength={80}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: "block", fontWeight: 700, marginBottom: "0.4rem" }}>Roll / Student ID *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="CS-2024-042"
                  value={form.roll}
                  maxLength={40}
                  onChange={(e) => setForm({ ...form, roll: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" style={{ display: "block", fontWeight: 700, marginBottom: "0.4rem" }}>Department</label>
                <select
                  className="form-input"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                >
                  <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electronics & Communication">Electronics & Communication</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: "block", fontWeight: 700, marginBottom: "0.4rem" }}>Academic Semester</label>
                <select
                  className="form-input"
                  value={form.semester}
                  onChange={(e) => setForm({ ...form, semester: e.target.value })}
                >
                  <option value="Semester 1">Semester 1</option>
                  <option value="Semester 2">Semester 2</option>
                  <option value="Semester 3">Semester 3</option>
                  <option value="Semester 4">Semester 4</option>
                  <option value="Semester 5">Semester 5</option>
                  <option value="Semester 6">Semester 6</option>
                  <option value="Semester 7">Semester 7</option>
                  <option value="Semester 8">Semester 8</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ width: "100%", marginTop: "1rem" }}>
              <span>📝 Enroll Student on Ethereum</span>
            </button>
          </form>
        </div>
      )}

      {/* 3. CREATE SESSION TAB */}
      {activeTab === "createSession" && (
        <div className="card" style={{ maxWidth: "680px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "1.8rem" }}>⏱️</span>
            <h2 style={{ margin: 0 }}>Start New Class Session</h2>
          </div>
          <p className="muted" style={{ marginBottom: "1.5rem" }}>
            Broadcasts a new sequential academic session onto the Ethereum blockchain.
          </p>

          <form onSubmit={create}>
            <div className="form-group" style={{ marginBottom: "1.2rem" }}>
              <label className="form-label" style={{ display: "block", fontWeight: 700, marginBottom: "0.4rem" }}>
                Session Subject / Topic Title *
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Distributed Consensus & Raft Protocol"
                value={subject}
                maxLength={120}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            <div style={{ padding: "1rem", background: "var(--bg-app)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", marginBottom: "1.5rem" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--primary)" }}>
                Next Session Index: #{sessions.length + 1}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Each session is indexed sequentially on-chain with duplicate attendance protection.
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ width: "100%" }}>
              <span>⏱️ Broadcast Session to Blockchain</span>
            </button>
          </form>
        </div>
      )}

      {/* 4. MARK ATTENDANCE TAB */}
      {activeTab === "markAttendance" && (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <span style={{ fontSize: "1.8rem" }}>✅</span>
                <h2 style={{ margin: 0 }}>Roll Call & Batch Attendance</h2>
              </div>
              <p className="muted" style={{ margin: "0.2rem 0 0", fontSize: "0.88rem" }}>
                Select students and batch-sign the cryptographic attendance transaction via MetaMask.
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.8rem", alignItems: "center" }}>
              <select
                className="form-input"
                style={{ width: "auto" }}
                value={sessionId}
                onChange={(e) => {
                  setSessionId(e.target.value);
                  setPicked({});
                }}
              >
                {sessions.map((s) => (
                  <option key={s.sessionId} value={s.sessionId}>
                    Session #{s.sessionId + 1}: {s.subject}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ position: "relative", minWidth: "260px" }}>
              <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                type="text"
                className="form-input"
                placeholder="Search name, roll no, address…"
                style={{ paddingLeft: "2.4rem" }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", gap: "0.6rem" }}>
              <button type="button" className="btn-secondary" onClick={selectAllEligible} style={{ padding: "0.5rem 0.9rem", fontSize: "0.85rem" }}>
                Select All
              </button>
              <button type="button" className="btn-secondary" onClick={deselectAll} style={{ padding: "0.5rem 0.9rem", fontSize: "0.85rem" }}>
                Clear
              </button>
              <button
                type="button"
                className="btn-emerald"
                disabled={selectedCount === 0}
                onClick={mark}
                style={{ padding: "0.5rem 1.2rem", fontSize: "0.88rem" }}
              >
                Submit ({selectedCount}) On-Chain
              </button>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: "40px" }}>Check</th>
                  <th>Student Name</th>
                  <th>Roll No</th>
                  <th>Department</th>
                  <th>Wallet Address</th>
                  <th>Session Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s) => {
                  const isAlreadyMarked = already.has(s.walletAddress);
                  const isChecked = picked[s.walletAddress] || false;
                  return (
                    <tr
                      key={s.walletAddress}
                      onClick={() => toggleStudent(s.walletAddress)}
                      style={{ cursor: isAlreadyMarked ? "default" : "pointer" }}
                    >
                      <td>
                        {isAlreadyMarked ? (
                          <CheckSquare size={18} color="var(--emerald)" />
                        ) : isChecked ? (
                          <CheckSquare size={18} color="var(--primary)" />
                        ) : (
                          <Square size={18} color="var(--text-muted)" />
                        )}
                      </td>
                      <td><strong>{s.name || "Student"}</strong></td>
                      <td>{s.rollNo || "N/A"}</td>
                      <td>{s.department || "Engineering"}</td>
                      <td><code>{short(s.walletAddress)}</code></td>
                      <td>
                        <span className={`status-pill ${isAlreadyMarked ? "pill-success" : isChecked ? "pill-info" : "pill-warning"}`}>
                          {isAlreadyMarked ? "✅ Present" : isChecked ? "⚡ Selected" : "⏳ Unmarked"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. REPORTS TAB */}
      {activeTab === "reports" && (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.8rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ fontSize: "1.8rem" }}>📈</span>
              <div>
                <h2 style={{ margin: 0 }}>Master Attendance Register Matrix</h2>
                <span className="muted" style={{ fontSize: "0.82rem" }}>
                  Certified On-Chain Academic Record • Department of Engineering Block
                </span>
              </div>
            </div>

            <button
              type="button"
              className="btn-emerald"
              onClick={exportCSV}
              style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.55rem 1.1rem" }}
            >
              <Download size={16} />
              <span>📥 Export Certified On-Chain Register (CSV)</span>
            </button>
          </div>
          <RegisterGrid refreshKey={tick} />
        </div>
      )}

      {/* 5b. STUDENT HELPDESK & QUERIES TAB */}
      {activeTab === "messages" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Header Card */}
          <div className="card" style={{ background: "linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)", border: "1px solid rgba(56, 189, 248, 0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <span style={{ fontSize: "2.6rem" }}>💬</span>
                <div>
                  <h2 style={{ margin: 0 }}>Student Helpdesk & Grievance Portal</h2>
                  <div style={{ marginTop: "0.2rem", fontSize: "0.92rem", color: "var(--text)" }}>
                    Instructor: <strong>Ms. Sarabjit Kaur</strong> • <span style={{ color: "var(--text-muted)" }}>Assistant Professor, Department of Engineering Block</span>
                  </div>
                  <p className="muted" style={{ margin: "0.3rem 0 0", fontSize: "0.85rem" }}>
                    Review student attendance inquiries, excused absences, and academic feedback. Send official responses directly to student dashboards.
                  </p>
                </div>
              </div>

              {/* Status Counters */}
              <div style={{ display: "flex", gap: "0.8rem" }}>
                <div style={{ padding: "0.6rem 1rem", borderRadius: "8px", background: "var(--bg-app)", border: "1px solid var(--border)", textAlign: "center" }}>
                  <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text)" }}>{messages.length}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Total Tickets</div>
                </div>
                <div style={{ padding: "0.6rem 1rem", borderRadius: "8px", background: "rgba(245, 158, 11, 0.12)", border: "1px solid rgba(245, 158, 11, 0.3)", textAlign: "center" }}>
                  <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--amber)" }}>{pendingMessages.length}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--amber)", textTransform: "uppercase" }}>Pending</div>
                </div>
                <div style={{ padding: "0.6rem 1rem", borderRadius: "8px", background: "var(--emerald-light)", border: "1px solid rgba(16, 185, 129, 0.3)", textAlign: "center" }}>
                  <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--emerald)" }}>{resolvedMessages.length}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--emerald)", textTransform: "uppercase" }}>Resolved</div>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <Filter size={15} /> Filter:
            </span>
            <button
              type="button"
              className={`btn-secondary ${msgFilter === "all" ? "active" : ""}`}
              style={{ fontSize: "0.82rem", padding: "0.4rem 0.8rem", background: msgFilter === "all" ? "var(--primary)" : "transparent", color: msgFilter === "all" ? "#fff" : "var(--text)" }}
              onClick={() => setMsgFilter("all")}
            >
              All ({messages.length})
            </button>
            <button
              type="button"
              className={`btn-secondary ${msgFilter === "pending" ? "active" : ""}`}
              style={{ fontSize: "0.82rem", padding: "0.4rem 0.8rem", background: msgFilter === "pending" ? "var(--amber)" : "transparent", color: msgFilter === "pending" ? "#fff" : "var(--text)" }}
              onClick={() => setMsgFilter("pending")}
            >
              ⏳ Pending Review ({pendingMessages.length})
            </button>
            <button
              type="button"
              className={`btn-secondary ${msgFilter === "resolved" ? "active" : ""}`}
              style={{ fontSize: "0.82rem", padding: "0.4rem 0.8rem", background: msgFilter === "resolved" ? "var(--emerald)" : "transparent", color: msgFilter === "resolved" ? "#fff" : "var(--text)" }}
              onClick={() => setMsgFilter("resolved")}
            >
              ✅ Resolved ({resolvedMessages.length})
            </button>
          </div>

          {/* Ticket Cards */}
          {filteredMessages.length === 0 ? (
            <div className="card" style={{ padding: "3rem", textAlign: "center" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🎉</div>
              <h3>No tickets in this view!</h3>
              <p className="muted" style={{ margin: 0, fontSize: "0.88rem" }}>
                All student queries and grievances have been resolved.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              {filteredMessages.map((m) => {
                const isResolved = m.status === "Resolved";
                return (
                  <div
                    key={m.id}
                    className="card"
                    style={{
                      borderLeft: `5px solid ${isResolved ? "var(--emerald)" : "var(--amber)"}`,
                      position: "relative",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.8rem", marginBottom: "0.8rem" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "1.05rem", fontWeight: 800 }}>
                            🎒 {m.studentName || "Student"}
                          </span>
                          <span style={{ fontSize: "0.82rem", background: "var(--bg-app)", padding: "0.15rem 0.5rem", borderRadius: "4px", border: "1px solid var(--border)", fontWeight: 700 }}>
                            Roll: {m.rollNo || "N/A"}
                          </span>
                          <span style={{ fontSize: "0.75rem", background: "var(--primary-light)", color: "var(--primary)", padding: "0.15rem 0.55rem", borderRadius: "99px", fontWeight: 800 }}>
                            {m.category}
                          </span>
                        </div>
                        <h4 style={{ margin: "0.4rem 0 0", fontSize: "1.05rem" }}>{m.subject}</h4>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <span
                          className="status-pill"
                          style={{
                            background: isResolved ? "var(--emerald-light)" : "rgba(245, 158, 11, 0.15)",
                            color: isResolved ? "var(--emerald)" : "var(--amber)",
                            fontSize: "0.78rem",
                          }}
                        >
                          {isResolved ? "✅ Resolved" : "⏳ Pending Action"}
                        </span>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {new Date(m.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Student Message Body */}
                    <div style={{ padding: "1rem", background: "var(--bg-app)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.92rem", lineHeight: 1.5, marginBottom: "1rem" }}>
                      {m.message}
                    </div>

                    {/* Existing Response if resolved */}
                    {m.reply && (
                      <div style={{ padding: "0.85rem 1rem", background: "var(--emerald-light)", borderLeft: "4px solid var(--emerald)", borderRadius: "0 6px 6px 0", marginBottom: "1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.82rem", fontWeight: 800, color: "var(--emerald)", marginBottom: "0.25rem" }}>
                          <span>👩‍🏫</span>
                          <span>Response by {m.repliedBy || "Ms. Sarabjit Kaur (Assistant Professor)"}:</span>
                        </div>
                        <div style={{ fontSize: "0.88rem", color: "var(--text)" }}>{m.reply}</div>
                        {m.repliedAt && (
                          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
                            Replied on {new Date(m.repliedAt).toLocaleDateString()} at {new Date(m.repliedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Reply Box for Faculty */}
                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.4rem" }}>
                        {isResolved ? "Update / Send Follow-Up Response:" : "Write Official Faculty Response:"}
                      </label>

                      {/* Quick Canned Chips */}
                      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.6rem" }}>
                        {[
                          "Attendance verified and updated on-chain.",
                          "Please bring your medical certificate to Engineering Block.",
                          "Noted with thanks! Keep up the consistent presence.",
                          "Query reviewed. Please see me after tomorrow's lab.",
                        ].map((canned, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className="btn-secondary"
                            style={{ fontSize: "0.74rem", padding: "0.2rem 0.55rem" }}
                            onClick={() => setReplyText((p) => ({ ...p, [m.id]: canned }))}
                          >
                            + "{canned.slice(0, 32)}..."
                          </button>
                        ))}
                      </div>

                      <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
                        <textarea
                          className="form-input"
                          rows={2}
                          value={replyText[m.id] || ""}
                          onChange={(e) => setReplyText((p) => ({ ...p, [m.id]: e.target.value }))}
                          placeholder="Type official reply as Ms. Sarabjit Kaur..."
                          style={{ resize: "vertical", fontFamily: "inherit" }}
                        />
                        <button
                          type="button"
                          className="btn-primary"
                          style={{ whiteSpace: "nowrap", padding: "0.75rem 1.2rem" }}
                          disabled={submittingReply[m.id]}
                          onClick={() => handleReply(m.id)}
                        >
                          <Send size={15} />
                          <span>{submittingReply[m.id] ? "Saving..." : isResolved ? "Update Reply" : "Resolve Ticket"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 6. HISTORY TAB */}
      {activeTab === "history" && (
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <span style={{ fontSize: "1.8rem" }}>⛓️</span>
            <div>
              <h3 style={{ margin: 0 }}>Decentralized Ledger Audit Log</h3>
              <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
                Real-time Ethereum smart contract transactions.
              </p>
            </div>
          </div>
          <BlockchainExplorer contract={contract} />
        </div>
      )}

      {/* 7. PROFILE TAB */}
      {activeTab === "profile" && (
        <div className="card" style={{ maxWidth: "680px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.2rem" }}>
            <span style={{ fontSize: "2rem" }}>👩‍🏫</span>
            <div>
              <h3 style={{ margin: 0 }}>Faculty Instructor Web3 Profile</h3>
              <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
                Authorized Teacher on Attendify Smart Contract
              </p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ padding: "0.85rem", background: "var(--bg-app)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Faculty Name</div>
                <div style={{ fontWeight: 800, marginTop: "0.2rem", fontSize: "1.05rem" }}>Ms. Sarabjit Kaur</div>
              </div>
              <div style={{ padding: "0.85rem", background: "var(--bg-app)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Designation</div>
                <div style={{ fontWeight: 800, marginTop: "0.2rem", fontSize: "1.05rem", color: "var(--secondary)" }}>Assistant Professor</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ padding: "0.85rem", background: "var(--bg-app)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Academic Department</div>
                <div style={{ fontWeight: 700, marginTop: "0.2rem" }}>Department of Engineering Block</div>
              </div>
              <div style={{ padding: "0.85rem", background: "var(--bg-app)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Official Email</div>
                <div style={{ fontWeight: 700, marginTop: "0.2rem" }}>sarabjit.kaur@college.edu</div>
              </div>
            </div>

            <div style={{ padding: "0.85rem", background: "var(--bg-app)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Authorized Teacher Wallet (Signer)</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.88rem", wordBreak: "break-all", marginTop: "0.2rem" }}>{address}</div>
            </div>

            <div style={{ padding: "0.85rem", background: "var(--emerald-light)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(16, 185, 129, 0.4)", display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span style={{ fontSize: "1.2rem" }}>🛡️</span>
              <div>
                <strong style={{ color: "var(--emerald)", fontSize: "0.88rem" }}>Cryptographically Authorized On-Chain</strong>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  Has <code>onlyTeacher</code> permissions in <code>AttendanceIncentive.sol</code> to create sessions and batch mark student attendance.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. SETTINGS TAB */}
      {activeTab === "settings" && (
        <div className="card" style={{ maxWidth: "680px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.2rem" }}>
            <span style={{ fontSize: "1.8rem" }}>⚙️</span>
            <h3 style={{ margin: 0 }}>Faculty Settings</h3>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", background: "var(--bg-app)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
            <div>
              <div style={{ fontWeight: 700 }}>Color Theme</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Toggle light / dark mode</div>
            </div>
            <button type="button" className="btn-secondary" onClick={toggleTheme}>
              {theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
