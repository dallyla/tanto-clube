"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = { missionId: string };

export function DeleteMissionButton({ missionId }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function doDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/missions/${missionId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        alert(data.error ?? "Erro ao excluir missão");
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
          Excluir?
        </span>
        <button
          disabled={loading}
          onClick={doDelete}
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
        border: "1px solid rgba(196,49,75,0.35)",
        color: "var(--color-cherry)",
        fontSize: "12px",
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      Excluir
    </button>
  );
}
