"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmModal } from "./confirm-modal";

type EraFormData = {
  name: string;
  slug: string;
  emoji: string;
  tagline: string;
  startsAt: string;
  endsAt: string;
  status: "draft" | "scheduled";
  focusAlbum: string;
  focusTracks: string;
  baseMultiplier: string;
  focusAlbumMultiplier: string;
  focusTrackMultiplier: string;
};

type Props = {
  mode: "new" | "edit";
  eraId?: string;
  currentStatus?: "draft" | "scheduled" | "active" | "ended";
  initial?: Partial<EraFormData>;
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const FIELD_STYLE: React.CSSProperties = {
  width: "100%",
  background: "var(--color-bg-elevated)",
  border: "1px solid var(--color-border)",
  borderRadius: "8px",
  padding: "10px 14px",
  color: "var(--color-cream)",
  fontSize: "14px",
  fontFamily: "inherit",
};

const LABEL_STYLE: React.CSSProperties = {
  display: "block",
  color: "var(--color-muted-foreground)",
  fontSize: "12px",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  marginBottom: "6px",
  fontWeight: 600,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={LABEL_STYLE}>{label}</label>
      {children}
    </div>
  );
}

type ModalState = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  danger?: boolean;
  action?: () => Promise<void>;
};

const CLOSED: ModalState = { open: false, title: "" };

