"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = { missionId: string };

export function CloneMissionButton({ missionId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function doClone() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/missions/${missionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clone" }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        alert(data.error ?? "Erro ao clonar missão");
        return;
      }
      router.refresh();
    } catch {
      alert("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      disabled={loading}
      onClick={doClone}
      style={{
        padding: "7px 14px",
        borderRadius: "7px",
        background: "transparent",
        border: "1px solid var(--color-border)",
        color: "var(--color-muted-foreground)",
        fontSize: "12px",
        fontWeight: 600,
        cursor: loading ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        opacity: loading ? 0.6 : 1,
      }}
    >
      {loading ? "…" : "Clonar"}
    </button>
  );
}
