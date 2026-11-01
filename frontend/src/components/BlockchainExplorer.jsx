import React, { useEffect, useState } from "react";
import { History, Filter, ExternalLink, ShieldCheck, CheckCircle2 } from "lucide-react";
import TxModal from "./TxModal.jsx";

const short = (a) => (a ? `${a.slice(0, 10)}…${a.slice(-8)}` : "");

export default function BlockchainExplorer({ contract }) {
  const [filter, setFilter] = useState("all");
  const [txs, setTxs] = useState([]);
  const [selectedTx, setSelectedTx] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchLogs() {
      if (!contract) return;
      try {
        setLoading(true);
        // Query real events from the smart contract
        const [sessions, marks, claims, students] = await Promise.all([
          contract.queryFilter("SessionCreated"),
          contract.queryFilter("AttendanceMarked"),
          contract.queryFilter("RewardClaimed"),
          contract.queryFilter("StudentRegistered"),
        ]);

        const list = [];

        sessions.forEach((e) => {
          list.push({
            id: e.transactionHash + "-s",
            type: "Session Creation",
            badge: "info",
            hash: e.transactionHash,
            blockNumber: e.blockNumber,
            from: e.args[2],
            details: `Session #${Number(e.args[0]) + 1}: ${e.args[1]}`,
            timestamp: Number(e.args[3]) * 1000,
            status: "Confirmed",
          });
        });

        marks.forEach((e) => {
          list.push({
            id: e.transactionHash + "-m-" + e.args[1],
            type: "Attendance",
            badge: "success",
            hash: e.transactionHash,
            blockNumber: e.blockNumber,
            from: e.args[2],
            details: `Marked student ${short(e.args[1])} present in Session #${Number(e.args[0]) + 1}`,
            timestamp: Number(e.args[3]) * 1000,
            status: "Confirmed",
          });
        });

        claims.forEach((e) => {
          list.push({
            id: e.transactionHash + "-c",
            type: "Reward Claims",
            badge: "warning",
            hash: e.transactionHash,
            blockNumber: e.blockNumber,
            from: e.args[0],
            details: `Disbursed 0.01 ETH reward to ${short(e.args[0])}`,
            timestamp: Number(e.args[3]) * 1000,
            status: "Confirmed",
          });
        });

        students.forEach((e) => {
          list.push({
            id: e.transactionHash + "-st",
            type: "Student Registration",
            badge: "primary",
            hash: e.transactionHash,
            blockNumber: e.blockNumber,
            from: e.args[1],
            details: `Enrolled student address ${short(e.args[0])}`,
            timestamp: Date.now() - 3600000,
            status: "Confirmed",
          });
        });

        list.sort((a, b) => b.timestamp - a.timestamp);

        if (isMounted) {
          setTxs(list);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) setLoading(false);
      }
    }

    fetchLogs();
    const interval = setInterval(fetchLogs, 6000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [contract]);

  const filtered = txs.filter((t) => {
    if (filter === "all") return true;
    if (filter === "attendance") return t.type === "Attendance";
    if (filter === "registration") return t.type === "Student Registration";
    if (filter === "session") return t.type === "Session Creation";
    if (filter === "claims") return t.type === "Reward Claims";
    return true;
  });

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <h2>
            <History size={22} color="var(--primary)" />
            <span>Blockchain Transaction Explorer</span>
          </h2>
          <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
            Real-time immutable ledger of smart contract state transitions and cryptographic event receipts.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {["all", "attendance", "registration", "session", "claims"].map((key) => (
            <button
              key={key}
              type="button"
              className={filter === key ? "btn-primary" : "btn-secondary"}
              style={{ fontSize: "0.78rem", padding: "0.35rem 0.75rem", textTransform: "capitalize" }}
              onClick={() => setFilter(key)}
            >
              {key === "all" ? "All Transactions" : key}
            </button>
          ))}
        </div>
      </div>

      {loading && !txs.length ? (
        <p className="muted" style={{ textAlign: "center", padding: "2rem" }}>
          Fetching cryptographic blocks from Ethereum RPC…
        </p>
      ) : filtered.length === 0 ? (
        <div style={{ padding: "2.5rem", textAlign: "center", background: "var(--bg-input)", borderRadius: "var(--radius-sm)" }}>
          <p className="muted" style={{ margin: 0 }}>
            No transactions found for filter "{filter}". Mark attendance or register students to emit events.
          </p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="attendify-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Transaction Hash</th>
                <th>Sender Wallet</th>
                <th>Block</th>
                <th>Date / Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx) => (
                <tr
                  key={tx.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelectedTx(tx)}
                  title="Click to view transaction details modal"
                >
                  <td>
                    <span
                      className={`status-pill ${
                        tx.badge === "success"
                          ? "pill-success"
                          : tx.badge === "warning"
                          ? "pill-warning"
                          : "pill-info"
                      }`}
                    >
                      {tx.type}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontFamily: "var(--font-mono)", color: "var(--primary)" }}>
                      <span>{short(tx.hash)}</span>
                      <ExternalLink size={13} />
                    </div>
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem" }}>
                    {short(tx.from)}
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)" }}>
                    #{tx.blockNumber}
                  </td>
                  <td style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    {new Date(tx.timestamp).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                  </td>
                  <td>
                    <span className="status-pill pill-success">
                      <CheckCircle2 size={12} />
                      <span>{tx.status}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedTx && <TxModal tx={selectedTx} onClose={() => setSelectedTx(null)} contractAddress={contract?.target || contract?.address} />}
    </div>
  );
}

