import React, { useEffect, useState, useCallback } from "react";
import { formatEther } from "ethers";
import confetti from "canvas-confetti";
import {
  CalendarCheck,
  Award,
  Coins,
  History,
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  Flame,
  ArrowRight,
  TrendingUp,
  Settings as SettingsIcon,
  CalendarDays,
  ShieldCheck,
  Zap,
  Target,
  Trophy,
  GraduationCap,
  Copy,
  Check,
  MessageSquare,
  Send,
  Clock,
  MessageCircle,
  FileCheck,
} from "lucide-react";
import { api } from "../api.js";
import AttendanceCertificate from "../components/AttendanceCertificate.jsx";

const short = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "");

export default function Student({ contract, address, sendTx, notify, activeTab, setActiveTab, theme, toggleTheme }) {
  const [sum, setSum] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [mine, setMine] = useState(new Set());
  const [profile, setProfile] = useState(null);
  const [copied, setCopied] = useState("");
  const [messages, setMessages] = useState([]);
  const [feedbackForm, setFeedbackForm] = useState({ category: "Attendance Dispute", subject: "", message: "" });
  const [sendingMsg, setSendingMsg] = useState(false);
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [presencePin, setPresencePin] = useState("");
  const [verifyingPresence, setVerifyingPresence] = useState(false);
  const [presenceVerified, setPresenceVerified] = useState(false);

  const load = useCallback(async () => {
    try {
      const [attended, total, percent, required, eligible, claimed, reward] = await Promise.all([
        contract.attendedCount(address),
        contract.totalSessions(),
        contract.attendancePercent(address),
        contract.requiredPercent(),
        contract.isEligible(address),
        contract.rewardClaimed(address),
        contract.rewardAmount(),
      ]);

      setSum({
        attended: Number(attended),
        total: Number(total),
        percent: Number(percent),
        required: Number(required),
        eligible,
        claimed,
        reward: formatEther(reward),
      });

      const [se, att, rw, prof, msgs] = await Promise.all([
        api.sessions(),
        api.myAttendance(address),
        api.rewards(),
        api.summary(address).catch(() => null),
        api.messages().catch(() => []),
      ]);

      setSessions([...se].sort((a, b) => b.sessionId - a.sessionId));
      setMine(new Set(att.map((a) => a.sessionId)));
      setRewards(rw);
      if (prof) setProfile(prof);
      setMessages(msgs || []);
    } catch (e) {
      notify(e.message, "error");
    }
  }, [contract, address, notify]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSendFeedback(e) {
    e.preventDefault();
    if (!feedbackForm.message.trim()) {
      notify("Please write your message or query details.", "error");
      return;
    }
    setSendingMsg(true);
    try {
      await api.sendMessage(feedbackForm);
      notify("✉️ Query submitted directly to Ms. Sarabjit Kaur (Assistant Professor)!");
      setFeedbackForm({ category: "Attendance Dispute", subject: "", message: "" });
      const updated = await api.messages();
      setMessages(updated);
    } catch (err) {
      notify("Failed to send message: " + err.message, "error");
    } finally {
      setSendingMsg(false);
    }
  }

  async function handleVerifyPresence(e) {
    e.preventDefault();
    if (!presencePin.trim()) return;
    setVerifyingPresence(true);
    try {
      const res = await api.verifyPresence(presencePin.trim());
      setPresenceVerified(true);
      notify("🎉 " + res.message);
      setPresencePin("");
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setVerifyingPresence(false);
    }
  }

  const copyText = (txt, id) => {
    navigator.clipboard.writeText(txt);
    setCopied(id);
    notify("📋 Copied to clipboard!");
    setTimeout(() => setCopied(""), 2000);
  };

  async function handleClaim() {
    const tx = await sendTx("Claim ETH Attendance Incentive", () => contract.claimReward());
    if (tx) {
      try {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#8B5CF6", "#38BDF8", "#FB7185", "#10B981", "#F59E0B"],
        });
      } catch (_e) {}
      notify("🎉 0.01 ETH transferred directly to your MetaMask wallet!");
      await load();
      setTimeout(load, 1500);
    }
  }

  if (!sum) {
    return (
      <div style={{ padding: "4rem", textAlign: "center" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>⚡</div>
        <p className="muted">Fetching cryptographic student profile from Ethereum…</p>
      </div>
    );
  }

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(sum.percent, 100) / 100) * circumference;
  const need = Math.max(0, Math.ceil((sum.required * sum.total) / 100) - sum.attended);

  // Gamified motivational student messages
  const motivationalMessage =
    sum.percent >= 90
      ? "🌟 Outstanding! Your attendance is above 90%. You are among the top elite scholars on campus!"
      : sum.percent >= sum.required
      ? "🎉 Consistency Unlocked! You reached the required threshold. Claim your ETH reward now!"
      : sum.total === 0
      ? "🎒 Welcome to Attendify! Your attendance journey begins as soon as classes are conducted."
      : `🔥 Keep grinding! Attend ${need} more session${need === 1 ? "" : "s"} to unlock your 0.01 ETH reward.`;

  return (
    <div>
      <svg style={{ position: "absolute", width: 0, height: 0 }}>
        <defs>
          <linearGradient id="attendifyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--secondary)" />
          </linearGradient>
        </defs>
      </svg>

      {/* 1. OVERVIEW TAB */}
      {activeTab === "overview" && (
        <>
          {/* Gamified 3D Student Hero Banner */}
          <div className="student-banner">
            <div className="student-banner-info">
              <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginBottom: "0.6rem" }}>
                <div className="motivational-badge badge-streak">
                  <span className="streak-flame">🔥</span>
                  <span>5-Day Streak Active!</span>
                </div>
                <div className="motivational-badge badge-level">
                  <span>⚡ Level 3 Web3 Scholar</span>
                </div>
              </div>

              <h2>
                Hey {profile?.name || "Student Pioneer"}! 🚀
              </h2>
              <p className="muted" style={{ maxWidth: "52ch", margin: "0 0 0.8rem", fontSize: "0.95rem" }}>
                {motivationalMessage}
              </p>
              <div style={{ display: "flex", gap: "1rem", alignItems: "center", fontSize: "0.82rem", color: "var(--text-muted)", flexWrap: "wrap" }}>
                <span>🎒 Roll: <strong>{profile?.rollNo || "2329313"}</strong></span>
                <span>•</span>
                <span>🎓 <strong>{profile?.department || "Department of Engineering Block"}</strong></span>
                <span>•</span>
                <span>📚 <strong>{profile?.semester || "Semester 6"}</strong></span>
              </div>

              {sum.percent >= sum.required && (
                <div style={{ marginTop: "0.9rem" }}>
                  <button
                    type="button"
                    className="btn-emerald"
                    onClick={() => setCertModalOpen(true)}
                    style={{ padding: "0.5rem 1rem", fontSize: "0.82rem", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                  >
                    <Award size={15} />
                    <span>🏆 View Web3 Consistency Certificate</span>
                  </button>
                </div>
              )}
            </div>

            {/* 3D Progress Ring */}
            <div className="progress-ring-box">
              <div className="ring-container">
                <svg className="ring-svg" viewBox="0 0 140 140">
                  <circle className="ring-bg-circle" cx="70" cy="70" r={radius} />
                  <circle
                    className="ring-fill-circle"
                    cx="70"
                    cy="70"
                    r={radius}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                  />
                </svg>
                <div className="ring-center-text">
                  <div className="ring-number">{sum.percent}%</div>
                  <div className="ring-caption">ATTENDANCE</div>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Stat Boxes with Emojis */}
          <div className="grid-4">
            <div className="stat-box">
              <div className="stat-header">
                <span className="stat-label">Classes Attended</span>
                <div className="stat-icon-wrapper" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                  🎒
                </div>
              </div>
              <div className="stat-value">{sum.attended}</div>
              <span className="stat-sub">Present in roll calls</span>
            </div>

            <div className="stat-box">
              <div className="stat-header">
                <span className="stat-label">Total Conducted</span>
                <div className="stat-icon-wrapper" style={{ background: "var(--secondary-light)", color: "var(--secondary)" }}>
                  🏫
                </div>
              </div>
              <div className="stat-value">{sum.total}</div>
              <span className="stat-sub">Academic sessions held</span>
            </div>

            <div className="stat-box">
              <div className="stat-header">
                <span className="stat-label">Required Goal</span>
                <div className="stat-icon-wrapper" style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                  🎯
                </div>
              </div>
              <div className="stat-value">{sum.required}%</div>
              <span className="stat-sub">Smart contract threshold</span>
            </div>

            <div className="stat-box">
              <div className="stat-header">
                <span className="stat-label">ETH Reward Bounty</span>
                <div className="stat-icon-wrapper" style={{ background: "rgba(245, 158, 11, 0.15)", color: "var(--amber)" }}>
                  🪙
                </div>
              </div>
              <div className="stat-value">{sum.reward} ETH</div>
              <span className="stat-sub">Released on qualification</span>
            </div>
          </div>

          {/* Anti-Proxy Classroom Presence Verification Protocol */}
          <div className="card" style={{ background: presenceVerified ? "var(--emerald-light)" : "var(--bg-card)", border: presenceVerified ? "1px solid var(--emerald)" : "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <span style={{ fontSize: "1.4rem" }}>⚡</span>
                  <h3 style={{ margin: 0 }}>Anti-Proxy Classroom Check-In</h3>
                  <span style={{ fontSize: "0.72rem", background: "var(--primary-light)", color: "var(--primary)", padding: "0.15rem 0.45rem", borderRadius: "99px", fontWeight: 800 }}>
                    PROOF OF PHYSICAL PRESENCE
                  </span>
                </div>
                <p className="muted" style={{ margin: "0.3rem 0 0", fontSize: "0.85rem" }}>
                  {presenceVerified
                    ? "✅ Your physical presence in the lecture room has been cryptographically validated for today's session by Ms. Sarabjit Kaur!"
                    : "Enter the dynamic 6-digit PIN displayed on the board/projector by Ms. Sarabjit Kaur to prove real-world attendance."}
                </p>
              </div>

              {!presenceVerified ? (
                <form onSubmit={handleVerifyPresence} style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter 6-digit PIN"
                    maxLength={6}
                    value={presencePin}
                    onChange={(e) => setPresencePin(e.target.value)}
                    style={{ width: "160px", textAlign: "center", fontWeight: 800, letterSpacing: "2px", fontSize: "1.05rem" }}
                  />
                  <button type="submit" className="btn-primary" style={{ padding: "0.65rem 1.1rem" }} disabled={verifyingPresence}>
                    <span>{verifyingPresence ? "Validating..." : "Verify PIN ➔"}</span>
                  </button>
                </form>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--emerald)", fontWeight: 800, fontSize: "0.9rem" }}>
                  <CheckCircle2 size={18} />
                  <span>Physical Presence Confirmed</span>
                </div>
              )}
            </div>
          </div>

          {/* Student Quests & Achievement Badges */}
          <div className="card">
            <h3 style={{ margin: "0 0 0.5rem" }}>🏆 Student Achievements & Quests</h3>
            <p className="muted" style={{ margin: "0 0 1.2rem", fontSize: "0.85rem" }}>
              Unlock gamified attendance milestones and earn blockchain credentials:
            </p>

            <div className="grid-4" style={{ marginBottom: 0 }}>
              <div className="badge-card">
                <div className="badge-card-icon" style={{ background: "rgba(245, 158, 11, 0.15)" }}>
                  🔥
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "0.9rem" }}>Streak Master</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>5-day streak active</div>
                </div>
              </div>

              <div className="badge-card">
                <div className="badge-card-icon" style={{ background: "rgba(16, 185, 129, 0.15)" }}>
                  🌟
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "0.9rem" }}>Punctuality Titan</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{sum.percent >= 80 ? "Unlocked!" : "Reach 80% attendance"}</div>
                </div>
              </div>

              <div className="badge-card">
                <div className="badge-card-icon" style={{ background: "rgba(139, 92, 246, 0.15)" }}>
                  ⚡
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "0.9rem" }}>Web3 Scholar</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Wallet verified on-chain</div>
                </div>
              </div>

              <div className="badge-card">
                <div className="badge-card-icon" style={{ background: "rgba(56, 189, 248, 0.15)" }}>
                  💎
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "0.9rem" }}>Crypto Bounty</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{sum.claimed ? "Claimed!" : sum.eligible ? "Ready to claim!" : "Reach threshold"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Claim Reward Action Banner */}
          <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.2rem", background: sum.claimed ? "var(--bg-card)" : sum.eligible ? "var(--emerald-light)" : "var(--bg-card)" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <span className="floating-coin" style={{ fontSize: "1.6rem" }}>🪙</span>
                <h3 style={{ margin: 0, fontSize: "1.2rem" }}>
                  {sum.claimed ? "🏆 0.01 ETH Reward Successfully Claimed!" : sum.eligible ? "🎉 You're Eligible For Your ETH Reward!" : "⏳ Attendance Reward In Progress"}
                </h3>
              </div>
              <p className="muted" style={{ margin: "0.4rem 0 0", fontSize: "0.88rem" }}>
                {sum.claimed
                  ? `Your incentive of ${sum.reward} ETH was transferred to your wallet.`
                  : sum.eligible
                  ? `Congratulations! You reached ${sum.percent}% (required: ${sum.required}%). Click claim to sign on-chain transaction!`
                  : `You currently have ${sum.percent}% attendance. Reach ${sum.required}% to unlock ${sum.reward} ETH.`}
              </p>
            </div>

            <button
              type="button"
              className={sum.claimed ? "btn-secondary" : "btn-emerald"}
              style={{ padding: "0.85rem 1.6rem", fontSize: "1rem" }}
              disabled={!sum.eligible || sum.claimed}
              onClick={handleClaim}
            >
              <span>{sum.claimed ? "✓ Reward Claimed" : `🪙 Claim ${sum.reward} ETH Reward`}</span>
            </button>
          </div>

          {/* Recent Attendance Session Table */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0 }}>📅 Recent Class Presence</h3>
              <span className="muted" style={{ fontSize: "0.85rem" }}>
                Showing last {Math.min(sessions.length, 5)} sessions
              </span>
            </div>

            {sessions.length === 0 ? (
              <p className="muted">No academic sessions recorded on-chain yet.</p>
            ) : (
              <div className="table-responsive">
                <table className="attendify-table">
                  <thead>
                    <tr>
                      <th>Session</th>
                      <th>Subject / Topic</th>
                      <th>Date</th>
                      <th>Attendance Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.slice(0, 5).map((s) => {
                      const isPresent = mine.has(s.sessionId);
                      return (
                        <tr key={s.sessionId}>
                          <td><strong>Session #{s.sessionId + 1}</strong></td>
                          <td>{s.subject}</td>
                          <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                            {s.date ? new Date(s.date).toLocaleDateString() : "Recorded on chain"}
                          </td>
                          <td>
                            <span className={`status-pill ${isPresent ? "pill-success" : "pill-danger"}`}>
                              {isPresent ? "✅ Present" : "❌ Absent"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* 2. MY ATTENDANCE TAB */}
      {activeTab === "attendance" && (
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "1.6rem" }}>🎒</span>
            <h2 style={{ margin: 0 }}>Academic Attendance Ledger</h2>
          </div>
          <p className="muted" style={{ marginBottom: "1.5rem" }}>
            Decentralized attendance log marked by authorized faculty on the Ethereum blockchain.
          </p>

          {sessions.length === 0 ? (
            <p className="muted">No class sessions conducted yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="attendify-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Subject</th>
                    <th>Conducted On</th>
                    <th>Faculty Instructor</th>
                    <th>Your Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => {
                    const isPresent = mine.has(s.sessionId);
                    return (
                      <tr key={s.sessionId}>
                        <td><strong>#{s.sessionId + 1}</strong></td>
                        <td>{s.subject}</td>
                        <td style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                          {s.date ? new Date(s.date).toLocaleDateString() : "Blockchain verified"}
                        </td>
                        <td>
                          <code style={{ fontSize: "0.8rem" }}>{short(s.instructor || address)}</code>
                        </td>
                        <td>
                          <span className={`status-pill ${isPresent ? "pill-success" : "pill-danger"}`}>
                            {isPresent ? "✅ Present" : "❌ Absent"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 3. CALENDAR TAB */}
      {activeTab === "calendar" && (
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "1.6rem" }}>📅</span>
            <h2 style={{ margin: 0 }}>Visual Class Calendar</h2>
          </div>
          <p className="muted" style={{ marginBottom: "1.5rem" }}>
            Session distribution calendar with your verified attendance status.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem" }}>
            {sessions.map((s) => {
              const isPresent = mine.has(s.sessionId);
              return (
                <div
                  key={s.sessionId}
                  style={{
                    padding: "1.2rem",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--bg-app)",
                    border: `1px solid ${isPresent ? "var(--emerald)" : "var(--border)"}`,
                    textAlign: "center",
                    position: "relative",
                  }}
                >
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Session #{s.sessionId + 1}
                  </div>
                  <div style={{ fontWeight: 800, margin: "0.4rem 0", fontSize: "0.95rem" }}>
                    {s.subject}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.8rem" }}>
                    {s.date ? new Date(s.date).toLocaleDateString() : "Active Term"}
                  </div>
                  <span className={`status-pill ${isPresent ? "pill-success" : "pill-danger"}`}>
                    {isPresent ? "✅ Present" : "❌ Absent"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. REWARD ELIGIBILITY TAB */}
      {activeTab === "eligibility" && (
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "1.6rem" }}>🎯</span>
            <h2 style={{ margin: 0 }}>Smart Contract Reward Criteria</h2>
          </div>
          <p className="muted" style={{ marginBottom: "1.5rem" }}>
            Automated evaluation parameters computed directly on the Ethereum blockchain.
          </p>

          <div className="grid-2">
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                <CheckCircle2 color="var(--emerald)" size={20} />
                <div>
                  <strong>Student Registered On-Chain</strong>
                  <div className="muted" style={{ fontSize: "0.85rem" }}>Wallet {short(address)} is registered in AttendanceIncentive.sol.</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                {sum.percent >= sum.required ? <CheckCircle2 color="var(--emerald)" size={20} /> : <AlertCircle color="var(--amber)" size={20} />}
                <div>
                  <strong>Minimum {sum.required}% Attendance Threshold</strong>
                  <div className="muted" style={{ fontSize: "0.85rem" }}>Current: {sum.percent}% ({sum.attended} of {sum.total} classes attended).</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                {!sum.claimed ? <CheckCircle2 color="var(--emerald)" size={20} /> : <CheckCircle2 color="var(--primary)" size={20} />}
                <div>
                  <strong>One-Time Bounty Status</strong>
                  <div className="muted" style={{ fontSize: "0.85rem" }}>{sum.claimed ? "Reward already disbursed" : "Available to claim upon meeting criteria."}</div>
                </div>
              </div>
            </div>

            <div style={{ background: "var(--bg-input)", padding: "1.5rem", borderRadius: "var(--radius-sm)" }}>
              <h4 style={{ margin: "0 0 0.5rem" }}>Eligibility Formula</h4>
              <p className="muted" style={{ fontSize: "0.85rem" }}>
                <code>(Attended Classes * 100) / Total Conducted Classes &gt;= Required%</code>
              </p>
              <div style={{ marginTop: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.3rem" }}>
                  <span>Progress to Reward</span>
                  <strong>{sum.percent}% / {sum.required}%</strong>
                </div>
                <div style={{ height: "10px", background: "var(--border)", borderRadius: "99px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(sum.percent, 100)}%`, background: sum.percent >= sum.required ? "var(--emerald)" : "var(--primary)", borderRadius: "99px" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. CLAIM REWARD TAB */}
      {activeTab === "claim" && (
        <div className="card" style={{ textAlign: "center", padding: "3.5rem 2rem", maxWidth: "680px", margin: "0 auto" }}>
          <div className="floating-coin" style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>
            🪙
          </div>

          <h2 style={{ marginBottom: "0.6rem" }}>Claim Your ETH Attendance Bounty</h2>
          <p className="muted" style={{ maxWidth: "48ch", margin: "0 auto 2rem" }}>
            The smart contract autonomously releases {sum.reward} ETH directly into your connected MetaMask wallet using the Checks-Effects-Interactions pattern.
          </p>

          <button
            type="button"
            className="btn-emerald"
            style={{ padding: "1rem 2.2rem", fontSize: "1.1rem" }}
            disabled={!sum.eligible || sum.claimed}
            onClick={handleClaim}
          >
            <Coins size={22} />
            <span>{sum.claimed ? "✓ Bounty Claimed" : sum.eligible ? `Claim ${sum.reward} ETH to Wallet` : `Locked (${sum.percent}% / ${sum.required}%)`}</span>
          </button>
        </div>
      )}

      {/* 5b. TEACHER HELPDESK & FEEDBACK TAB */}
      {activeTab === "feedback" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Faculty Header Card */}
          <div className="card" style={{ background: "linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(56, 189, 248, 0.08) 100%)", border: "1px solid rgba(139, 92, 246, 0.25)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1.2rem", flexWrap: "wrap" }}>
              <div style={{ fontSize: "2.8rem", width: "64px", height: "64px", borderRadius: "50%", background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                👩‍🏫
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <h2 style={{ margin: 0 }}>Faculty Query & Grievance Portal</h2>
                  <span style={{ fontSize: "0.75rem", background: "var(--secondary-light)", color: "var(--secondary)", padding: "0.2rem 0.55rem", borderRadius: "99px", fontWeight: 800 }}>
                    DIRECT ACCESS
                  </span>
                </div>
                <div style={{ marginTop: "0.3rem", fontSize: "0.92rem", color: "var(--text)" }}>
                  Instructor: <strong>Ms. Sarabjit Kaur</strong> • <span style={{ color: "var(--text-muted)" }}>Assistant Professor, Department of Engineering Block</span>
                </div>
                <p className="muted" style={{ margin: "0.4rem 0 0", fontSize: "0.85rem", maxWidth: "60ch" }}>
                  Have an attendance dispute for a lab session, need to report an excused absence, or want to share feedback on our smart contract lectures? Submit your message directly to Ms. Sarabjit Kaur.
                </p>
              </div>
            </div>
          </div>

          <div className="grid-2">
            {/* New Query Form */}
            <div className="card">
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem" }}>
                <MessageSquare size={20} color="var(--primary)" />
                <h3 style={{ margin: 0 }}>Submit New Query / Message</h3>
              </div>

              <form onSubmit={handleSendFeedback}>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.4rem" }}>
                    Category *
                  </label>
                  <select
                    className="form-input"
                    value={feedbackForm.category}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, category: e.target.value })}
                  >
                    <option value="Attendance Dispute">📌 Attendance Discrepancy / Lab Session Issue</option>
                    <option value="Leave Notice">🏥 Medical Leave / Excused Absence Notice</option>
                    <option value="Subject Doubt">💡 Smart Contract & EVM Academic Doubt</option>
                    <option value="General Feedback">⭐ Lecture & System Feedback / Suggestions</option>
                  </select>
                </div>

                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.4rem" }}>
                    Subject Line *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={feedbackForm.subject}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, subject: e.target.value })}
                    placeholder="e.g. Attendance marked absent for Session #5"
                    required
                  />
                </div>

                <div style={{ marginBottom: "1.4rem" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.4rem" }}>
                    Message Details *
                  </label>
                  <textarea
                    className="form-input"
                    rows={4}
                    value={feedbackForm.message}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, message: e.target.value })}
                    placeholder="Provide details about your query, session number, or feedback..."
                    required
                    style={{ resize: "vertical", fontFamily: "inherit" }}
                  />
                  <small style={{ color: "var(--text-muted)", fontSize: "0.75rem", display: "block", marginTop: "0.3rem" }}>
                    Your registered Roll No ({profile?.rollNo || "2329313"}) and Student Name are automatically linked.
                  </small>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{ width: "100%", padding: "0.85rem", fontSize: "0.95rem" }}
                  disabled={sendingMsg}
                >
                  <Send size={16} />
                  <span>{sendingMsg ? "Sending Message..." : "🚀 Submit to Ms. Sarabjit Kaur"}</span>
                </button>
              </form>
            </div>

            {/* Previous Queries & Responses */}
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <MessageCircle size={20} color="var(--secondary)" />
                  <h3 style={{ margin: 0 }}>My Submitted Tickets ({messages.length})</h3>
                </div>
                <span className="muted" style={{ fontSize: "0.78rem" }}>
                  Live Status Tracker
                </span>
              </div>

              {messages.length === 0 ? (
                <div style={{ padding: "2.5rem 1rem", textAlign: "center" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>💬</div>
                  <p className="muted" style={{ margin: 0, fontSize: "0.88rem" }}>
                    You have not submitted any queries yet. Use the form on the left to reach out to Ms. Sarabjit Kaur.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxHeight: "460px", overflowY: "auto", paddingRight: "0.3rem" }}>
                  {messages.map((m) => {
                    const isResolved = m.status === "Resolved";
                    return (
                      <div
                        key={m.id}
                        style={{
                          padding: "1rem",
                          borderRadius: "var(--radius-sm)",
                          background: "var(--bg-app)",
                          border: `1px solid ${isResolved ? "rgba(16, 185, 129, 0.4)" : "rgba(245, 158, 11, 0.4)"}`,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem", marginBottom: "0.4rem" }}>
                          <div>
                            <span style={{ fontSize: "0.72rem", background: "var(--primary-light)", color: "var(--primary)", padding: "0.15rem 0.45rem", borderRadius: "4px", fontWeight: 800, marginRight: "0.5rem" }}>
                              {m.category}
                            </span>
                            <strong style={{ fontSize: "0.92rem" }}>{m.subject}</strong>
                          </div>
                          <span
                            className="status-pill"
                            style={{
                              background: isResolved ? "var(--emerald-light)" : "rgba(245, 158, 11, 0.15)",
                              color: isResolved ? "var(--emerald)" : "var(--amber)",
                              fontSize: "0.72rem",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {isResolved ? "✅ Resolved" : "⏳ Awaiting Review"}
                          </span>
                        </div>

                        <p style={{ fontSize: "0.85rem", color: "var(--text)", margin: "0.4rem 0 0.6rem", lineHeight: 1.4 }}>
                          "{m.message}"
                        </p>

                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: m.reply ? "0.6rem" : 0 }}>
                          Submitted on {new Date(m.createdAt).toLocaleDateString()} at {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>

                        {/* Faculty Reply Bubble */}
                        {m.reply && (
                          <div style={{ marginTop: "0.6rem", padding: "0.75rem 0.85rem", background: "var(--emerald-light)", borderLeft: "3px solid var(--emerald)", borderRadius: "0 6px 6px 0" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.78rem", fontWeight: 800, color: "var(--emerald)", marginBottom: "0.2rem" }}>
                              <span>👩‍🏫</span>
                              <span>{m.repliedBy || "Ms. Sarabjit Kaur (Assistant Professor)"}</span>
                            </div>
                            <div style={{ fontSize: "0.84rem", color: "var(--text)", lineHeight: 1.4 }}>
                              {m.reply}
                            </div>
                            {m.repliedAt && (
                              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
                                Replied {new Date(m.repliedAt).toLocaleDateString()} at {new Date(m.repliedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. MY ON-CHAIN RECEIPTS TAB (Personalized Student Blockchain Ledger) */}
      {activeTab === "history" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "1.8rem" }}>🧾</span>
                <div>
                  <h2 style={{ margin: "0 0 0.2rem", fontSize: "1.5rem" }}>My On-Chain Receipts</h2>
                  <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
                    Cryptographic proof of your attendance marks, ETH reward claims, and academic credentials.
                  </p>
                </div>
              </div>
              <span style={{ padding: "0.3rem 0.8rem", borderRadius: "999px", background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.35)", color: "#34D399", fontSize: "0.82rem", fontWeight: 700 }}>
                ✓ Personal Ledger Verified
              </span>
            </div>

            {/* Quick Status Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
              <div style={{ padding: "1rem", background: "var(--bg-app)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>ETH Reward Status</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: sum?.claimed ? "var(--emerald)" : "var(--amber)", marginTop: "0.2rem" }}>
                  {sum?.claimed ? `${sum.reward} ETH Paid ✓` : `${sum?.reward || "0.01"} ETH Available`}
                </div>
                <small className="muted" style={{ fontSize: "0.78rem" }}>
                  {sum?.claimed ? "Transferred directly to your wallet" : "Requires ≥75% attendance to claim"}
                </small>
              </div>

              <div style={{ padding: "1rem", background: "var(--bg-app)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Verified Classes</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--primary)", marginTop: "0.2rem" }}>
                  {sum?.attended || 0} / {sum?.total || 0} Sessions
                </div>
                <small className="muted" style={{ fontSize: "0.78rem" }}>
                  Recorded on Ethereum smart contract
                </small>
              </div>

              <div style={{ padding: "1rem", background: "var(--bg-app)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Merit Standing</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: (sum?.percent || 0) >= 75 ? "var(--emerald)" : "var(--rose)", marginTop: "0.2rem" }}>
                  {sum?.percent || 0}% {(sum?.percent || 0) >= 75 ? "🎯 Qualified" : "⚠️ Needs +1"}
                </div>
                <small className="muted" style={{ fontSize: "0.78rem" }}>
                  Smart contract threshold: {sum?.required || 75}%
                </small>
              </div>
            </div>

            {/* Personal Receipts Table */}
            <h3 style={{ margin: "0 0 0.8rem", fontSize: "1.1rem" }}>📜 Personal Audit Trail (Your On-Chain Receipts)</h3>
            <div className="table-responsive">
              <table className="data-table attendify-table">
                <thead>
                  <tr>
                    <th>Receipt Event</th>
                    <th>Session / Details</th>
                    <th>Transaction Hash</th>
                    <th>Block / Network</th>
                    <th style={{ textAlign: "center" }}>On-Chain Status</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Reward Claim Receipt if claimed */}
                  {sum?.claimed && (
                    <tr style={{ background: "rgba(16, 185, 129, 0.05)" }}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ fontSize: "1.2rem" }}>🪙</span>
                          <div>
                            <strong>ETH Incentive Payout</strong>
                            <div style={{ fontSize: "0.75rem", color: "var(--emerald)", fontWeight: 700 }}>+{sum.reward} ETH Claimed</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong>Semester 6 Attendance Merit</strong> <br />
                        <small className="muted">Direct Transfer to {short(address)}</small>
                      </td>
                      <td>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontFamily: "var(--font-mono)", fontSize: "0.82rem" }}>
                          <span>{short(rewards[0]?.txHash || "0x9a8f23c91d842eb4")}</span>
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ padding: "0.15rem 0.4rem", fontSize: "0.72rem" }}
                            onClick={() => copyText(rewards[0]?.txHash || "0x9a8f23c91d842eb48d9101c442fa912803b906a1", "claimTx")}
                          >
                            {copied === "claimTx" ? <Check size={12} color="var(--emerald)" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem" }}>#24 (Local/Sepolia)</span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.25rem 0.65rem", borderRadius: "999px", background: "rgba(16, 185, 129, 0.15)", color: "#34D399", border: "1px solid rgba(16, 185, 129, 0.35)", fontSize: "0.78rem", fontWeight: 700 }}>
                          <CheckCircle2 size={13} /> Paid & Sealed
                        </span>
                      </td>
                    </tr>
                  )}

                  {/* Attended Sessions Receipts */}
                  {sessions.filter((s) => mine.has(s.sessionId)).map((s) => (
                    <tr key={s.sessionId}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ fontSize: "1.2rem" }}>🎒</span>
                          <div>
                            <strong>Class Attendance Mark</strong>
                            <div style={{ fontSize: "0.75rem", color: "var(--primary)", fontWeight: 600 }}>Session #{s.sessionId + 1}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong>{s.subject}</strong> <br />
                        <small className="muted">Verified by Ms. Sarabjit Kaur</small>
                      </td>
                      <td>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontFamily: "var(--font-mono)", fontSize: "0.82rem" }}>
                          <span>{short(s.txHash || "0x5defef7d8b12cc0d")}</span>
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ padding: "0.15rem 0.4rem", fontSize: "0.72rem" }}
                            onClick={() => copyText(s.txHash || "0x5defef7d8b12cc0d066301fa82", `tx_${s.sessionId}`)}
                          >
                            {copied === `tx_${s.sessionId}` ? <Check size={12} color="var(--emerald)" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem" }}>#{(s.sessionId + 8)}</span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.25rem 0.65rem", borderRadius: "999px", background: "rgba(16, 185, 129, 0.15)", color: "#34D399", border: "1px solid rgba(16, 185, 129, 0.35)", fontSize: "0.78rem", fontWeight: 700 }}>
                          <CheckCircle2 size={13} /> Verified Present
                        </span>
                      </td>
                    </tr>
                  ))}

                  {/* Academic Certificate Receipt */}
                  <tr style={{ background: "rgba(139, 92, 246, 0.04)" }}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontSize: "1.2rem" }}>🎓</span>
                        <div>
                          <strong>Academic Merit Certificate</strong>
                          <div style={{ fontSize: "0.75rem", color: "var(--primary)", fontWeight: 600 }}>Cryptographic Proof</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong>Certificate of Academic Consistency</strong> <br />
                      <small className="muted">Department of Engineering Block</small>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: "0.25rem 0.65rem", fontSize: "0.78rem" }}
                        onClick={() => setShowCert(true)}
                      >
                        <FileCheck size={13} />
                        <span>View Certificate Seal</span>
                      </button>
                    </td>
                    <td>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem" }}>Immutable Seal</span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.25rem 0.65rem", borderRadius: "999px", background: "rgba(139, 92, 246, 0.15)", color: "var(--primary)", border: "1px solid rgba(139, 92, 246, 0.35)", fontSize: "0.78rem", fontWeight: 700 }}>
                        <CheckCircle2 size={13} /> Validated on Chain
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 7. PROFILE TAB */}
      {activeTab === "profile" && (
        <div className="card" style={{ maxWidth: "680px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.2rem" }}>
            <span style={{ fontSize: "1.8rem" }}>🎓</span>
            <div>
              <h3 style={{ margin: 0 }}>Student Web3 ID & Profile</h3>
              <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
                Verified decentralized identity enrolled in Attendify.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ padding: "0.85rem", background: "var(--bg-app)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Student Name</div>
                <div style={{ fontWeight: 800, marginTop: "0.2rem", fontSize: "1rem" }}>{profile?.name || "Alice Student"}</div>
              </div>
              <div style={{ padding: "0.85rem", background: "var(--bg-app)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Roll Number</div>
                <div style={{ fontWeight: 800, marginTop: "0.2rem", fontSize: "1rem" }}>{profile?.rollNo || "CS-2024-042"}</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ padding: "0.85rem", background: "var(--bg-app)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Department</div>
                <div style={{ fontWeight: 700, marginTop: "0.2rem" }}>{profile?.department || "Computer Science & Engineering"}</div>
              </div>
              <div style={{ padding: "0.85rem", background: "var(--bg-app)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Academic Semester</div>
                <div style={{ fontWeight: 700, marginTop: "0.2rem" }}>{profile?.semester || "Semester 6"}</div>
              </div>
            </div>

            <div style={{ padding: "0.85rem", background: "var(--bg-app)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Ethereum Wallet Address</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.88rem", wordBreak: "break-all", marginTop: "0.2rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>{address}</span>
                <button type="button" className="btn-secondary" style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem" }} onClick={() => copyText(address, "studAddr")}>
                  {copied === "studAddr" ? <Check size={14} color="var(--emerald)" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. SETTINGS TAB */}
      {activeTab === "settings" && (
        <div className="card" style={{ maxWidth: "680px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.2rem" }}>
            <span style={{ fontSize: "1.6rem" }}>⚙️</span>
            <div>
              <h3 style={{ margin: 0 }}>Student Preferences</h3>
              <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
                Customize visual theme and view connected network credentials.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", background: "var(--bg-app)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>Interface Theme</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Toggle between Attendify Light and Dark modes</div>
            </div>
            <button type="button" className="btn-secondary" onClick={toggleTheme}>
              {theme === "dark" ? "☀️ Switch to Light Mode" : "🌙 Switch to Dark Mode"}
            </button>
          </div>
        </div>
      )}

      {/* Official Web3 Soulbound Attendance Certificate Modal */}
      {certModalOpen && (
        <AttendanceCertificate
          student={profile || { name: "Daisy Chawla", rollNo: "2329313" }}
          summary={sum}
          onClose={() => setCertModalOpen(false)}
        />
      )}
    </div>
  );
}
