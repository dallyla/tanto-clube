"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  displayName: string;
  isBanned: boolean;
  banReason: string | null;
};

export function UserActions({ user, onUpdate }: { user: User; onUpdate?: (id: string, isBanned: boolean, reason: string | null) => void }) {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState("");
  const router = useRouter();

  async function handleAction(action: "ban" | "unban") {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: action === "ban" ? reason : undefined }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        alert(data.error ?? "Erro ao processar");
        return;
      }
      if (onUpdate) {
        onUpdate(user.id, action === "ban", action === "ban" ? reason : null);
      } else {
        router.refresh();
      }
      setShowModal(false);
      setReason("");
    } catch {
      alert("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {user.isBanned ? (
        <button
          disabled={loading}
          onClick={() => handleAction("unban")}
          style={{
            padding: "6px 12px",
            borderRadius: "6px",
            background: "rgba(34,197,94,0.12)",
            border: "1px solid rgba(34,197,94,0.25)",
            color: "#4ade80",
            fontSize: "12px",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
            whiteSpace: "nowrap",
          }}
        >
          Desbanir
        </button>
      ) : (
        <button
          disabled={loading}
          onClick={() => setShowModal(true)}
          style={{
            padding: "6px 12px",
            borderRadius: "6px",
            background: "rgba(196,49,75,0.12)",
            border: "1px solid rgba(196,49,75,0.25)",
            color: "var(--color-cherry)",
            fontSize: "12px",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
            whiteSpace: "nowrap",
          }}
        >
          Banir
        </button>
      )}

      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div
            style={{
              background: "var(--color-bg-card)",
              border: "1px solid var(--color-border-strong)",
              borderRadius: "16px",
              padding: "28px",
              maxWidth: "400px",
              width: "100%",
            }}
          >
            <h3
              className="font-display"
              style={{
                color: "var(--color-cream)",
                fontSize: "18px",
                fontStyle: "italic",
                marginBottom: "8px",
              }}
            >
              Banir {user.displayName}?
            </h3>
            <p style={{ color: "var(--color-muted-foreground)", fontSize: "13px", marginBottom: "20px" }}>
              O usuário perderá acesso ao clube. Informe o motivo (opcional):
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Fraude de scrobbles detectada"
              rows={3}
              style={{
                width: "100%",
                background: "var(--color-bg-elevated)",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                padding: "10px 12px",
                color: "var(--color-cream)",
                fontSize: "13px",
                resize: "vertical",
                fontFamily: "inherit",
                marginBottom: "16px",
              }}
            />
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                disabled={loading}
                onClick={() => handleAction("ban")}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "8px",
                  background: "var(--color-cherry)",
                  border: "none",
                  color: "var(--color-cherry-fg)",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.6 : 1,
                }}
              >
                Confirmar banimento
              </button>
              <button
                onClick={() => { setShowModal(false); setReason(""); }}
                style={{
                  padding: "10px 16px",
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
