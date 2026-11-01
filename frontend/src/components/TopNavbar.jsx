import React from "react";
import { Copy, Moon, Sun, Check, Bell, LogOut } from "lucide-react";

const short = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "");

export default function TopNavbar({ session, logout, notify, activeTab, theme, toggleTheme }) {
  const [copied, setCopied] = React.useState(false);

  const copyAddress = () => {
    if (session?.address) {
      navigator.clipboard.writeText(session.address);
      setCopied(true);
      notify("📋 Wallet address copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const roleConfig = {
    admin: { emoji: "👑", bg: "rgba(139, 92, 246, 0.16)", text: "#8B5CF6", border: "rgba(139, 92, 246, 0.4)" },
    teacher: { emoji: "👨‍🏫", bg: "rgba(56, 189, 248, 0.16)", text: "#0284C7", border: "rgba(56, 189, 248, 0.4)" },
    student: { emoji: "🎒", bg: "rgba(16, 185, 129, 0.16)", text: "#059669", border: "rgba(16, 185, 129, 0.4)" },
  };

  const currentRoleStyle = roleConfig[session?.role] || roleConfig.student;

  return (
    <header className="top-nav">
      <div>
        <h3 style={{ margin: 0, textTransform: "capitalize", fontSize: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>{activeTab.replace(/([A-Z])/g, " $1").trim()}</span>
        </h3>
        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>
          ⚡ Attendify Decentralized Portal • Web3 Smart Contracts
        </span>
      </div>

      <div className="nav-actions">
        <div className="badge-network">
          <span className="network-indicator" />
          <span>Localhost: 31337</span>
        </div>

        <button
          type="button"
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>

        <div
          className="wallet-badge"
          onClick={copyAddress}
          title="Click to copy full address"
        >
          <span
            style={{
              padding: "0.2rem 0.55rem",
              borderRadius: "6px",
              background: currentRoleStyle.bg,
              color: currentRoleStyle.text,
              border: `1px solid ${currentRoleStyle.border}`,
              fontSize: "0.74rem",
              fontWeight: 800,
              textTransform: "uppercase",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
            }}
          >
            <span>{currentRoleStyle.emoji}</span>
            <span>{session?.role}</span>
          </span>
          <span>{short(session?.address)}</span>
          {copied ? <Check size={14} color="var(--emerald)" /> : <Copy size={14} color="var(--text-muted)" />}
        </div>

        <button
          type="button"
          onClick={logout}
          className="btn-secondary"
          style={{ padding: "0.5rem 0.95rem", fontSize: "0.88rem" }}
          title="Sign out from Attendify"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
}
