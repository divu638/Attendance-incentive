import React, { useEffect, useState, useMemo } from "react";
import { Search, Filter, CheckCircle2, XCircle, Award, Users, BookOpen } from "lucide-react";
import { api } from "../api.js";

/**
 * Master Attendance Matrix (RegisterGrid)
 * Renders decentralized on-chain attendance across all students and academic sessions.
 */
export default function RegisterGrid({ refreshKey }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all"); // "all", "qualified", "at_risk"

  useEffect(() => {
    (async () => {
      try {
        const [students, sessions] = await Promise.all([api.students(), api.sessions()]);
        const cols = [...sessions].sort((a, b) => a.sessionId - b.sessionId);
        const marks = await Promise.all(cols.map((s) => api.attendance(s.sessionId)));
        const present = new Set(marks.flat().map((m) => `${m.sessionId}:${m.student.toLowerCase()}`));
        setData({ students, cols, present });
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, [refreshKey]);

  // Compute student stats and filtered list
  const studentRows = useMemo(() => {
    if (!data) return [];
    const totalCols = data.cols.length;

    return data.students.map((st) => {
      const count = data.cols.filter((s) =>
        data.present.has(`${s.sessionId}:${st.walletAddress.toLowerCase()}`)
      ).length;
      const pct = totalCols > 0 ? Math.round((count * 100) / totalCols) : 0;
      const isQualified = pct >= 75;

      return {
        ...st,
        attendedCount: count,
        percent: pct,
        isQualified,
      };
    });
  }, [data]);

  const filteredStudents = useMemo(() => {
    return studentRows.filter((st) => {
      // Filter by text
      const q = search.trim().toLowerCase();
      const matchText =
        !q ||
        (st.name && st.name.toLowerCase().includes(q)) ||
        (st.rollNo && st.rollNo.toLowerCase().includes(q)) ||
        st.walletAddress.toLowerCase().includes(q);

      if (!matchText) return false;

      // Filter by category
      if (filterType === "qualified") return st.isQualified;
      if (filterType === "at_risk") return !st.isQualified;
      return true;
    });
  }, [studentRows, search, filterType]);

  if (err) return <p className="error" style={{ padding: "1rem" }}>{err}</p>;
  if (!data) return <p className="muted" style={{ padding: "1.5rem", textAlign: "center" }}>⏳ Loading decentralized ledger matrix…</p>;
  if (!data.cols.length || !data.students.length) {
    return (
      <div style={{ padding: "2.5rem 1.5rem", textAlign: "center", background: "rgba(255,255,255,0.02)", borderRadius: "var(--radius-sm)" }}>
        <p className="muted" style={{ margin: 0 }}>
          The matrix activates once you register students and conduct at least one academic session.
        </p>
      </div>
    );
  }

  const qualifiedCount = studentRows.filter((s) => s.isQualified).length;
  const avgConsistency = Math.round(
    studentRows.reduce((acc, s) => acc + s.percent, 0) / (studentRows.length || 1)
  );

  return (
    <div className="register-matrix-wrapper" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Search & Filter Toolbar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.85rem",
          padding: "0.75rem 1rem",
          background: "rgba(255,255,255,0.03)",
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--border-glass)",
        }}
      >
        <div style={{ position: "relative", minWidth: "260px", flex: "1 1 300px" }}>
          <Search size={16} style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            type="text"
            className="form-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name or roll number..."
            style={{ paddingLeft: "2.4rem", paddingRight: "1rem", height: "38px", fontSize: "0.88rem", width: "100%" }}
          />
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            className={`btn-secondary ${filterType === "all" ? "active" : ""}`}
            style={{
              padding: "0.45rem 0.9rem",
              fontSize: "0.82rem",
              background: filterType === "all" ? "var(--primary)" : "rgba(255,255,255,0.05)",
              color: filterType === "all" ? "#fff" : "var(--text-secondary)",
              borderColor: filterType === "all" ? "var(--primary)" : "var(--border-glass)",
            }}
            onClick={() => setFilterType("all")}
          >
            All Students ({studentRows.length})
          </button>
          <button
            type="button"
            className={`btn-secondary ${filterType === "qualified" ? "active" : ""}`}
            style={{
              padding: "0.45rem 0.9rem",
              fontSize: "0.82rem",
              background: filterType === "qualified" ? "var(--emerald)" : "rgba(255,255,255,0.05)",
              color: filterType === "qualified" ? "#fff" : "var(--text-secondary)",
              borderColor: filterType === "qualified" ? "var(--emerald)" : "var(--border-glass)",
            }}
            onClick={() => setFilterType("qualified")}
          >
            🎯 Qualified ≥75% ({qualifiedCount})
          </button>
          <button
            type="button"
            className={`btn-secondary ${filterType === "at_risk" ? "active" : ""}`}
            style={{
              padding: "0.45rem 0.9rem",
              fontSize: "0.82rem",
              background: filterType === "at_risk" ? "var(--rose)" : "rgba(255,255,255,0.05)",
              color: filterType === "at_risk" ? "#fff" : "var(--text-secondary)",
              borderColor: filterType === "at_risk" ? "var(--rose)" : "var(--border-glass)",
            }}
            onClick={() => setFilterType("at_risk")}
          >
            ⚠️ At Risk &lt;75% ({studentRows.length - qualifiedCount})
          </button>
        </div>
      </div>

      {/* Responsive Matrix Table Container */}
      <div className="table-responsive" style={{ maxHeight: "560px", overflowY: "auto", border: "1px solid var(--border-glass)" }}>
        <table className="attendify-table matrix-table" style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
          <thead style={{ position: "sticky", top: 0, zIndex: 10, background: "var(--bg-card)" }}>
            <tr>
              <th style={{ minWidth: "220px", textAlign: "left", padding: "0.85rem 1.1rem" }}>
                Enrolled Scholar
              </th>
              {data.cols.map((s, idx) => (
                <th
                  key={s.sessionId}
                  style={{
                    minWidth: "62px",
                    textAlign: "center",
                    padding: "0.85rem 0.5rem",
                  }}
                  title={`Session ${idx + 1}: ${s.subject}`}
                >
                  <div
                    style={{
                      display: "inline-block",
                      padding: "0.2rem 0.55rem",
                      borderRadius: "6px",
                      background: "rgba(139, 92, 246, 0.15)",
                      border: "1px solid rgba(139, 92, 246, 0.35)",
                      color: "var(--primary)",
                      fontWeight: 700,
                      fontSize: "0.78rem",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    S{idx + 1}
                  </div>
                </th>
              ))}
              <th style={{ minWidth: "90px", textAlign: "center", padding: "0.85rem 0.75rem" }}>
                Sessions
              </th>
              <th style={{ minWidth: "130px", textAlign: "center", padding: "0.85rem 0.75rem" }}>
                Consistency
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={data.cols.length + 3} style={{ textAlign: "center", padding: "2.5rem" }}>
                  <p className="muted" style={{ margin: 0 }}>No students matched the filter "{search}".</p>
                </td>
              </tr>
            ) : (
              filteredStudents.map((st) => {
                const pct = st.percent;
                const isQual = st.isQualified;

                return (
                  <tr key={st.walletAddress} style={{ transition: "background 0.15s ease" }}>
                    {/* Student Name & Roll No */}
                    <td style={{ textAlign: "left", padding: "0.85rem 1.1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            background: isQual
                              ? "linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.35) 100%)"
                              : "linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(185, 28, 28, 0.3) 100%)",
                            border: `1px solid ${isQual ? "rgba(16, 185, 129, 0.4)" : "rgba(239, 68, 68, 0.4)"}`,
                            display: "grid",
                            placeItems: "center",
                            fontSize: "0.82rem",
                            fontWeight: 800,
                            color: isQual ? "var(--emerald)" : "var(--rose)",
                            flexShrink: 0,
                          }}
                        >
                          {(st.name || "S")[0].toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <strong style={{ display: "block", fontSize: "0.92rem", color: "var(--text-primary)", whiteSpace: "nowrap" }}>
                            {st.name || "Student"}
                          </strong>
                          <span
                            className="muted"
                            style={{
                              fontSize: "0.76rem",
                              fontFamily: "var(--font-mono)",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.4rem",
                            }}
                          >
                            <span style={{ color: "var(--primary)", fontWeight: 600 }}>{st.rollNo || "2329---"}</span>
                            <span>•</span>
                            <span>{st.walletAddress.slice(0, 6)}…{st.walletAddress.slice(-4)}</span>
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Session Presence Indicators */}
                    {data.cols.map((s, idx) => {
                      const isPresent = data.present.has(`${s.sessionId}:${st.walletAddress.toLowerCase()}`);
                      return (
                        <td key={s.sessionId} style={{ textAlign: "center", padding: "0.6rem 0.5rem" }}>
                          {isPresent ? (
                            <span
                              className="matrix-pill present"
                              title={`Present in Session #${idx + 1}: ${s.subject}`}
                              style={{
                                display: "inline-grid",
                                placeItems: "center",
                                width: "28px",
                                height: "28px",
                                borderRadius: "8px",
                                background: "rgba(16, 185, 129, 0.16)",
                                border: "1px solid rgba(16, 185, 129, 0.38)",
                                color: "#34D399",
                                fontWeight: 900,
                                fontSize: "0.85rem",
                                boxShadow: "0 2px 6px rgba(16, 185, 129, 0.15)",
                              }}
                            >
                              ✓
                            </span>
                          ) : (
                            <span
                              className="matrix-pill absent"
                              title={`Absent in Session #${idx + 1}: ${s.subject}`}
                              style={{
                                display: "inline-grid",
                                placeItems: "center",
                                width: "28px",
                                height: "28px",
                                borderRadius: "8px",
                                background: "rgba(239, 68, 68, 0.08)",
                                border: "1px solid rgba(239, 68, 68, 0.22)",
                                color: "#F87171",
                                fontWeight: 800,
                                fontSize: "0.78rem",
                                opacity: 0.6,
                              }}
                            >
                              ✕
                            </span>
                          )}
                        </td>
                      );
                    })}

                    {/* Attended Count */}
                    <td style={{ textAlign: "center", padding: "0.85rem 0.75rem", fontFamily: "var(--font-mono)", fontSize: "0.9rem" }}>
                      <strong>{st.attendedCount}</strong>
                      <span className="muted" style={{ fontSize: "0.82rem" }}> / {data.cols.length}</span>
                    </td>

                    {/* Consistency Percentage & Badge */}
                    <td style={{ textAlign: "center", padding: "0.85rem 0.75rem" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.82rem",
                          fontWeight: 700,
                          padding: "0.28rem 0.65rem",
                          borderRadius: "999px",
                          background: isQual ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.12)",
                          color: isQual ? "#34D399" : "#F87171",
                          border: `1px solid ${isQual ? "rgba(16, 185, 129, 0.35)" : "rgba(239, 68, 68, 0.3)"}`,
                        }}
                      >
                        {pct}% {isQual ? "🎯" : "⚠️"}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info / Legend Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          padding: "0.75rem 1rem",
          background: "rgba(255,255,255,0.02)",
          borderRadius: "var(--radius-sm)",
          fontSize: "0.82rem",
          color: "var(--text-muted)",
          border: "1px solid var(--border-glass)",
        }}
      >
        <div style={{ display: "flex", gap: "1.2rem", alignItems: "center" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ width: "16px", height: "16px", borderRadius: "4px", background: "rgba(16, 185, 129, 0.2)", border: "1px solid #10B981", display: "inline-grid", placeItems: "center", color: "#10B981", fontSize: "0.7rem", fontWeight: 900 }}>✓</span>
            Present On-Chain
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ width: "16px", height: "16px", borderRadius: "4px", background: "rgba(239, 68, 68, 0.12)", border: "1px solid #EF4444", display: "inline-grid", placeItems: "center", color: "#EF4444", fontSize: "0.65rem", fontWeight: 800 }}>✕</span>
            Absent
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
            <span>🎯</span>
            Qualified (≥75% for ETH Reward)
          </span>
        </div>

        <div>
          Showing <strong>{filteredStudents.length}</strong> of <strong>{studentRows.length}</strong> scholars • Class Avg Consistency: <strong style={{ color: avgConsistency >= 75 ? "var(--emerald)" : "var(--amber)" }}>{avgConsistency}%</strong>
        </div>
      </div>
    </div>
  );
}
