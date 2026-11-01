import React from "react";
import {
  ShieldCheck,
  Coins,
  Sparkles,
  Award,
  Users,
  CheckCircle2,
  Lock,
  ArrowRight,
  Zap,
  Cpu,
  GraduationCap,
  CalendarCheck,
  Flame,
} from "lucide-react";
import AttendifyLogo from "../components/AttendifyLogo.jsx";
import EthCoin from "../components/EthCoin.jsx";

export default function LandingPage({ openConnectModal }) {
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Landing Navbar with 3D Emblem Logo */}
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1.2rem clamp(1.5rem, 6vw, 4rem)",
          background: "var(--bg-sidebar)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <AttendifyLogo size={44} />

        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
          <button
            type="button"
            className="btn-secondary"
            style={{ background: "transparent", border: "none", cursor: "pointer", fontWeight: 700 }}
            onClick={() => scrollTo("how-it-works")}
          >
            💡 How It Works
          </button>
          <button
            type="button"
            className="btn-secondary"
            style={{ background: "transparent", border: "none", cursor: "pointer", fontWeight: 700 }}
            onClick={() => scrollTo("features")}
          >
            🚀 Features
          </button>
          <button type="button" className="btn-primary" onClick={openConnectModal}>
            <span>🦊 Connect Wallet</span>
          </button>
        </div>
      </nav>

      {/* 3D Centered Hero Section */}
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-tagline-chip">
            <span className="streak-flame">🔥</span>
            <span>Show Up. Stay Consistent. Earn Rewards.</span>
          </div>

          <h1 className="landing-title">
            Your Attendance. <br />
            Your Achievements. <br />
            <span style={{ background: "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 50%, var(--accent) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Your ETH Rewards.
            </span>
            <span className="hero-coin-container">
              <EthCoin size={58} />
            </span>
          </h1>

          <p className="landing-subtitle">
            A gamified, student-first decentralized attendance platform powered by Ethereum smart contracts.
            Eliminates proxy records, guarantees zero tampering, and autonomously distributes crypto bounties.
          </p>

          <div className="landing-hero-actions">
            <button className="btn-primary" style={{ padding: "1.1rem 2.4rem", fontSize: "1.1rem" }} onClick={openConnectModal}>
              <span>🚀 Enter Attendify Portal</span>
              <ArrowRight size={20} />
            </button>
            <button className="btn-secondary" style={{ padding: "1.1rem 2.2rem", fontSize: "1.1rem" }} onClick={() => scrollTo("how-it-works")}>
              <span>🎒 Explore Student Quests</span>
            </button>
          </div>
        </div>
      </section>

      {/* Section 1: About Attendify */}
      <section id="about" style={{ padding: "4rem clamp(1.5rem, 6vw, 4rem)", maxWidth: "1150px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <span style={{ color: "var(--primary)", fontWeight: 800, textTransform: "uppercase", fontSize: "0.85rem", letterSpacing: "0.05em" }}>
            🎓 The Future of Campus Attendance
          </span>
          <h2 style={{ fontSize: "2.4rem", margin: "0.4rem 0" }}>Rewarding Student Dedication</h2>
          <p className="muted" style={{ maxWidth: "56ch", margin: "0 auto", fontSize: "0.98rem" }}>
            Attendify bridges higher education and Web3 decentralization to eliminate attendance proxy while releasing automatic crypto rewards.
          </p>
        </div>

        <div className="grid-3">
          <div className="card">
            <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "var(--primary-light)", color: "var(--primary)", display: "grid", placeItems: "center", marginBottom: "1rem", fontSize: "1.6rem" }}>
              🔒
            </div>
            <h3>100% Tamper-Proof</h3>
            <p className="muted" style={{ fontSize: "0.9rem" }}>
              Every class roll call is minted directly into the immutable state of an Ethereum smart contract. Zero retroactive modification.
            </p>
          </div>

          <div className="card">
            <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "var(--emerald-light)", color: "var(--emerald)", display: "grid", placeItems: "center", marginBottom: "1rem", fontSize: "1.6rem" }}>
              💎
            </div>
            <h3>Automated ETH Payouts</h3>
            <p className="muted" style={{ fontSize: "0.9rem" }}>
              Hit the required attendance percentage (e.g. 75%) and the smart contract autonomously transfers ETH directly into your wallet.
            </p>
          </div>

          <div className="card">
            <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "var(--secondary-light)", color: "var(--secondary)", display: "grid", placeItems: "center", marginBottom: "1rem", fontSize: "1.6rem" }}>
              🦊
            </div>
            <h3>Zero-Password Web3 Auth</h3>
            <p className="muted" style={{ fontSize: "0.9rem" }}>
              Login seamlessly using MetaMask and EIP-191 personal cryptographic signatures. No passwords to leak or memorize.
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: How It Works */}
      <section id="how-it-works" style={{ background: "var(--bg-card)", backdropFilter: "blur(20px)", padding: "5rem clamp(1.5rem, 6vw, 4rem)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: "1150px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <span style={{ color: "var(--secondary)", fontWeight: 800, textTransform: "uppercase", fontSize: "0.85rem", letterSpacing: "0.05em" }}>
              ⚡ 4 Simple Steps
            </span>
            <h2 style={{ fontSize: "2.4rem", margin: "0.4rem 0" }}>How Attendify Works</h2>
          </div>

          <div className="grid-4">
            <div className="card" style={{ textAlign: "center", padding: "1.8rem 1.4rem" }}>
              <div style={{ width: "58px", height: "58px", borderRadius: "50%", background: "linear-gradient(135deg, var(--primary) 0%, #7C3AED 100%)", color: "#fff", display: "grid", placeItems: "center", margin: "0 auto 1.2rem", fontWeight: 900, fontSize: "1.3rem", boxShadow: "0 8px 24px var(--primary-glow)" }}>
                👑
              </div>
              <h4>1. Admin Deploys & Funds</h4>
              <p className="muted" style={{ fontSize: "0.88rem" }}>
                Admin deploys the smart contract, authorizes faculty instructors, and funds the reward pool with ETH liquidity.
              </p>
            </div>

            <div className="card" style={{ textAlign: "center", padding: "1.8rem 1.4rem" }}>
              <div style={{ width: "58px", height: "58px", borderRadius: "50%", background: "linear-gradient(135deg, var(--secondary) 0%, #0284C7 100%)", color: "#fff", display: "grid", placeItems: "center", margin: "0 auto 1.2rem", fontWeight: 900, fontSize: "1.3rem", boxShadow: "0 8px 24px var(--secondary-glow)" }}>
                👨‍🏫
              </div>
              <h4>2. Faculty Conducts Sessions</h4>
              <p className="muted" style={{ fontSize: "0.88rem" }}>
                Teachers create academic sessions and mark roll calls on-chain using batch-optimized transactions.
              </p>
            </div>

            <div className="card" style={{ textAlign: "center", padding: "1.8rem 1.4rem" }}>
              <div style={{ width: "58px", height: "58px", borderRadius: "50%", background: "linear-gradient(135deg, var(--accent) 0%, #F43F5E 100%)", color: "#fff", display: "grid", placeItems: "center", margin: "0 auto 1.2rem", fontWeight: 900, fontSize: "1.3rem", boxShadow: "0 8px 24px var(--accent-glow)" }}>
                🔥
              </div>
              <h4>3. Students Build Streaks</h4>
              <p className="muted" style={{ fontSize: "0.88rem" }}>
                Students log into their gamified dashboard to track real-time attendance percentage, streaks, and badge quests.
              </p>
            </div>

            <div className="card" style={{ textAlign: "center", padding: "1.8rem 1.4rem" }}>
              <div style={{ width: "58px", height: "58px", borderRadius: "50%", background: "linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.3) 100%)", border: "1px solid rgba(245, 158, 11, 0.4)", display: "grid", placeItems: "center", margin: "0 auto 1.2rem", boxShadow: "0 8px 24px rgba(245, 158, 11, 0.35)" }}>
                <EthCoin size={36} animated={false} />
              </div>
              <h4>4. Contract Releases Rewards</h4>
              <p className="muted" style={{ fontSize: "0.88rem" }}>
                Once students reach the 75% threshold, they click Claim and the smart contract sends ETH directly to MetaMask!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 & 4: Blockchain Tech & Student Benefits */}
      <section id="features" style={{ padding: "5rem clamp(1.5rem, 6vw, 4rem)", maxWidth: "1150px", margin: "0 auto" }}>
        <div className="grid-2" style={{ alignItems: "center" }}>
          <div>
            <span style={{ color: "var(--primary)", fontWeight: 800, textTransform: "uppercase", fontSize: "0.85rem", letterSpacing: "0.05em" }}>
              🛡️ Industrial Blockchain Infrastructure
            </span>
            <h2 style={{ fontSize: "2.3rem", margin: "0.5rem 0 1rem" }}>Battle-Tested Smart Contracts</h2>
            <p className="muted" style={{ marginBottom: "1.5rem" }}>
              Engineered with Solidity ^0.8.20 and OpenZeppelin security standards:
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                <span style={{ fontSize: "1.2rem" }}>🛡️</span>
                <span><strong>ReentrancyGuard:</strong> Eliminates recursive call exploits during automated ETH disbursement.</span>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                <span style={{ fontSize: "1.2rem" }}>⚡</span>
                <span><strong>Checks-Effects-Interactions (CEI):</strong> All internal accounting updates occur strictly before external ETH transfers.</span>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                <span style={{ fontSize: "1.2rem" }}>⏸️</span>
                <span><strong>Circuit Breaker (Pausable):</strong> Administrators can freeze operations in security emergencies.</span>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                <span style={{ fontSize: "1.2rem" }}>⛽</span>
                <span><strong>Gas-Optimized Batch Marking:</strong> Cuts network transaction costs by over 60%.</span>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: "2.6rem", background: "linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(56, 189, 248, 0.12) 100%)", border: "1px solid rgba(139, 92, 246, 0.35)" }}>
            <h3 style={{ marginBottom: "1.2rem", fontSize: "1.4rem" }}>🎒 Student Perks</h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "1.1rem" }}>
              <li style={{ display: "flex", alignItems: "center", gap: "0.9rem" }}>
                <EthCoin size={28} animated={false} />
                <span><strong>Real Crypto Incentives:</strong> Direct ETH paid into your personal wallet.</span>
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "0.9rem" }}>
                <span style={{ fontSize: "1.5rem" }}>🔥</span>
                <span><strong>Attendance Streaks & Badges:</strong> Gamified level-ups, flame counters, and NFT-ready milestones.</span>
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "0.9rem" }}>
                <span style={{ fontSize: "1.5rem" }}>🎓</span>
                <span><strong>Verifiable Academic Record:</strong> Cryptographic proof of attendance for transcripts and placements.</span>
              </li>
            </ul>

            <button
              type="button"
              className="btn-primary"
              style={{ width: "100%", marginTop: "2rem", padding: "1rem" }}
              onClick={openConnectModal}
            >
              <span>🚀 Launch Attendify App</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer with 3D Logo */}
      <footer style={{ background: "var(--bg-sidebar)", backdropFilter: "blur(20px)", padding: "3rem clamp(1.5rem, 6vw, 4rem)", borderTop: "1px solid var(--border)", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
          <AttendifyLogo size={38} />
        </div>
        <p className="muted" style={{ fontSize: "0.88rem", margin: "0 0 0.8rem" }}>
          Show Up • Stay Consistent • Earn Rewards
        </p>
        <p className="fine" style={{ fontSize: "0.8rem", color: "var(--text-dim)", margin: 0 }}>
          Academic Blockchain Final-Year B.Tech Capstone Project · Solidity ^0.8.20 · Ethereum Smart Contracts · EIP-191 MetaMask Signatures
        </p>
      </footer>
    </div>
  );
}
