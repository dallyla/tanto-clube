"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DismissSuspicionButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDismiss() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "dismiss-suspicion" }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        alert(data.error ?? "Erro ao processar");
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
      onClick={handleDismiss}
      style={{
        padding: "8px 16px",
        borderRadius: "8px",
        background: "transparent",
        border: "1px solid var(--color-border)",
        color: "var(--color-muted-foreground)",
        fontSize: "13px",
        fontWeight: 600,
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.6 : 1,
        whiteSpace: "nowrap",
      }}
    >
      {loading ? "Salvando..." : "Desconsiderar suspeita"}
    </button>
  );
}
