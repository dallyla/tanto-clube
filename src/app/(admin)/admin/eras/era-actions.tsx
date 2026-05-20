"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmModal } from "./confirm-modal";

type EraStatus = "draft" | "scheduled" | "active" | "ended";

type ModalState = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  danger?: boolean;
  action?: () => Promise<void>;
};

const CLOSED: ModalState = { open: false, title: "" };

const BTN: React.CSSProperties = {
  padding: "6px 14px",
  borderRadius: "6px",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
  transition: "opacity 0.15s",
  fontFamily: "inherit",
  flexShrink: 0,
};

export function EraActions({ eraId, status, announcedAt }: { eraId: string; status: EraStatus; announcedAt?: Date | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<ModalState>(CLOSED);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  function ask(state: Omit<ModalState, "open">) {
    setModal({ ...state, open: true });
  }

  async function handleConfirm() {
    setModal(CLOSED);
    if (!modal.action) return;
    setLoading(true);
    try {
      await modal.action();
    } finally {
      setLoading(false);
    }
  }

  async function doActivate() {
    const listRes = await fetch("/api/admin/eras");
    const all = await listRes.json() as Array<{ id: string; status: string }>;
    for (const e of all) {
      if (e.status === "active" && e.id !== eraId) {
        await fetch(`/api/admin/eras/${e.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "ended" }),
        });
      }
    }
    await fetch(`/api/admin/eras/${eraId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "active" }),
    });
    router.refresh();
  }

  async function doClose() {
    await fetch(`/api/admin/eras/${eraId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ended", endsAt: new Date().toISOString() }),
    });
    router.refresh();
  }

  async function doAnnounce() {
    const res = await fetch(`/api/admin/eras/${eraId}/announce`, { method: "POST" });
    const data = await res.json() as { error?: string; winnersNotified?: number; newAwards?: number };
    if (!res.ok) { alert(data.error ?? "Erro ao anunciar"); return; }
    setSuccessMsg(`${data.newAwards ?? 0} novos prêmios criados para ${data.winnersNotified ?? 0} vencedor(es).`);
    router.refresh();
  }

  async function doDelete() {
    const res = await fetch(`/api/admin/eras/${eraId}`, { method: "DELETE" });
    const data = await res.json() as { error?: string };
    if (!res.ok) { alert(data.error ?? "Erro ao excluir"); return; }
    router.refresh();
  }

  async function clone() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/eras/${eraId}/clone`, { method: "POST" });
      const data = await res.json() as { id?: string; error?: string };
      if (!res.ok) { alert(data.error ?? "Erro ao clonar"); return; }
      if (data.id) router.push(`/admin/eras/${data.id}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <ConfirmModal
        open={modal.open}
        title={modal.title}
        description={modal.description}
        confirmLabel={modal.confirmLabel}
        danger={modal.danger}
        onConfirm={handleConfirm}
        onCancel={() => setModal(CLOSED)}
      />

      {successMsg && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
          }}
          onClick={() => setSuccessMsg(null)}
        >
          <div
            style={{
              background: "var(--color-bg-card)",
              border: "1px solid rgba(126,184,136,0.4)",
              borderRadius: "16px",
              padding: "32px 28px",
              maxWidth: "360px",
              width: "100%",
              textAlign: "center",
              boxShadow: "0 0 40px rgba(126,184,136,0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🎁</p>
            <p
              style={{
                color: "var(--color-cream)",
                fontWeight: 700,
                fontSize: "16px",
                marginBottom: "8px",
              }}
            >
              Prêmios concedidos!
            </p>
            <p style={{ color: "var(--color-muted-foreground)", fontSize: "14px", marginBottom: "24px" }}>
              {successMsg}
            </p>
            <button
              onClick={() => setSuccessMsg(null)}
              style={{
                padding: "10px 28px",
                borderRadius: "8px",
                background: "#7eb888",
                border: "none",
                color: "#fff",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        <a
          href={`/admin/eras/${eraId}`}
          style={{
            ...BTN,
            background: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border)",
            color: "var(--color-cream)",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            opacity: loading ? 0.5 : 1,
            pointerEvents: loading ? "none" : "auto",
          }}
        >
          Editar
        </a>

        <button
          onClick={clone}
          disabled={loading}
          style={{
            ...BTN,
            background: "transparent",
            border: "1px solid var(--color-border)",
            color: "var(--color-muted-foreground)",
            opacity: loading ? 0.5 : 1,
          }}
        >
          Clonar
        </button>

        {(status === "draft" || status === "scheduled") && (
          <button
            onClick={() =>
              ask({
                title: "Ativar esta era?",
                description: "A era ativa atual será encerrada automaticamente.",
                confirmLabel: "Ativar Era",
                danger: false,
                action: doActivate,
              })
            }
            disabled={loading}
            style={{
              ...BTN,
              background: "rgba(126,184,136,0.15)",
              border: "1px solid rgba(126,184,136,0.3)",
              color: "#7eb888",
              opacity: loading ? 0.5 : 1,
            }}
          >
            Ativar
          </button>
        )}

        {status === "active" && (
          <button
            onClick={() =>
              ask({
                title: "Encerrar esta era agora?",
                description: "Os fãs não poderão mais acumular pontos por esta era.",
                confirmLabel: "Encerrar Era",
                danger: true,
                action: doClose,
              })
            }
            disabled={loading}
            style={{
              ...BTN,
              background: "rgba(196,49,75,0.12)",
              border: "1px solid rgba(196,49,75,0.3)",
              color: "var(--color-cherry)",
              opacity: loading ? 0.5 : 1,
            }}
          >
            Encerrar
          </button>
        )}

        {status === "ended" && (
          <button
            onClick={() =>
              ask({
                title: announcedAt ? "Recalcular prêmios?" : "Anunciar resultado?",
                description: announcedAt
                  ? "Novos prêmios serão criados para vencedores que ainda não os receberam, com base nos pacotes configurados."
                  : "O resultado será publicado e os prêmios serão concedidos automaticamente com base nos pacotes configurados.",
                confirmLabel: announcedAt ? "Recalcular Prêmios" : "Anunciar Resultado",
                danger: false,
                action: doAnnounce,
              })
            }
            disabled={loading}
            style={{
              ...BTN,
              background: "rgba(200,164,92,0.12)",
              border: "1px solid rgba(200,164,92,0.3)",
              color: "var(--color-gold)",
              opacity: loading ? 0.5 : 1,
            }}
          >
            {announcedAt ? "Recalcular Prêmios" : "Anunciar Resultado"}
          </button>
        )}

        {status !== "active" && (
          <button
            onClick={() =>
              ask({
                title: "Excluir esta era?",
                description: "Esta ação não pode ser desfeita. Todos os dados desta era serão perdidos.",
                confirmLabel: "Excluir permanentemente",
                danger: true,
                action: doDelete,
              })
            }
            disabled={loading}
            style={{
              ...BTN,
              background: "transparent",
              border: "1px solid rgba(196,49,75,0.25)",
              color: "var(--color-cherry)",
              opacity: loading ? 0.5 : 1,
            }}
          >
            Excluir
          </button>
        )}
      </div>
    </>
  );
}
