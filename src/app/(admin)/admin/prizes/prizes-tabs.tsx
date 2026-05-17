"use client";

import { useState } from "react";

export function PrizesTabs({ prizes, packs }: { prizes: React.ReactNode; packs: React.ReactNode }) {
  const [tab, setTab] = useState<"prizes" | "packs">("prizes");

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "8px 20px",
    borderRadius: "8px",
    background: active ? "var(--color-gold)" : "transparent",
    border: active ? "none" : "1px solid var(--color-border-strong)",
    color: active ? "var(--color-bg-primary)" : "var(--color-muted-foreground)",
    fontSize: "13px",
    fontWeight: active ? 700 : 500,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.15s",
  });

  return (
    <div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "28px" }}>
        <button style={tabStyle(tab === "prizes")} onClick={() => setTab("prizes")}>🎀 Prêmios</button>
        <button style={tabStyle(tab === "packs")} onClick={() => setTab("packs")}>📦 Packs</button>
      </div>
      {tab === "prizes" ? prizes : packs}
    </div>
  );
}
