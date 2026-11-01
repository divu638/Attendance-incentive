import React from "react";
import { X, CheckCircle2, ShieldCheck, Copy, ExternalLink } from "lucide-react";

export default function TxModal({ tx, onClose, contractAddress }) {
  if (!tx) return null;

  const copy = (val) => {
    navigator.clipboard.writeText(val);
    alert("Copied to clipboard!");
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "var(--emerald-light)", color: "var(--emerald)", display: "grid", placeItems: "center" }}>
              <CheckCircle2 size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.2rem" }}>Transaction Verified</h3>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Immutable On-Chain Receipt</span>
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn-secondary" style={{ width: "32px", height: "32px", padding: 0, borderRadius: "50%" }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Transaction Hash</span>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-input)", padding: "0.6rem 0.8rem", borderRadius: "var(--radius-sm)", marginTop: "0.3rem" }}>
              <code style={{ fontSize: "0.82rem", wordBreak: "break-all", color: "var(--primary)" }}>{tx.hash}</code>
              <button type="button" onClick={() => copy(tx.hash)} style={{ padding: "0.2rem 0.4rem", background: "transparent", border: "none" }}>
                <Copy size={14} />
              </button>
            </div>
          </div>

          <div className="grid-2" style={{ margin: 0 }}>
            <div>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Action Type</span>
              <div style={{ fontWeight: 700, marginTop: "0.25rem", color: "var(--text-main)" }}>{tx.type}</div>
            </div>
            <div>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Block Height</span>
              <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, marginTop: "0.25rem" }}>#{tx.blockNumber}</div>
            </div>
          </div>

          <div>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Event Telemetry</span>
            <div style={{ background: "var(--bg-input)", padding: "0.75rem 0.9rem", borderRadius: "var(--radius-sm)", marginTop: "0.3rem", fontSize: "0.88rem" }}>
              {tx.details}
            </div>
          </div>

          <div className="grid-2" style={{ margin: 0 }}>
            <div>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Caller (Signer)</span>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", marginTop: "0.25rem", color: "var(--text-muted)" }}>
                {tx.from}
              </div>
            </div>
            <div>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Timestamp</span>
              <div style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
                {new Date(tx.timestamp).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: "1.8rem", display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

