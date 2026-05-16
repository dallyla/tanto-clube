"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = { missionId: string; missionTitle: string };

export function EncerrarButton({ missionId, missionTitle }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function doClose() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/missions/${missionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "close" }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        alert(data.error ?? "Erro ao encerrar missão");
        return;
      }
      router.refresh();
    } catch {
      alert("Erro de conexão");
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
        <span style={{ fontSize: "11px", color: "var(--color-muted-foreground)" }}>
          Encerrar?
        </span>
        <button
          disabled={loading}
          onClick={doClose}
          style={{
            padding: "5px 10px",
            borderRadius: "6px",
            background: "var(--color-cherry)",
            border: "none",
            color: "#fff",
            fontSize: "11px",
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "…" : "Sim"}
        </button>
        <button
          disabled={loading}
          onClick={() => setConfirming(false)}
          style={{
            padding: "5px 10px",
            borderRadius: "6px",
            background: "transparent",
            border: "1px solid var(--color-border)",
            color: "var(--color-muted-foreground)",
            fontSize: "11px",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Não
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      style={{
        padding: "7px 14px",
        borderRadius: "7px",
        background: "transparent",
        border: "1px solid var(--color-border)",
        color: "var(--color-muted-foreground)",
        fontSize: "12px",
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      Encerrar
    </button>
  );
}
