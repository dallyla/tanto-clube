"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RankingsControls({ eraId, eraName }: { eraId: string; eraName: string }) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  async function handleEndEra() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/eras/${eraId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ended" }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        alert(data.error ?? "Erro ao encerrar era");
        return;
      }
      setShowConfirm(false);
      router.refresh();
    } catch {
      alert("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        style={{
          padding: "8px 18px",
          borderRadius: "8px",
          background: "rgba(196,49,75,0.15)",
          border: "1px solid rgba(196,49,75,0.35)",
          color: "var(--color-cherry)",
          fontSize: "13px",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Encerrar era
      </button>

      {showConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowConfirm(false); }}
        >
          <div
            style={{
              background: "var(--color-bg-card)",
              border: "1px solid var(--color-border-strong)",
              borderRadius: "16px",
              padding: "28px",
              maxWidth: "420px",
              width: "100%",
            }}
          >
            <h3
              className="font-display"
              style={{ color: "var(--color-cream)", fontSize: "20px", fontStyle: "italic", marginBottom: "12px" }}
            >
              Encerrar {eraName}?
            </h3>
            <p style={{ color: "var(--color-muted-foreground)", fontSize: "14px", marginBottom: "24px" }}>
              Esta ação irá marcar a era como encerrada. Os pontos e rankings serão preservados. Esta ação não pode ser desfeita facilmente.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                disabled={loading}
                onClick={handleEndEra}
                style={{
                  flex: 1,
                  padding: "11px",
                  borderRadius: "8px",
                  background: "var(--color-cherry)",
                  border: "none",
                  color: "var(--color-cream)",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? "Encerrando…" : "Confirmar encerramento"}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  padding: "11px 16px",
                  borderRadius: "8px",
                  background: "transparent",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-muted-foreground)",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
