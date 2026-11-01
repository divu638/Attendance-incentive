import React from "react";

export default function AttendifyLogo({ size = 42, showText = true, textStyle = {} }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", textDecoration: "none", cursor: "pointer" }}>
      {/* 3D Faceted Crystal Shield SVG Emblem */}
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          position: "relative",
          flexShrink: 0,
          filter: "drop-shadow(0 6px 16px rgba(139, 92, 246, 0.45))",
          transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        className="attendify-3d-logo"
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: "100%", height: "100%", overflow: "visible" }}
        >
          <defs>
            {/* 3D Gradients */}
            <linearGradient id="facetTopLeft" x1="50" y1="6" x2="16" y2="34" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#C4B5FD" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>

            <linearGradient id="facetTopRight" x1="50" y1="6" x2="84" y2="34" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#93C5FD" />
              <stop offset="100%" stopColor="#38BDF8" />
            </linearGradient>

            <linearGradient id="facetBottomLeft" x1="16" y1="34" x2="50" y2="94" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#4C1D95" />
            </linearGradient>

            <linearGradient id="facetBottomRight" x1="84" y1="34" x2="50" y2="94" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#1E3A8A" />
            </linearGradient>

            <linearGradient id="innerDiamondTop" x1="50" y1="20" x2="50" y2="52" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="50%" stopColor="#E0E7FF" />
              <stop offset="100%" stopColor="#C7D2FE" />
            </linearGradient>

            <linearGradient id="innerDiamondBottom" x1="50" y1="52" x2="50" y2="78" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#A5B4FC" />
              <stop offset="100%" stopColor="#6366F1" />
            </linearGradient>

            <linearGradient id="pulseGlow" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FB7185" />
              <stop offset="50%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#38BDF8" />
            </linearGradient>

            <filter id="neonBlur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Outer Neon Glow Ring */}
          <polygon
            points="50,6 84,34 50,94 16,34"
            fill="none"
            stroke="url(#pulseGlow)"
            strokeWidth="3"
            strokeLinejoin="round"
            filter="url(#neonBlur)"
            opacity="0.6"
          />

          {/* 3D Facet Left Top */}
          <polygon points="50,10 18,36 50,52" fill="url(#facetTopLeft)" />

          {/* 3D Facet Right Top */}
          <polygon points="50,10 82,36 50,52" fill="url(#facetTopRight)" />

          {/* 3D Facet Left Bottom */}
          <polygon points="50,52 18,36 50,90" fill="url(#facetBottomLeft)" />

          {/* 3D Facet Right Bottom */}
          <polygon points="50,52 82,36 50,90" fill="url(#facetBottomRight)" />

          {/* Center Specular Seam Lines for 3D depth */}
          <line x1="50" y1="10" x2="50" y2="90" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="1.5" />
          <line x1="18" y1="36" x2="82" y2="36" stroke="rgba(255, 255, 255, 0.35)" strokeWidth="1" />

          {/* Floating Ethereum Crystal Centerpiece */}
          <polygon points="50,22 66,48 50,58 34,48" fill="url(#innerDiamondTop)" />
          <polygon points="50,61 66,51 50,78 34,51" fill="url(#innerDiamondBottom)" />

          {/* Center Highlight Sparkle */}
          <circle cx="50" cy="50" r="3" fill="#FFFFFF" filter="drop-shadow(0 0 6px #FFFFFF)" />

          {/* Animated Orbiting Web3 Node */}
          <circle cx="82" cy="36" r="3.5" fill="#38BDF8" filter="drop-shadow(0 0 5px #38BDF8)" />
          <circle cx="18" cy="36" r="3.5" fill="#FB7185" filter="drop-shadow(0 0 5px #FB7185)" />
        </svg>
      </div>

      {showText && (
        <div style={{ display: "flex", flexDirection: "column", ...textStyle }}>
          <span
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 900,
              fontSize: "1.45rem",
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              background: "linear-gradient(135deg, #A78BFA 0%, #38BDF8 60%, #FB7185 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 2px 8px rgba(139, 92, 246, 0.3))",
            }}
          >
            ATTENDIFY
          </span>
          <span
            style={{
              fontSize: "0.68rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              marginTop: "2px",
            }}
          >
            Web3 Attendance Protocol
          </span>
        </div>
      )}
    </div>
  );
}

