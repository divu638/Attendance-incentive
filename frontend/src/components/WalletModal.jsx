import React, { useState } from "react";
import { X, ShieldCheck, Zap, AlertCircle, GraduationCap, Lock, Mail, UserCheck, Copy, Check, Key } from "lucide-react";
import { DEMO_ACCOUNTS } from "../chain.js";
import AttendifyLogo from "./AttendifyLogo.jsx";

const short = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "");

export default function WalletModal({
  isOpen,
  onClose,
  loginWallet,
  loginDemo,
  loginWithCredentials,
  busy,
  error,
  handleAddNetwork,
}) {
  const [tab, setTab] = useState("student"); // "student" | "wallet" | "faculty"
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [copiedKey, setCopiedKey] = useState("");

  if (!isOpen) return null;

  const copyText = (txt, label) => {
    navigator.clipboard?.writeText(txt);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(""), 2000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "560px" }}>
        {/* Modal Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
          <AttendifyLogo size={40} />
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            style={{ width: "34px", height: "34px", padding: 0, borderRadius: "50%" }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Unified Tab Switcher */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.4rem", padding: "0.3rem", background: "var(--bg-app)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", marginBottom: "1.5rem" }}>
          <button
            type="button"
            onClick={() => setTab("student")}
            style={{
              padding: "0.55rem 0.6rem",
              fontSize: "0.82rem",
              fontWeight: 800,
              borderRadius: "6px",
              border: "none",
              background: tab === "student" ? "var(--primary)" : "transparent",
              color: tab === "student" ? "#fff" : "var(--text-muted)",
              boxShadow: tab === "student" ? "0 4px 12px var(--primary-glow)" : "none",
              cursor: "pointer",
            }}
          >
            🎓 Student Portal
          </button>

          <button
            type="button"
            onClick={() => setTab("wallet")}
            style={{
              padding: "0.55rem 0.6rem",
              fontSize: "0.82rem",
              fontWeight: 800,
              borderRadius: "6px",
              border: "none",
              background: tab === "wallet" ? "var(--primary)" : "transparent",
              color: tab === "wallet" ? "#fff" : "var(--text-muted)",
              boxShadow: tab === "wallet" ? "0 4px 12px var(--primary-glow)" : "none",
              cursor: "pointer",
            }}
          >
            🦊 MetaMask Web3
          </button>

          <button
            type="button"
            onClick={() => setTab("faculty")}
            style={{
              padding: "0.55rem 0.6rem",
              fontSize: "0.82rem",
              fontWeight: 800,
              borderRadius: "6px",
              border: "none",
              background: tab === "faculty" ? "var(--primary)" : "transparent",
              color: tab === "faculty" ? "#fff" : "var(--text-muted)",
              boxShadow: tab === "faculty" ? "0 4px 12px var(--primary-glow)" : "none",
              cursor: "pointer",
            }}
          >
            👑 Faculty / Admin
          </button>
        </div>

        {error && (
          <div style={{ padding: "0.85rem 1rem", background: "var(--accent-light)", border: "1px solid rgba(251, 113, 133, 0.4)", borderRadius: "var(--radius-sm)", color: "var(--accent)", fontSize: "0.86rem", marginBottom: "1.2rem", display: "flex", gap: "0.6rem", alignItems: "center" }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* TAB 1: UNIFIED STUDENT CREDENTIAL LOGIN */}
        {tab === "student" && (
          <div>
            <p className="muted" style={{ fontSize: "0.88rem", margin: "0 0 1.2rem" }}>
              Sign in with your <strong>Roll Number</strong> or <strong>College Email</strong> to access your blockchain attendance record & claim ETH rewards.
            </p>

            <form onSubmit={handleStudentSubmit}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.4rem" }}>
                  Student Roll Number or Email *
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    className="form-input"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. 2329313 or 2329313@college.edu"
                    required
                    style={{ paddingLeft: "1rem" }}
                  />
                </div>
                <small style={{ color: "var(--text-muted)", fontSize: "0.75rem", display: "block", marginTop: "0.3rem" }}>
                  All 38 students in CSE Semester 6 are pre-enrolled!
                </small>
              </div>

              <div style={{ marginBottom: "1.4rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.4rem" }}>
                  Password *
                </label>
                <input
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password (default: student@123 or Roll No)"
                  required
                />
                <small style={{ color: "var(--text-muted)", fontSize: "0.75rem", display: "block", marginTop: "0.3rem" }}>
                  Default password: <code>student@123</code> (or your Roll Number).
                </small>
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ width: "100%", padding: "0.95rem", fontSize: "1rem" }}
                disabled={busy}
              >
                <span>{busy ? "Signing in to Blockchain…" : "🚀 Sign In to Student Portal"}</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: METAMASK WEB3 LOGIN */}
        {tab === "wallet" && (
          <div>
            <p className="muted" style={{ fontSize: "0.88rem", margin: "0 0 1.4rem" }}>
              Connect with your browser's MetaMask extension to authenticate cryptographically via EIP-191 personal signatures.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", marginBottom: "1.5rem" }}>
              <button
                type="button"
                className="btn-primary"
                style={{ width: "100%", padding: "1rem 1.4rem", fontSize: "1.05rem" }}
                onClick={loginWallet}
                disabled={busy}
              >
                <span style={{ fontSize: "1.3rem" }}>🦊</span>
                <span>{busy ? "Signing Login Message…" : "Connect with MetaMask Wallet"}</span>
              </button>

              <button
                type="button"
                className="btn-secondary"
                style={{ width: "100%", fontSize: "0.88rem", padding: "0.65rem 1rem" }}
                onClick={handleAddNetwork}
                disabled={busy}
              >
                <span>⚡ 1-Click: Auto-Add Hardhat Local (31337) to MetaMask</span>
              </button>
            </div>

            {/* Quick Private Keys for MetaMask Import */}
            <div style={{ marginTop: "1rem", padding: "0.9rem", background: "var(--bg-app)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.82rem", fontWeight: 700, marginBottom: "0.4rem", color: "var(--text-main)" }}>
                <Key size={14} color="var(--primary)" />
                <span>Want to test in MetaMask as Divya or Teacher?</span>
              </div>
              <p className="muted" style={{ fontSize: "0.76rem", margin: "0 0 0.7rem", lineHeight: 1.4 }}>
                In MetaMask, click <strong>Account Dropdown → Add Account → Import Account</strong> and paste one of these private keys:
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.4rem 0.6rem", background: "rgba(255,255,255,0.03)", borderRadius: "4px", fontSize: "0.78rem" }}>
                  <div>
                    <strong>DIVYA (Student)</strong>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>0x90F7...b906 (80% attendance)</div>
                  </div>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ padding: "0.2rem 0.5rem", fontSize: "0.72rem" }}
                    onClick={() => copyText("0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6", "divya")}
                  >
                    {copiedKey === "divya" ? <Check size={12} color="var(--emerald)" /> : <Copy size={12} />}
                    <span style={{ marginLeft: "0.2rem" }}>{copiedKey === "divya" ? "Copied" : "Copy Key"}</span>
                  </button>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.4rem 0.6rem", background: "rgba(255,255,255,0.03)", borderRadius: "4px", fontSize: "0.78rem" }}>
                  <div>
                    <strong>Ms. Sarabjit Kaur (Teacher)</strong>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>0x7099...79C8 (Faculty)</div>
                  </div>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ padding: "0.2rem 0.5rem", fontSize: "0.72rem" }}
                    onClick={() => copyText("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", "teacher")}
                  >
                    {copiedKey === "teacher" ? <Check size={12} color="var(--emerald)" /> : <Copy size={12} />}
                    <span style={{ marginLeft: "0.2rem" }}>{copiedKey === "teacher" ? "Copied" : "Copy Key"}</span>
                  </button>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.4rem 0.6rem", background: "rgba(255,255,255,0.03)", borderRadius: "4px", fontSize: "0.78rem" }}>
                  <div>
                    <strong>University Admin</strong>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>0xf39F...2266 (Deployer & Pool Funder)</div>
                  </div>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ padding: "0.2rem 0.5rem", fontSize: "0.72rem" }}
                    onClick={() => copyText("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", "admin")}
                  >
                    {copiedKey === "admin" ? <Check size={12} color="var(--emerald)" /> : <Copy size={12} />}
                    <span style={{ marginLeft: "0.2rem" }}>{copiedKey === "admin" ? "Copied" : "Copy Key"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: FACULTY & ADMIN QUICK LOGIN */}
        {tab === "faculty" && (
          <div>
            <p className="muted" style={{ fontSize: "0.88rem", margin: "0 0 1.2rem" }}>
              Access the administrative control center or teacher roll call hub:
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.2rem", textAlign: "left" }}
                disabled={busy}
                onClick={() => loginWithCredentials("teacher", "teacher@123")}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--secondary)" }}>
                    👨‍🏫 Faculty Teacher Portal
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    Ms. Sarabjit Kaur • Assistant Professor, Dept. of Engineering Block
                  </div>
                </div>
                <span className="btn-primary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}>Login ➔</span>
              </button>

              <button
                type="button"
                className="btn-secondary"
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.2rem", textAlign: "left" }}
                disabled={busy}
                onClick={() => loginWithCredentials("admin", "admin@123")}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--primary)" }}>
                    👑 University Admin Portal
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    Smart contract owner • Fund pool & set rules
                  </div>
                </div>
                <span className="btn-primary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}>Login ➔</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
