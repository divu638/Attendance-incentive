import React from "react";

/**
 * 3D Animated Ethereum Crypto Coin Component
 * Replaces plain bag/monochrome emojis with a rich, glossy 3D gold-violet Web3 coin.
 */
export default function EthCoin({ size = 52, className = "", style = {}, animated = true }) {
  return (
    <span
      className={`eth-3d-coin-wrap ${animated ? "eth-coin-float" : ""} ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        verticalAlign: "middle",
        width: `${size}px`,
        height: `${size}px`,
        lineHeight: 1,
        position: "relative",
        userSelect: "none",
        cursor: "pointer",
        ...style,
      }}
      title="Ethereum Bounty Coin (100% On-Chain Attendance Incentive)"
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          width: "100%",
          height: "100%",
          overflow: "visible",
          filter: "drop-shadow(0 6px 14px rgba(245, 158, 11, 0.45)) drop-shadow(0 0 18px rgba(139, 92, 246, 0.35))",
          transition: "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), filter 0.4s ease",
        }}
      >
        <defs>
          {/* Metallic Gold Coin Outer Bevel */}
          <linearGradient id="ethCoinBevel" x1="15" y1="10" x2="85" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFBEB" />
            <stop offset="25%" stopColor="#FBBF24" />
            <stop offset="60%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>

          {/* Deep Metallic Coin Plate (Rich Web3 Gold & Amber) */}
          <radialGradient id="ethCoinPlate" cx="42" cy="38" r="46" fx="36" fy="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="35%" stopColor="#F59E0B" />
            <stop offset="75%" stopColor="#B45309" />
            <stop offset="100%" stopColor="#78350F" />
          </radialGradient>

          {/* Recessed Ridge Border */}
          <linearGradient id="ethCoinInnerRim" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#78350F" />
            <stop offset="50%" stopColor="#B45309" />
            <stop offset="100%" stopColor="#FDE68A" />
          </linearGradient>

          {/* Ethereum 3D Crystal Diamond Facet Gradients */}
          <linearGradient id="ethDiamondTopLeft" x1="50" y1="22" x2="32" y2="49" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="50%" stopColor="#E0E7FF" />
            <stop offset="100%" stopColor="#C7D2FE" />
          </linearGradient>

          <linearGradient id="ethDiamondTopRight" x1="50" y1="22" x2="68" y2="49" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#C7D2FE" />
            <stop offset="60%" stopColor="#818CF8" />
            <stop offset="100%" stopColor="#6366F1" />
          </linearGradient>

          <linearGradient id="ethDiamondBottomLeft" x1="32" y1="52" x2="50" y2="78" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#EDE9FE" />
            <stop offset="60%" stopColor="#A78BFA" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>

          <linearGradient id="ethDiamondBottomRight" x1="68" y1="52" x2="50" y2="78" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="60%" stopColor="#6D28D9" />
            <stop offset="100%" stopColor="#312E81" />
          </linearGradient>

          {/* Specular curved gloss reflection */}
          <linearGradient id="ethCoinGloss" x1="20" y1="15" x2="70" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.65" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Realistic Drop Shadow Base */}
        <circle cx="50" cy="52" r="44" fill="rgba(0,0,0,0.4)" />

        {/* Outer 3D Gold Rim Bevel */}
        <circle cx="50" cy="50" r="44" fill="url(#ethCoinBevel)" stroke="#FEF08A" strokeWidth="1.6" />

        {/* Milled Serrated Edge Ridges */}
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="rgba(120, 53, 15, 0.55)"
          strokeWidth="1.8"
          strokeDasharray="3.2 2.8"
        />

        {/* Recessed Inner Coin Face */}
        <circle cx="50" cy="50" r="37" fill="url(#ethCoinPlate)" stroke="url(#ethCoinInnerRim)" strokeWidth="2.2" />

        {/* Glossy Curved Glass Reflection */}
        <path d="M 22 40 A 34 34 0 0 1 78 40 A 32 24 0 0 0 22 40 Z" fill="url(#ethCoinGloss)" />

        {/* 3D Ethereum Centerpiece with Drop Shadow */}
        <g filter="drop-shadow(0 3px 6px rgba(0,0,0,0.45))">
          {/* Top Pyramid - Left Facet */}
          <polygon points="50,22 32,49 50,42" fill="url(#ethDiamondTopLeft)" />
          {/* Top Pyramid - Right Facet */}
          <polygon points="50,22 68,49 50,42" fill="url(#ethDiamondTopRight)" />

          {/* Center Mid-Ridge */}
          <polygon points="50,42 32,49 50,52" fill="#A5B4FC" />
          <polygon points="50,42 68,49 50,52" fill="#6366F1" />

          {/* Floating Lower Diamond Tip (Iconic Ethereum Separation Gap) */}
          <polygon points="50,55 32,51 50,78" fill="url(#ethDiamondBottomLeft)" />
          <polygon points="50,55 68,51 50,78" fill="url(#ethDiamondBottomRight)" />

          {/* Crisp Specular Crease */}
          <line
            x1="50"
            y1="22"
            x2="50"
            y2="78"
            stroke="rgba(255,255,255,0.75)"
            strokeWidth="0.8"
            strokeLinecap="round"
          />
        </g>

        {/* Sparkle Glint on Top-Left Edge */}
        <circle cx="28" cy="22" r="2.8" fill="#FFFFFF" opacity="0.95" />
        <line x1="28" y1="18" x2="28" y2="26" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" />
        <line x1="24" y1="22" x2="32" y2="22" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" />

        {/* Subtle Ambient Rim Glow */}
        <circle cx="72" cy="74" r="1.6" fill="#FEF08A" opacity="0.8" />
      </svg>
    </span>
  );
}

