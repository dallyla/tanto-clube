"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type EraOption = { id: string; name: string; emoji: string };

type MissionFormData = {
  title: string;
  description: string;
  emoji: string;
  pointsReward: string;
  requiresScreenshot: boolean;
  eraId: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  maxCompletionsPerUser: string;
};

type Props = {
  mode: "new" | "edit";
  missionId?: string;
  eras: EraOption[];
  initial?: Partial<MissionFormData>;
};

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

export function MissionForm({ mode, missionId, eras, initial }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<MissionFormData>({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    emoji: initial?.emoji ?? "📋",
    pointsReward: initial?.pointsReward ?? "100",
    requiresScreenshot: initial?.requiresScreenshot ?? true,
    eraId: initial?.eraId ?? "",
    startsAt: initial?.startsAt ?? "",
    endsAt: initial?.endsAt ?? "",
    isActive: initial?.isActive ?? true,
    maxCompletionsPerUser: initial?.maxCompletionsPerUser ?? "1",
  });

  function set<K extends keyof MissionFormData>(key: K, value: MissionFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload = {
      title: form.title,
      description: form.description,
      emoji: form.emoji || "📋",
      pointsReward: Number(form.pointsReward),
      requiresScreenshot: form.requiresScreenshot,
      eraId: form.eraId || null,
      startsAt: form.startsAt || null,
      endsAt: form.endsAt || null,
      isActive: form.isActive,
      maxCompletionsPerUser: Number(form.maxCompletionsPerUser) || 1,
    };

    try {
      const url = mode === "new" ? "/api/admin/missions" : `/api/admin/missions/${missionId}`;
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
      router.push("/admin/missions");
      router.refresh();
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  return (
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

      {/* Title + emoji */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 90px", gap: "16px" }}>
        <Field label="Título *">
          <input
            required
            type="text"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Ex: Comente no IG do Diego"
            style={FIELD_STYLE}
          />
        </Field>
        <Field label="Emoji">
          <input
            type="text"
            value={form.emoji}
            onChange={(e) => set("emoji", e.target.value)}
            placeholder="📋"
            style={{ ...FIELD_STYLE, textAlign: "center", fontSize: "20px" }}
          />
        </Field>
      </div>

      {/* Description */}
      <Field label="Descrição *">
        <textarea
          required
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Descreva o que o fã precisa fazer para completar essa missão"
          rows={3}
          style={{ ...FIELD_STYLE, resize: "vertical" }}
        />
      </Field>

      {/* Points + screenshot */}
      <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: "16px", alignItems: "end" }}>
        <Field label="Pontos *">
          <input
            required
            type="number"
            min="1"
            value={form.pointsReward}
            onChange={(e) => set("pointsReward", e.target.value)}
            placeholder="100"
            style={FIELD_STYLE}
          />
        </Field>
        <div style={{ paddingBottom: "2px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={form.requiresScreenshot}
              onChange={(e) => set("requiresScreenshot", e.target.checked)}
              style={{ width: "16px", height: "16px", accentColor: "var(--color-gold)", cursor: "pointer" }}
            />
            <span style={{ color: "var(--color-cream)", fontSize: "14px" }}>
              Exige print de comprovação
            </span>
          </label>
          <p style={{ color: "var(--color-muted-foreground)", fontSize: "12px", marginTop: "4px", paddingLeft: "26px" }}>
            Sem print = aprovação automática
          </p>
        </div>
      </div>

      {/* Era */}
      <Field label="Era (opcional)">
        <select
          value={form.eraId}
          onChange={(e) => set("eraId", e.target.value)}
          style={{ ...FIELD_STYLE, cursor: "pointer" }}
        >
          <option value="">— Sem era vinculada —</option>
          {eras.map((era) => (
            <option key={era.id} value={era.id}>
              {era.emoji} {era.name}
            </option>
          ))}
        </select>
      </Field>

      {/* Dates */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <Field label="Início (opcional)">
          <input
            type="datetime-local"
            value={form.startsAt}
            onChange={(e) => set("startsAt", e.target.value)}
            style={{ ...FIELD_STYLE, colorScheme: "dark" }}
          />
        </Field>
        <Field label="Encerramento (opcional)">
          <input
            type="datetime-local"
            value={form.endsAt}
            onChange={(e) => set("endsAt", e.target.value)}
            style={{ ...FIELD_STYLE, colorScheme: "dark" }}
          />
        </Field>
      </div>

      {/* Status + max completions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: "16px", alignItems: "end" }}>
        <div style={{ paddingBottom: "2px" }}>
          <label style={LABEL_STYLE}>Status</label>
          <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => set("isActive", e.target.checked)}
              style={{ width: "16px", height: "16px", accentColor: "var(--color-gold)", cursor: "pointer" }}
            />
            <span style={{ color: "var(--color-cream)", fontSize: "14px" }}>
              Missão ativa ao salvar
            </span>
          </label>
        </div>
        <Field label="Completações por fã">
          <input
            type="number"
            min="1"
            value={form.maxCompletionsPerUser}
            onChange={(e) => set("maxCompletionsPerUser", e.target.value)}
            style={FIELD_STYLE}
          />
        </Field>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "10px", paddingTop: "8px", alignItems: "center" }}>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "11px 28px",
            borderRadius: "8px",
            background: "var(--color-gold)",
            border: "none",
            color: "var(--color-bg-primary)",
            fontSize: "14px",
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            fontFamily: "inherit",
          }}
        >
          {loading ? "Salvando…" : mode === "new" ? "Criar missão" : "Salvar alterações"}
        </button>
        <a
          href="/admin/missions"
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
      </div>
    </form>
  );
}