export function EraForm({ mode, eraId, currentStatus, initial }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(CLOSED);

  function ask(state: Omit<ModalState, "open">) {
    setModal({ ...state, open: true });
  }

  async function handleModalConfirm() {
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
    setError(null);
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
    const res = await fetch(`/api/admin/eras/${eraId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "active" }),
    });
    if (!res.ok) {
      const data = await res.json() as { error?: string };
      setError(data.error ?? "Erro ao ativar");
      return;
    }
    router.push("/admin/eras");
    router.refresh();
  }

  async function doDelete() {
    setError(null);
    const res = await fetch(`/api/admin/eras/${eraId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json() as { error?: string };
      setError(data.error ?? "Erro ao excluir");
      return;
    }
    router.push("/admin/eras");
    router.refresh();
  }

  const [form, setForm] = useState<EraFormData>({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    emoji: initial?.emoji ?? "🎵",
    tagline: initial?.tagline ?? "",
    startsAt: initial?.startsAt ?? "",
    endsAt: initial?.endsAt ?? "",
    status: initial?.status ?? "draft",
    focusAlbum: initial?.focusAlbum ?? "",
    focusTracks: initial?.focusTracks ?? "",
    baseMultiplier: initial?.baseMultiplier ?? "1",
    focusAlbumMultiplier: initial?.focusAlbumMultiplier ?? "2",
    focusTrackMultiplier: initial?.focusTrackMultiplier ?? "3",
  });

  function set(key: keyof EraFormData, value: string) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "name" && mode === "new") {
        next.slug = slugify(value);
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload = {
      name: form.name,
      slug: form.slug,
      emoji: form.emoji,
      tagline: form.tagline || null,
      startsAt: form.startsAt,
      endsAt: form.endsAt,
      status: form.status,
      focusAlbum: form.focusAlbum || null,
      focusTracks: form.focusTracks
        ? form.focusTracks.split("\n").map((t) => t.trim()).filter(Boolean)
        : [],
      baseMultiplier: form.baseMultiplier,
      focusAlbumMultiplier: form.focusAlbumMultiplier,
      focusTrackMultiplier: form.focusTrackMultiplier,
    };

    try {
      const url = mode === "new" ? "/api/admin/eras" : `/api/admin/eras/${eraId}`;
      const method = mode === "new" ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Erro ao salvar");
        return;
      }
      router.push("/admin/eras");
      router.refresh();
    } catch {
      setError("Erro de conexão");
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
      onConfirm={handleModalConfirm}
      onCancel={() => setModal(CLOSED)}
    />
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {error && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            background: "rgba(196,49,75,0.12)",
            border: "1px solid rgba(196,49,75,0.3)",
            color: "var(--color-cherry)",
            fontSize: "13px",
          }}
        >
          {error}
        </div>
      )}

      {/* Row: name + emoji */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: "16px" }}>
        <Field label="Nome da era *">
          <input
            required
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Ex: Noite no Camarim"
            style={FIELD_STYLE}
          />
        </Field>
        <Field label="Emoji *">
          <input
            required
            type="text"
            value={form.emoji}
            onChange={(e) => set("emoji", e.target.value)}
            placeholder="🎵"
            style={FIELD_STYLE}
          />
        </Field>
      </div>

      {/* Slug */}
      <Field label="Slug (URL) *">
        <input
          required
          type="text"
          value={form.slug}
          onChange={(e) => set("slug", e.target.value)}
          placeholder="noite-no-camarim"
          style={FIELD_STYLE}
        />
      </Field>

      {/* Tagline */}
      <Field label="Tagline">
        <input
          type="text"
          value={form.tagline}
          onChange={(e) => set("tagline", e.target.value)}
          placeholder="Frase curta da era (opcional)"
          style={FIELD_STYLE}
        />
      </Field>

      {/* Dates */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <Field label="Início *">
          <input
            required
            type="datetime-local"
            value={form.startsAt}
            onChange={(e) => set("startsAt", e.target.value)}
            style={{ ...FIELD_STYLE, colorScheme: "dark" }}
          />
        </Field>
        <Field label="Encerramento *">
          <input
            required
            type="datetime-local"
            value={form.endsAt}
            onChange={(e) => set("endsAt", e.target.value)}
            style={{ ...FIELD_STYLE, colorScheme: "dark" }}
          />
        </Field>
      </div>

      {/* Status */}
      <Field label="Status *">
        <select
          value={form.status}
          onChange={(e) => set("status", e.target.value as "draft" | "scheduled")}
          style={{ ...FIELD_STYLE, cursor: "pointer" }}
        >
          <option value="draft">Rascunho</option>
          <option value="scheduled">Agendada</option>
        </select>
      </Field>

      {/* Focus album */}
      <div style={{ borderTop: "1px dashed var(--color-border)", paddingTop: "20px" }}>
        <p
          className="font-display"
          style={{
            color: "var(--color-gold)",
            fontSize: "11px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            fontStyle: "italic",
            marginBottom: "16px",
          }}
        >
          Last.fm — Matchmaking
        </p>

        <Field label="Álbum foco (nome exato no Last.fm)">
          <input
            type="text"
            value={form.focusAlbum}
            onChange={(e) => set("focusAlbum", e.target.value)}
            placeholder="Ex: Noite no Camarim"
            style={FIELD_STYLE}
          />
        </Field>
      </div>

      <Field label="Faixas foco (uma por linha)">
        <textarea
          value={form.focusTracks}
          onChange={(e) => set("focusTracks", e.target.value)}
          placeholder={"Faixa 1\nFaixa 2\nFaixa 3"}
          rows={4}
          style={{ ...FIELD_STYLE, resize: "vertical" }}
        />
      </Field>

      {/* Multipliers */}
      <div style={{ borderTop: "1px dashed var(--color-border)", paddingTop: "20px" }}>
        <p
          className="font-display"
          style={{
            color: "var(--color-gold)",
            fontSize: "11px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            fontStyle: "italic",
            marginBottom: "16px",
          }}
        >
          Multiplicadores de pontos
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          <Field label="Base">
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.baseMultiplier}
              onChange={(e) => set("baseMultiplier", e.target.value)}
              style={FIELD_STYLE}
            />
          </Field>
          <Field label="Álbum foco">
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.focusAlbumMultiplier}
              onChange={(e) => set("focusAlbumMultiplier", e.target.value)}
              style={FIELD_STYLE}
            />
          </Field>
          <Field label="Faixa foco">
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.focusTrackMultiplier}
              onChange={(e) => set("focusTrackMultiplier", e.target.value)}
              style={FIELD_STYLE}
            />
          </Field>
        </div>
      </div>

      {/* Submit row */}
      <div style={{ display: "flex", gap: "10px", paddingTop: "8px", flexWrap: "wrap", alignItems: "center" }}>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "11px 24px",
            borderRadius: "8px",
            background: "var(--color-cherry)",
            border: "none",
            color: "var(--color-cream)",
            fontSize: "14px",
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            fontFamily: "inherit",
          }}
        >
          {loading ? "Salvando…" : mode === "new" ? "Criar era" : "Salvar rascunho"}
        </button>

        {mode === "edit" && (currentStatus === "draft" || currentStatus === "scheduled") && (
          <button
            type="button"
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
              padding: "11px 24px",
              borderRadius: "8px",
              background: "rgba(126,184,136,0.15)",
              border: "1px solid rgba(126,184,136,0.35)",
              color: "#7eb888",
              fontSize: "14px",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              fontFamily: "inherit",
            }}
          >
            Ativar Era
          </button>
        )}

        <a
          href="/admin/eras"
          style={{
            padding: "11px 18px",
            borderRadius: "8px",
            background: "transparent",
            border: "1px solid var(--color-border)",
            color: "var(--color-muted-foreground)",
            fontSize: "14px",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            fontFamily: "inherit",
          }}
        >
          Cancelar
        </a>

        {mode === "edit" && currentStatus !== "active" && (
          <button
            type="button"
            onClick={() =>
              ask({
                title: "Excluir esta era?",
                description: "Esta ação não pode ser desfeita. Todos os dados serão perdidos.",
                confirmLabel: "Excluir permanentemente",
                danger: true,
                action: doDelete,
              })
            }
            disabled={loading}
            style={{
              marginLeft: "auto",
              padding: "11px 18px",
              borderRadius: "8px",
              background: "transparent",
              border: "1px solid rgba(196,49,75,0.3)",
              color: "var(--color-cherry)",
              fontSize: "14px",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              fontFamily: "inherit",
            }}
          >
            Excluir
          </button>
        )}
      </div>
    </form>
    </>
  );
}
