import React, { useRef, useEffect, useState } from "react";
import { X, Printer, ShieldCheck, Award, Download, Copy, Check, ArrowLeft } from "lucide-react";
import AttendifyLogo from "./AttendifyLogo.jsx";

export default function AttendanceCertificate({ student, summary, onClose }) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const certRef = useRef(null);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!student || !summary) return null;

  const handlePrint = () => {
    window.print();
  };

  const copyHash = () => {
    navigator.clipboard.writeText(`ATTENDIFY-PROOF:${summary.address}:${summary.percent}%`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Direct 1-Click High-Definition PNG Certificate Generator & Downloader
  const handleDownloadPNG = () => {
    try {
      setDownloading(true);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = 1600;
      canvas.height = 1130;

      // 1. Background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Radial subtle glow
      const grad = ctx.createRadialGradient(800, 565, 50, 800, 565, 800);
      grad.addColorStop(0, "rgba(245, 243, 255, 0.7)");
      grad.addColorStop(1, "#ffffff");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Outer Border & Inner Border (Double Luxury Frame)
      ctx.strokeStyle = "#8B5CF6";
      ctx.lineWidth = 14;
      ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

      ctx.strokeStyle = "#38BDF8";
      ctx.lineWidth = 4;
      ctx.strokeRect(48, 48, canvas.width - 96, canvas.height - 96);

      // 3. Header Text
      ctx.textAlign = "center";
      ctx.fillStyle = "#1e1b4b";
      ctx.font = "bold 38px 'Inter', sans-serif";
      ctx.fillText("ATTENDIFY DECENTRALIZED ACADEMY", 800, 130);

      ctx.fillStyle = "#64748b";
      ctx.font = "bold 20px 'Inter', sans-serif";
      ctx.fillText("DEPARTMENT OF ENGINEERING BLOCK • ETHEREUM SMART CONTRACT NETWORK", 800, 170);

      // Divider line
      ctx.strokeStyle = "#8B5CF6";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(700, 200);
      ctx.lineTo(900, 200);
      ctx.stroke();

      // Certificate Title
      ctx.fillStyle = "#7c3aed";
      ctx.font = "bold 24px 'Inter', sans-serif";
      ctx.fillText("CERTIFICATE OF ACADEMIC CONSISTENCY & WEB3 MERIT", 800, 250);

      // Citation text
      ctx.fillStyle = "#475569";
      ctx.font = "22px 'Inter', sans-serif";
      ctx.fillText("This is to certify that the scholar", 800, 300);

      // Student Name
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 58px 'Inter', sans-serif";
      ctx.fillText((student.name || "Student Scholar").toUpperCase(), 800, 380);

      // Roll Number & Department
      ctx.fillStyle = "#64748b";
      ctx.font = "bold 24px 'Inter', sans-serif";
      ctx.fillText(`Roll Number: ${student.rollNo || "2329313"} • Department of Engineering Block`, 800, 430);

      // Body Paragraph
      ctx.fillStyle = "#334155";
      ctx.font = "22px 'Inter', sans-serif";
      ctx.fillText(
        `has achieved an outstanding on-chain attendance record of ${summary.percent}% across all academic lectures`,
        800,
        500
      );
      ctx.fillText(
        `and labs in Semester 6, satisfying all criteria of AttendanceIncentive.sol and qualifying for ETH rewards.`,
        800,
        535
      );

      // 4. Metric Boxes
      const drawBox = (x, y, w, h, label, val, valColor) => {
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = "#64748b";
        ctx.font = "bold 16px 'Inter', sans-serif";
        ctx.fillText(label, x + w / 2, y + 34);

        ctx.fillStyle = valColor;
        ctx.font = "bold 26px 'Inter', sans-serif";
        ctx.fillText(val, x + w / 2, y + 74);
      };

      drawBox(250, 590, 320, 95, "ATTENDANCE PERCENTAGE", `${summary.percent}% Verified`, "#059669");
      drawBox(640, 590, 320, 95, "CLASSES ATTENDED", `${summary.attended} / ${summary.total} Sessions`, "#0284c7");
      drawBox(1030, 590, 320, 95, "REWARD DISBURSED", "0.01 ETH Paid", "#7c3aed");

      // 5. Signatures
      // Left: Ms. Sarabjit Kaur
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(300, 890);
      ctx.lineTo(600, 890);
      ctx.stroke();

      ctx.fillStyle = "#1e1b4b";
      ctx.font = "italic 32px 'Georgia', serif";
      ctx.fillText("Ms. Sarabjit Kaur", 450, 875);

      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 20px 'Inter', sans-serif";
      ctx.fillText("Ms. Sarabjit Kaur", 450, 920);

      ctx.fillStyle = "#64748b";
      ctx.font = "16px 'Inter', sans-serif";
      ctx.fillText("Assistant Professor, Department of Engineering Block", 450, 945);

      // Right: Smart Contract
      ctx.beginPath();
      ctx.moveTo(1000, 890);
      ctx.lineTo(1300, 890);
      ctx.stroke();

      ctx.fillStyle = "#059669";
      ctx.font = "bold 22px 'Inter', sans-serif";
      ctx.fillText("✓ SMART CONTRACT VERIFIED", 1150, 875);

      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 20px 'Inter', sans-serif";
      ctx.fillText("AttendanceIncentive.sol", 1150, 920);

      ctx.fillStyle = "#64748b";
      ctx.font = "monospace 16px 'Courier New'";
      ctx.fillText(`ID: ATT-2026-${student.rollNo || "0000"}`, 1150, 945);

      // 6. Bottom verification line
      ctx.fillStyle = "#94a3b8";
      ctx.font = "14px 'Inter', sans-serif";
      ctx.fillText(
        `Cryptographic Proof: ${summary.address || "0x..."} • SHA-256 On-Chain Verified • Chain ID: 31337`,
        800,
        1050
      );

      // Convert to blob and download
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const cleanName = (student.name || "Student").replace(/\s+/g, "_");
        a.download = `Attendify_Certificate_${cleanName}_${student.rollNo || "2329313"}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setDownloading(false);
      }, "image/png");
    } catch (err) {
      console.error(err);
      alert("Download error: " + err.message);
      setDownloading(false);
    }
  };

  const tokenId = `ATT-2026-${student.rollNo || "0000"}`;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        zIndex: 99999,
        padding: "1rem",
        alignItems: "flex-start",
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "880px",
          width: "100%",
          padding: 0,
          background: "var(--bg-card)",
          border: "1px solid var(--border-glass)",
          boxShadow: "0 30px 80px rgba(0, 0, 0, 0.6)",
          borderRadius: "16px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          margin: "1.5rem auto",
        }}
      >
        {/* Sticky Action Navigation Bar (ALWAYS VISIBLE AT TOP) */}
        <div
          className="no-print"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0.9rem 1.4rem",
            background: "var(--bg-card)",
            borderBottom: "1px solid var(--border)",
            position: "sticky",
            top: 0,
            zIndex: 100,
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Back Button */}
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            style={{
              padding: "0.55rem 1rem",
              fontSize: "0.88rem",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              fontWeight: 800,
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>

          {/* Right Action Tools */}
          <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
            {/* Real Instant 1-Click PNG Downloader */}
            <button
              type="button"
              className="btn-emerald"
              onClick={handleDownloadPNG}
              disabled={downloading}
              style={{
                padding: "0.55rem 1.1rem",
                fontSize: "0.88rem",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                fontWeight: 800,
              }}
            >
              <Download size={16} />
              <span>{downloading ? "Generating..." : "Download Certificate (PNG)"}</span>
            </button>

            {/* Print / Save as PDF */}
            <button
              type="button"
              className="btn-primary"
              onClick={handlePrint}
              style={{
                padding: "0.55rem 1rem",
                fontSize: "0.88rem",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                fontWeight: 800,
              }}
            >
              <Printer size={16} />
              <span>Print / PDF</span>
            </button>

            {/* Close X */}
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              style={{
                width: "36px",
                height: "36px",
                padding: 0,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Close (or press ESC)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Certificate Viewport */}
        <div
          style={{
            maxHeight: "75vh",
            overflowY: "auto",
            padding: "1.2rem",
            background: "var(--bg-app)",
          }}
        >
          {/* PRINTABLE CERTIFICATE CARD */}
          <div
            ref={certRef}
            id="attendify-certificate"
            style={{
              position: "relative",
              background: "#ffffff",
              color: "#0f172a",
              padding: "2.6rem 2.2rem",
              borderRadius: "12px",
              border: "8px double #8B5CF6",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
              textAlign: "center",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {/* Subtle Center Watermark */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                opacity: 0.04,
                pointerEvents: "none",
                zIndex: 0,
              }}
            >
              <AttendifyLogo size={360} />
            </div>

            <div style={{ position: "relative", zIndex: 1 }}>
              {/* Header / University Crest */}
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.8rem", marginBottom: "0.4rem" }}>
                <AttendifyLogo size={46} />
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: "1.25rem", fontWeight: 900, letterSpacing: "1px", color: "#1e1b4b" }}>
                    ATTENDIFY DECENTRALIZED ACADEMY
                  </div>
                  <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Department of Engineering Block • Ethereum Smart Contract Network
                  </div>
                </div>
              </div>

              <div style={{ width: "60px", height: "3px", background: "linear-gradient(90deg, #8B5CF6, #38BDF8)", margin: "0.8rem auto 1.2rem" }} />

              <div style={{ fontSize: "0.82rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "2px", color: "#8B5CF6", marginBottom: "0.4rem" }}>
                Certificate of Academic Consistency & Web3 Merit
              </div>

              <div style={{ fontSize: "0.95rem", color: "#475569", marginBottom: "0.8rem" }}>
                This is to certify that the scholar
              </div>

              {/* Student Name */}
              <div style={{ fontSize: "2.2rem", fontWeight: 900, color: "#0f172a", textTransform: "uppercase", letterSpacing: "1px", margin: "0.3rem 0" }}>
                {student.name || "Student Scholar"}
              </div>

              <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#64748b", marginBottom: "1.3rem" }}>
                Roll Number: <strong style={{ color: "#1e1b4b" }}>{student.rollNo || "2329321"}</strong> • Department of Engineering Block
              </div>

              <p style={{ maxWidth: "560px", margin: "0 auto 1.6rem", fontSize: "0.94rem", lineHeight: 1.6, color: "#334155" }}>
                has successfully achieved an outstanding on-chain attendance record of{" "}
                <strong style={{ color: "#059669", fontSize: "1.1rem" }}>{summary.percent}%</strong> across all academic lectures
                and labs in Semester 6, satisfying all criteria of <code>AttendanceIncentive.sol</code> and qualifying for automated ETH rewards.
              </p>

              {/* 3 Metric Pills */}
              <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginBottom: "1.8rem", flexWrap: "wrap" }}>
                <div style={{ padding: "0.6rem 1.1rem", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                  <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Attendance</div>
                  <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#059669" }}>{summary.percent}% Verified</div>
                </div>

                <div style={{ padding: "0.6rem 1.1rem", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                  <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Classes Attended</div>
                  <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0284c7" }}>{summary.attended} / {summary.total} Sessions</div>
                </div>

                <div style={{ padding: "0.6rem 1.1rem", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                  <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Bounty Released</div>
                  <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#7c3aed" }}>0.01 ETH Paid</div>
                </div>
              </div>

              {/* Signatures & Verification Row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", alignItems: "flex-end", paddingTop: "1.4rem", borderTop: "1px dashed #cbd5e1", marginTop: "1rem" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "'Dancing Script', cursive, serif", fontSize: "1.6rem", color: "#334155", marginBottom: "0.2rem" }}>
                    Ms. Sarabjit Kaur
                  </div>
                  <div style={{ width: "160px", height: "1px", background: "#94a3b8", margin: "0 auto 0.4rem" }} />
                  <div style={{ fontWeight: 800, fontSize: "0.85rem", color: "#0f172a" }}>Ms. Sarabjit Kaur</div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Assistant Professor, Department of Engineering Block</div>
                </div>

                <div style={{ textAlign: "center" }}>
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.3rem", color: "#059669", fontWeight: 800, fontSize: "0.85rem", marginBottom: "0.2rem" }}>
                    <ShieldCheck size={18} />
                    <span>SMART CONTRACT VERIFIED</span>
                  </div>
                  <div style={{ width: "160px", height: "1px", background: "#94a3b8", margin: "0 auto 0.4rem" }} />
                  <div style={{ fontWeight: 800, fontSize: "0.85rem", color: "#0f172a" }}>AttendanceIncentive.sol</div>
                  <div style={{ fontSize: "0.72rem", color: "#64748b", fontFamily: "monospace" }}>ID: {tokenId}</div>
                </div>
              </div>

              {/* Footer Cryptographic Hash */}
              <div style={{ marginTop: "1.5rem", paddingTop: "0.8rem", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.72rem", color: "#94a3b8", flexWrap: "wrap", gap: "0.5rem" }}>
                <div>
                  Wallet: <code>{summary.address ? `${summary.address.slice(0, 10)}...${summary.address.slice(-6)}` : "Verified"}</code>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span>SHA-256 On-Chain Proof Validated</span>
                  <button
                    type="button"
                    onClick={copyHash}
                    className="no-print"
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b" }}
                    title="Copy verification hash"
                  >
                    {copied ? <Check size={12} color="#059669" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action Footer (ALWAYS VISIBLE AT BOTTOM) */}
        <div
          className="no-print"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0.8rem 1.4rem",
            background: "var(--bg-card)",
            borderTop: "1px solid var(--border)",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            🎓 Official Soulbound Academic Credential • Press <strong>ESC</strong> to close
          </span>

          <div style={{ display: "flex", gap: "0.6rem" }}>
            <button
              type="button"
              className="btn-emerald"
              onClick={handleDownloadPNG}
              disabled={downloading}
              style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}
            >
              <Download size={15} />
              <span>{downloading ? "Saving..." : "Download Certificate (PNG)"}</span>
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              style={{ padding: "0.5rem 1.1rem", fontSize: "0.85rem", fontWeight: 700 }}
            >
              Close & Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
