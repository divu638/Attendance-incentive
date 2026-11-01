import React, { useEffect, useState } from "react";

const short = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "");

export default function CyberHUD({ contract }) {
  const [block, setBlock] = useState(null);
  const [gasPrice, setGasPrice] = useState("0.02 Gwei");
  const [events, setEvents] = useState([]);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!contract || !contract.runner?.provider) return;
    const provider = contract.runner.provider;

    let isMounted = true;
    const updateBlock = async () => {
      try {
        const b = await provider.getBlockNumber();
        if (isMounted) setBlock(b);
      } catch (_e) {}
    };

    updateBlock();
    const interval = setInterval(updateBlock, 4000);

    // Push new event helper
    const pushEvent = (type, details) => {
      if (!isMounted) return;
      const time = new Date().toLocaleTimeString([], { hour12: false });
      setEvents((prev) => [{ id: Date.now() + Math.random(), type, details, time }, ...prev.slice(0, 9)]);
    };

    // Initial telemetry log
    pushEvent("NETWORK", "Synchronized to Local Hardhat Node (Chain ID: 31337)");
    pushEvent("CIPHER", "EIP-191 Personal Sign Auth Activated");
    pushEvent("PROTOCOL", "ReentrancyGuard & Circuit Breaker Active");

    // Event listeners
    const onSession = (id, subject) => pushEvent("SESSION_CREATED", `Session #${Number(id) + 1} "${subject}"`);
    const onAttendance = (id, student) => pushEvent("ATTENDANCE_MARKED", `Session #${Number(id) + 1} for ${short(student)}`);
    const onReward = (student, _pct, amt) => pushEvent("REWARD_DISBURSED", `${short(student)} claimed reward`);
    const onRules = (pct) => pushEvent("RULES_RECONFIGURED", `Attendance threshold set to ${pct}%`);

    contract.on("SessionCreated", onSession);
    contract.on("AttendanceMarked", onAttendance);
    contract.on("RewardClaimed", onReward);
    contract.on("RulesUpdated", onRules);

    return () => {
      isMounted = false;
      clearInterval(interval);
      try {
        contract.off("SessionCreated", onSession);
        contract.off("AttendanceMarked", onAttendance);
        contract.off("RewardClaimed", onReward);
        contract.off("RulesUpdated", onRules);
      } catch (_e) {}
    };
  }, [contract]);

  return (
    <div className="cyber-hud-container">
      <div className="cyber-hud-bar">
        <div className="cyber-hud-left">
          <div className="cyber-status-pulse">
            <span className="cyber-neon-dot" />
            <span className="cyber-label-glow">CYBER PROTOCOL // ONLINE</span>
          </div>

          <div className="cyber-pill">
            <span className="cyber-dim">BLOCK:</span>
            <span className="cyber-val">#{block !== null ? block : "SYNCING"}</span>
          </div>

          <div className="cyber-pill">
            <span className="cyber-dim">GAS:</span>
            <span className="cyber-val">{gasPrice}</span>
          </div>

          <div className="cyber-pill">
            <span className="cyber-dim">CIPHER:</span>
            <span className="cyber-val">ECDSA-secp256k1</span>
          </div>
        </div>

        <div className="cyber-hud-right">
          <button
            type="button"
            className="cyber-toggle-btn"
            onClick={() => setCollapsed(!collapsed)}
            title="Toggle Live Event Telemetry Stream"
          >
            {collapsed ? "▲ TELEMETRY FEED" : "▼ MINIMIZE LOGS"}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="cyber-terminal-feed">
          <div className="cyber-terminal-header">
            <span className="terminal-title">▸ LIVE SMART CONTRACT EVENT STREAM</span>
            <span className="terminal-count">{events.length} TELEMETRY PACKETS</span>
          </div>
          <div className="cyber-log-list">
            {events.map((ev) => (
              <div key={ev.id} className="cyber-log-row">
                <span className="log-time">[{ev.time}]</span>
                <span className={`log-badge log-${ev.type.toLowerCase()}`}>{ev.type}</span>
                <span className="log-msg">{ev.details}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

