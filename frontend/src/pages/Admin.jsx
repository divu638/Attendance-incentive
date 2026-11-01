import React, { useEffect, useState, useCallback } from "react";
import { formatEther, parseEther } from "ethers";
import {
  Users,
  CalendarCheck,
  Award,
  Coins,
  History,
  UserCheck,
  UserPlus,
  ShieldCheck,
  Sliders,
  DollarSign,
  FileSpreadsheet,
  AlertTriangle,
  Play,
  Pause,
  CheckCircle2,
  Copy,
  Check,
  Settings as SettingsIcon,
  Sun,
  Moon,
  ExternalLink,
} from "lucide-react";
import { isAddress, CONTRACT_ADDRESS } from "../chain.js";
import { api } from "../api.js";
import RegisterGrid from "../components/RegisterGrid.jsx";
import BlockchainExplorer from "../components/BlockchainExplorer.jsx";

const short = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "");

export default function Admin({ contract, address, sendTx, notify, activeTab, setActiveTab, theme, toggleTheme }) {
  const [info, setInfo] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [teacherWallet, setTeacherWallet] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [teacherDept, setTeacherDept] = useState("Computer Science & Engineering");
  const [authorizedTeachers, setAuthorizedTeachers] = useState([]);
  const [percent, setPercent] = useState("");
  const [reward, setReward] = useState("");
  const [fund, setFund] = useState("");
  const [copied, setCopied] = useState("");

  const load = useCallback(async () => {
    try {
      const provider = contract.runner.provider;
      const [p, r, s, bal, paused, students, disbursed] = await Promise.all([
        contract.requiredPercent(),
        contract.rewardAmount(),
        contract.totalSessions(),
        provider.getBalance(await contract.getAddress()),
        contract.paused(),
        contract.totalStudents(),
        contract.totalRewardsDisbursed(),
      ]);

      setInfo({
        percent: Number(p),
        reward: formatEther(r),
        sessions: Number(s),
        balance: formatEther(bal),
        students: Number(students),
        disbursed: formatEther(disbursed),
      });
      setIsPaused(paused);
      setPercent(String(p));
      setReward(formatEther(r));

      // Load teachers from backend if available
      try {
        const teachersList = await api.teachers();
        setAuthorizedTeachers(teachersList || []);
      } catch (e) {
        console.warn("Could not load teachers list from backend", e);
      }
    } catch (e) {
      console.error(e);
    }
  }, [contract]);

  useEffect(() => {
    load();
  }, [load]);

  const copyText = (txt, id) => {
    navigator.clipboard.writeText(txt);
    setCopied(id);
    notify("Copied to clipboard!");
    setTimeout(() => setCopied(""), 2000);
  };

  const guard = (ok, msg) => {
    if (!ok) notify(msg, "error");
    return ok;
  };

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    if (!guard(isAddress(teacherWallet), "Enter a valid Ethereum wallet address.")) return;
    if (await sendTx("Authorize faculty teacher", () => contract.addTeacher(teacherWallet))) {
      notify(`Teacher ${teacherWallet.slice(0, 8)}… authorized on blockchain!`);
      setTeacherWallet("");
      setTeacherName("");
      load();
    }
  };

  const handleSetRules = async (e) => {
    e.preventDefault();
    const p = Number(percent);
    if (!guard(Number.isInteger(p) && p > 0 && p <= 100, "Percentage must be a whole number between 1 and 100.")) return;
    if (!guard(Number(reward) >= 0 && reward !== "", "Reward must be zero or more ETH.")) return;
    if (await sendTx("Update incentive rules", () => contract.setRules(p, parseEther(reward)))) {
      notify("Incentive parameters saved on Ethereum smart contract!");
      load();
    }
  };

  const handleFund = async (e, customAmount) => {
    if (e) e.preventDefault();
    const amount = customAmount || fund;
    if (!guard(Number(amount) > 0, "Enter an ETH amount greater than zero.")) return;
    if (await sendTx(`Fund reward pool (${amount} ETH)`, () => contract.fund({ value: parseEther(String(amount)) }))) {
      notify(`Successfully deposited ${amount} ETH to reward pool!`);
      setFund("");
      load();
    }
  };

  const togglePause = async () => {
    if (isPaused) {
      if (await sendTx("Unpause contract", () => contract.unpause())) {
        notify("Smart contract resumed successfully!");
        load();
      }
    } else {
      if (await sendTx("Emergency pause contract", () => contract.pause())) {
        notify("Smart contract paused by Administrator!", "wait");
        load();
      }
    }
  };

  // Render view by activeTab
  const renderTabContent = () => {
    switch (activeTab) {
      case "teachers":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div className="card">
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "var(--primary-light)", color: "var(--primary)", display: "grid", placeItems: "center" }}>
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0 }}>Authorize Faculty Teacher</h3>
                  <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
                    Grant faculty member permissions to create class sessions and mark attendance on-chain.
                  </p>
                </div>
              </div>

              <form onSubmit={handleAddTeacher} style={{ marginTop: "1rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.3rem" }}>
                      Teacher Name (Optional Metadata)
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={teacherName}
                      onChange={(e) => setTeacherName(e.target.value)}
                      placeholder="e.g. Dr. Jane Smith"
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.3rem" }}>
                      Department
                    </label>
                    <select
                      className="form-input"
                      value={teacherDept}
                      onChange={(e) => setTeacherDept(e.target.value)}
                    >
                      <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Electronics & Communication">Electronics & Communication</option>
                      <option value="Electrical Engineering">Electrical Engineering</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: "1.2rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                    <label style={{ fontSize: "0.85rem", fontWeight: 600, margin: 0 }}>
                      Faculty Ethereum Wallet Address *
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
                        setTeacherWallet(randAddr);
                        notify("Generated new valid test faculty wallet!");
                      }}
                    >
                      🎲 Auto-Generate Test Wallet
                    </button>
                  </div>
                  <input
                    type="text"
                    className="form-input"
                    value={teacherWallet}
                    onChange={(e) => setTeacherWallet(e.target.value.trim())}
                    placeholder="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
                    required
                  />
                  <small style={{ color: "var(--text-muted)", fontSize: "0.78rem", display: "block", marginTop: "0.35rem" }}>
                    Must be a valid 42-character 0x hex address (e.g. from MetaMask).
                  </small>
                </div>

                <button type="submit" className="btn-primary" style={{ padding: "0.75rem 1.5rem" }}>
                  <UserPlus size={18} />
                  <span>Authorize Faculty on Blockchain</span>
                </button>
              </form>
            </div>

            <div className="card">
              <h3 style={{ margin: "0 0 1rem" }}>Authorized Faculty Members</h3>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Faculty Name</th>
                      <th>Department</th>
                      <th>Wallet Address</th>
                      <th>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", color: "var(--emerald)", fontWeight: 700, fontSize: "0.82rem" }}>
                          <CheckCircle2 size={14} /> Active
                        </span>
                      </td>
                      <td><strong>Ms. Sarabjit Kaur</strong> <small style={{ color: "var(--text-muted)" }}>(Assistant Professor)</small></td>
                      <td>Department of Engineering Block</td>
                      <td>
                        <code style={{ fontSize: "0.8rem" }}>0x70997970C51812dc3A010C7d01b50e0d17dc79C8</code>
                      </td>
                      <td>
                        <span style={{ padding: "0.2rem 0.5rem", borderRadius: "4px", background: "var(--secondary-light)", color: "var(--secondary)", fontSize: "0.75rem", fontWeight: 700 }}>
                          TEACHER
                        </span>
                      </td>
                    </tr>
                    {authorizedTeachers.filter(t => t.walletAddress?.toLowerCase() !== "0x70997970c51812dc3a010c7d01b50e0d17dc79c8").map((t, i) => (
                      <tr key={i}>
                        <td>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", color: "var(--emerald)", fontWeight: 700, fontSize: "0.82rem" }}>
                            <CheckCircle2 size={14} /> Active
                          </span>
                        </td>
                        <td><strong>{t.name || "Faculty Member"}</strong></td>
                        <td>{t.department || "Engineering"}</td>
                        <td>
                          <code style={{ fontSize: "0.8rem" }}>{t.walletAddress}</code>
                        </td>
                        <td>
                          <span style={{ padding: "0.2rem 0.5rem", borderRadius: "4px", background: "var(--secondary-light)", color: "var(--secondary)", fontSize: "0.75rem", fontWeight: 700 }}>
                            TEACHER
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case "rules":
        return (
          <div className="card" style={{ maxWidth: "700px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "var(--primary-light)", color: "var(--primary)", display: "grid", placeItems: "center" }}>
                <Sliders size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0 }}>Attendance Incentive Rules</h3>
                <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
                  Adjust the eligibility threshold and ETH payout for students meeting attendance criteria.
                </p>
              </div>
            </div>

            <form onSubmit={handleSetRules}>
              <div style={{ marginBottom: "1.2rem" }}>
                <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 600, marginBottom: "0.4rem" }}>
                  Required Attendance Percentage (%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  className="form-input"
                  value={percent}
                  onChange={(e) => setPercent(e.target.value)}
                  required
                />
                <small style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
                  Minimum percentage required for a student to unlock reward eligibility (currently: {info?.percent}%).
                </small>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 600, marginBottom: "0.4rem" }}>
                  Reward Payout Per Eligible Student (ETH)
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={reward}
                  onChange={(e) => setReward(e.target.value)}
                  placeholder="0.01"
                  required
                />
                <small style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
                  Amount of native ETH transferred to student wallet upon claiming (currently: {info?.reward} ETH).
                </small>
              </div>

              <div style={{ padding: "0.85rem", background: "var(--bg-app)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", marginBottom: "1.5rem", fontSize: "0.85rem" }}>
                <div style={{ fontWeight: 700, color: "var(--primary)", marginBottom: "0.2rem" }}>
                  🔒 Smart Contract Protection:
                </div>
                Changing these parameters emits an on-chain event and updates the contract state variables atomically.
              </div>

              <button type="submit" className="btn-primary" style={{ padding: "0.75rem 1.5rem" }}>
                <Sliders size={18} />
                <span>Save Rules on Ethereum Contract</span>
              </button>
            </form>
          </div>
        );

      case "funding":
        return (
          <div className="card" style={{ maxWidth: "700px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "var(--emerald-light)", color: "var(--emerald)", display: "grid", placeItems: "center" }}>
                <DollarSign size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0 }}>Fund Reward Liquidity Pool</h3>
                <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
                  Deposit ETH into the smart contract pool so eligible students can claim their incentives.
                </p>
              </div>
            </div>

            <div style={{ padding: "1.2rem", background: "var(--bg-app)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", marginBottom: "1.5rem" }}>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                Current Contract Liquidity
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--emerald)", marginTop: "0.2rem" }}>
                {info ? Number(info.balance).toFixed(4) : "0.0000"} ETH
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Contract Address: <code>{CONTRACT_ADDRESS}</code>
              </div>
            </div>

            <div style={{ marginBottom: "1.2rem" }}>
              <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                Quick Deposit Presets
              </label>
              <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                <button type="button" className="btn-secondary" onClick={() => handleFund(null, "0.1")}>
                  + 0.1 ETH
                </button>
                <button type="button" className="btn-secondary" onClick={() => handleFund(null, "0.5")}>
                  + 0.5 ETH
                </button>
                <button type="button" className="btn-secondary" onClick={() => handleFund(null, "1.0")}>
                  + 1.0 ETH
                </button>
                <button type="button" className="btn-secondary" onClick={() => handleFund(null, "2.0")}>
                  + 2.0 ETH
                </button>
              </div>
            </div>

            <form onSubmit={handleFund}>
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 600, marginBottom: "0.4rem" }}>
                  Custom Deposit Amount (ETH)
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={fund}
                  onChange={(e) => setFund(e.target.value)}
                  placeholder="e.g. 0.25"
                />
              </div>

              <button type="submit" className="btn-primary" style={{ padding: "0.75rem 1.5rem" }}>
                <DollarSign size={18} />
                <span>Deposit ETH into Reward Contract</span>
              </button>
            </form>
          </div>
        );

      case "reports":
        return (
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "var(--primary-light)", color: "var(--primary)", display: "grid", placeItems: "center" }}>
                <FileSpreadsheet size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0 }}>Master Attendance Register</h3>
                <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
                  Live decentralized ledger view: student attendance across all class sessions.
                </p>
              </div>
            </div>
            <RegisterGrid refreshKey={info?.sessions} />
          </div>
        );

      case "history":
        return (
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "var(--primary-light)", color: "var(--primary)", display: "grid", placeItems: "center" }}>
                <History size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0 }}>Blockchain Event Audit Log</h3>
                <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
                  Decentralized ledger transactions emitted by the Attendify smart contract.
                </p>
              </div>
            </div>
            <BlockchainExplorer contract={contract} />
          </div>
        );

      case "profile":
        return (
          <div className="card" style={{ maxWidth: "680px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.2rem" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "var(--primary-light)", color: "var(--primary)", display: "grid", placeItems: "center" }}>
                <UserCheck size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0 }}>Admin System Profile</h3>
                <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
                  Smart contract ownership credentials and network configurations.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ padding: "0.85rem", background: "var(--bg-app)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                  Admin Wallet (Deployer & Owner)
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.88rem", wordBreak: "break-all", marginTop: "0.2rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span>{address}</span>
                  <button type="button" className="btn-secondary" style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem" }} onClick={() => copyText(address, "adminAddr")}>
                    {copied === "adminAddr" ? <Check size={14} color="var(--emerald)" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div style={{ padding: "0.85rem", background: "var(--bg-app)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                  Smart Contract Address (AttendanceIncentive.sol)
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.88rem", wordBreak: "break-all", marginTop: "0.2rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span>{CONTRACT_ADDRESS}</span>
                  <button type="button" className="btn-secondary" style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem" }} onClick={() => copyText(CONTRACT_ADDRESS, "contractAddr")}>
                    {copied === "contractAddr" ? <Check size={14} color="var(--emerald)" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div style={{ padding: "0.85rem", background: "var(--bg-app)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Network Name</div>
                  <div style={{ fontWeight: 700, marginTop: "0.2rem" }}>Hardhat Local Node</div>
                </div>
                <div style={{ padding: "0.85rem", background: "var(--bg-app)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Chain ID</div>
                  <div style={{ fontWeight: 700, marginTop: "0.2rem" }}>31337</div>
                </div>
              </div>

              <div style={{ padding: "0.85rem", background: "var(--bg-app)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Security Protocol</div>
                <div style={{ fontSize: "0.85rem", marginTop: "0.2rem", color: "var(--emerald)", fontWeight: 600 }}>
                  ✓ OpenZeppelin ReentrancyGuard + Pausable Circuit Breaker
                </div>
              </div>
            </div>
          </div>
        );

      case "settings":
        return (
          <div className="card" style={{ maxWidth: "680px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.2rem" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "var(--primary-light)", color: "var(--primary)", display: "grid", placeItems: "center" }}>
                <SettingsIcon size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0 }}>System Settings</h3>
                <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
                  Adjust interface preferences, emergency controls, and network parameters.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", background: "var(--bg-app)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>Color Theme</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Toggle between Attendify Light and Dark modes</div>
                </div>
                <button type="button" className="btn-secondary" onClick={toggleTheme}>
                  {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                  <span>{theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}</span>
                </button>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", background: isPaused ? "rgba(244, 63, 94, 0.08)" : "var(--bg-app)", borderRadius: "var(--radius-sm)", border: `1px solid ${isPaused ? "var(--accent)" : "var(--border)"}` }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem", color: isPaused ? "var(--accent)" : "inherit" }}>
                    Emergency Circuit Breaker ({isPaused ? "PAUSED" : "ACTIVE"})
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    Pauses all state-modifying functions (attendance marking, reward claims) in case of security emergency.
                  </div>
                </div>
                <button
                  type="button"
                  className={isPaused ? "btn-primary" : "btn-secondary"}
                  style={{ background: isPaused ? "var(--emerald)" : "var(--accent-light)", color: isPaused ? "#fff" : "var(--accent)", borderColor: "var(--accent)" }}
                  onClick={togglePause}
                >
                  {isPaused ? <Play size={16} /> : <Pause size={16} />}
                  <span>{isPaused ? "Resume Contract" : "Pause Contract"}</span>
                </button>
              </div>
            </div>
          </div>
        );

      case "overview":
      default:
        return (
          <>
            {/* Circuit Breaker Status Banner */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.9rem 1.4rem", borderRadius: "var(--radius-md)", background: isPaused ? "var(--accent-light)" : "var(--emerald-light)", border: `1px solid ${isPaused ? "rgba(251, 113, 133, 0.4)" : "rgba(16, 185, 129, 0.4)"}`, marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span className="network-indicator" style={{ background: isPaused ? "var(--accent)" : "var(--emerald)" }} />
                <div>
                  <strong style={{ color: isPaused ? "var(--accent)" : "var(--emerald)", fontSize: "0.92rem" }}>
                    Smart Contract Circuit Breaker: {isPaused ? "EMERGENCY PAUSED" : "NORMAL OPERATION"}
                  </strong>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    {isPaused
                      ? "Attendance registration and student reward payouts are temporarily halted."
                      : "All Ethereum smart contract functions are live and executing normally."}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: "0.82rem", padding: "0.4rem 0.85rem" }}
                onClick={togglePause}
              >
                {isPaused ? <Play size={15} /> : <Pause size={15} />}
                <span>{isPaused ? "Resume Contract" : "Emergency Pause"}</span>
              </button>
            </div>

            {/* Admin Stats Grid */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-label">Students Enrolled</span>
                  <div className="stat-icon-wrapper" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                    🎒
                  </div>
                </div>
                <div className="stat-value">{info?.students ?? 0}</div>
                <span className="stat-sub">Registered on blockchain</span>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-label">Academic Sessions</span>
                  <div className="stat-icon-wrapper" style={{ background: "var(--secondary-light)", color: "var(--secondary)" }}>
                    ⏱️
                  </div>
                </div>
                <div className="stat-value">{info?.sessions ?? 0}</div>
                <span className="stat-sub">Recorded to date</span>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-label">Required Threshold</span>
                  <div className="stat-icon-wrapper" style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                    🎯
                  </div>
                </div>
                <div className="stat-value">{info?.percent ?? 75}%</div>
                <span className="stat-sub">For reward qualification</span>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-label">Reward Pool Balance</span>
                  <div className="stat-icon-wrapper" style={{ background: "var(--emerald-light)", color: "var(--emerald)" }}>
                    💎
                  </div>
                </div>
                <div className="stat-value">{info ? Number(info.balance).toFixed(3) : "0.000"} ETH</div>
                <span className="stat-sub">Available reward liquidity</span>
              </div>
            </div>

            {/* Quick Action Panels */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
              {/* Quick Authorize Faculty */}
              <div className="card">
                <h3 style={{ margin: "0 0 0.4rem", fontSize: "1.05rem" }}>👨‍🏫 Quick Authorize Faculty</h3>
                <p className="muted" style={{ margin: "0 0 1rem", fontSize: "0.82rem" }}>
                  Grant teacher permissions to create sessions and mark attendance.
                </p>
                <form onSubmit={handleAddTeacher}>
                  <input
                    type="text"
                    className="form-input"
                    value={teacherWallet}
                    onChange={(e) => setTeacherWallet(e.target.value.trim())}
                    placeholder="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
                    style={{ marginBottom: "0.75rem" }}
                  />
                  <button type="submit" className="btn-primary" style={{ width: "100%" }}>
                    <UserPlus size={16} />
                    <span>Authorize Faculty Teacher</span>
                  </button>
                </form>
              </div>

              {/* Quick Fund Pool */}
              <div className="card">
                <h3 style={{ margin: "0 0 0.4rem", fontSize: "1.05rem" }}>🪙 Quick Fund Pool</h3>
                <p className="muted" style={{ margin: "0 0 1rem", fontSize: "0.82rem" }}>
                  Deposit test ETH to ensure students can claim rewards upon reaching {info?.percent}%.
                </p>
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => handleFund(null, "0.1")}>
                    +0.1 ETH
                  </button>
                  <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => handleFund(null, "0.5")}>
                    +0.5 ETH
                  </button>
                  <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => handleFund(null, "1.0")}>
                    +1.0 ETH
                  </button>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="text"
                    className="form-input"
                    value={fund}
                    onChange={(e) => setFund(e.target.value)}
                    placeholder="Custom ETH"
                    style={{ flex: 1 }}
                  />
                  <button type="button" className="btn-primary" onClick={handleFund}>
                    Deposit
                  </button>
                </div>
              </div>
            </div>

            {/* Register Preview */}
            <div className="card">
              <h3 style={{ margin: "0 0 0.4rem" }}>📊 Master Attendance Register</h3>
              <p className="muted" style={{ margin: "0 0 1rem", fontSize: "0.85rem" }}>
                Decentralized attendance ledger records for all enrolled students across sessions.
              </p>
              <RegisterGrid refreshKey={info?.sessions} />
            </div>
          </>
        );
    }
  };

  return <div>{renderTabContent()}</div>;
}
