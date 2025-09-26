"use client"

import * as React from "react"

export function DataGemsBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        background: "linear-gradient(135deg, oklch(0.99 0.005 90) 0%, oklch(0.97 0.01 90) 100%)",
      }}
    >
      {/* Subtle dot pattern */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, oklch(0.65 0.18 340) 1px, transparent 0)`,
          backgroundSize: "20px 20px",
        }}
      />

      {/* Gradient overlays for depth */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: "radial-gradient(ellipse at top left, oklch(0.65 0.18 340 / 0.1) 0%, transparent 50%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: "radial-gradient(ellipse at bottom right, oklch(0.6 0.15 180 / 0.1) 0%, transparent 50%)",
        }}
      />
    </div>
  )
}