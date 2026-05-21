"use client";

import { useState } from "react";

type Badge = {
  id: string;
  slug: string;
  name: string;
  description: string;
  emoji: string;
  category: string;
  criteriaType: string;
  isSecret: boolean;
  displayOrder: number;
  eraId: string | null;
  eraName: string | null;
  earnedCount: number;
  createdAt: Date;
};

type Era = { id: string; name: string; emoji: string };

const CATEGORIES = [
  { value: "volume", label: "Volume" },
  { value: "catalog", label: "Catálogo" },
  { value: "temporal", label: "Temporal" },
  { value: "era", label: "Era" },
  { value: "monthly_top", label: "Top Mensal" },
  { value: "custom", label: "Customizado" },
];

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label])
);

const FIELD_STYLE: React.CSSProperties = {
  width: "100%",
  background: "var(--color-bg-elevated)",
  border: "1px solid var(--color-border)",
  borderRadius: "8px",
  padding: "8px 12px",
  color: "var(--color-cream)",
  fontSize: "13px",
  fontFamily: "inherit",
};

const LABEL_STYLE: React.CSSProperties = {
  display: "block",
  color: "var(--color-muted-foreground)",
  fontSize: "11px",
  letterSpacing: "0.07em",
  textTransform: "uppercase",
  marginBottom: "4px",
  fontWeight: 600,
};

const EMPTY_FORM = {
  emoji: "🏅",
  name: "",
  slug: "",
  description: "",
  category: "custom",
  criteriaType: "manual",
  isSecret: false,
  eraId: "",
  displayOrder: "0",
};

export function BadgesManager({ badges: initial, eras }: { badges: Badge[]; eras: Era[] }) {
  const [badges, setBadges] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState(EMPTY_FORM);

  function setField(k: keyof typeof form, v: string | boolean) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
    setShowForm(true);
  }

  function openEdit(badge: Badge) {
    setEditingId(badge.id);
    setForm({
      emoji: badge.emoji,
      name: badge.name,
      slug: badge.slug,
      description: badge.description,
      category: badge.category,
      criteriaType: badge.criteriaType,
      isSecret: badge.isSecret,
      eraId: badge.eraId ?? "",
      displayOrder: String(badge.displayOrder),
    });
    setError(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = {
        ...form,
        eraId: form.eraId || null,
        displayOrder: parseInt(form.displayOrder) || 0,
      };

      if (editingId) {
        const res = await fetch(`/api/admin/badges/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json() as Badge & { error?: string; eraName?: string | null };
        if (!res.ok) { setError(data.error ?? "Erro ao editar badge"); return; }
        // preserve eraName from local state since PATCH response may not include it
        const eraName = eras.find((e) => e.id === form.eraId)?.name ?? null;
        setBadges((prev) => prev.map((b) => b.id === editingId ? { ...data, eraName } : b));
        cancelForm();
      } else {
        const res = await fetch("/api/admin/badges", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json() as Badge & { error?: string };
        if (!res.ok) { setError(data.error ?? "Erro ao criar badge"); return; }
        const eraName = eras.find((e) => e.id === form.eraId)?.name ?? null;
        setBadges((prev) => [{ ...data, eraName }, ...prev]);
        cancelForm();
      }
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Create form toggle */}
      <div style={{ marginBottom: "24px" }}>
        <button
          onClick={showForm ? cancelForm : openCreate}
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            background: showForm ? "var(--color-bg-elevated)" : "var(--color-cherry)",
            border: showForm ? "1px solid var(--color-border)" : "none",
            color: showForm ? "var(--color-cream)" : "var(--color-cherry-fg)",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {showForm ? "Cancelar" : "+ Novo Badge"}
        </button>
      </div>

      {/* Form (create or edit) */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          style={{
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border-strong)",
            borderRadius: "16px",
            padding: "24px",
            marginBottom: "24px",
          }}
        >
          <p
            className="font-display"
            style={{
              color: "var(--color-gold)",
              fontSize: "14px",
              fontStyle: "italic",
              marginBottom: "20px",
            }}
          >
            {editingId ? "Editar badge" : "Novo badge"}
          </p>

          {error && (
            <div style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(196,49,75,0.12)", border: "1px solid rgba(196,49,75,0.3)", color: "var(--color-cherry)", fontSize: "13px", marginBottom: "16px" }}>
              {error}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr", gap: "14px", marginBottom: "14px" }}>
            <div>
              <label style={LABEL_STYLE}>Emoji</label>
              <input type="text" value={form.emoji} onChange={(e) => setField("emoji", e.target.value)} style={FIELD_STYLE} required />
            </div>
            <div>
              <label style={LABEL_STYLE}>Nome *</label>
              <input type="text" value={form.name} onChange={(e) => setField("name", e.target.value)} style={FIELD_STYLE} required placeholder="Ex: Ouvinte Dedicado" />
            </div>
            <div>
              <label style={LABEL_STYLE}>Slug *</label>
              <input type="text" value={form.slug} onChange={(e) => setField("slug", e.target.value)} style={FIELD_STYLE} required placeholder="ouvinte-dedicado" />
            </div>
          </div>

          <div style={{ marginBottom: "14px" }}>
            <label style={LABEL_STYLE}>Descrição *</label>
            <input type="text" value={form.description} onChange={(e) => setField("description", e.target.value)} style={FIELD_STYLE} required placeholder="Como ganhar este badge" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px", marginBottom: "14px" }}>
            <div>
              <label style={LABEL_STYLE}>Categoria *</label>
              <select value={form.category} onChange={(e) => setField("category", e.target.value)} style={{ ...FIELD_STYLE, cursor: "pointer" }}>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={LABEL_STYLE}>Tipo de critério</label>
              <select value={form.criteriaType} onChange={(e) => setField("criteriaType", e.target.value)} style={{ ...FIELD_STYLE, cursor: "pointer" }}>
                <option value="manual">Manual</option>
                <option value="automatic">Automático</option>
              </select>
            </div>
            <div>
              <label style={LABEL_STYLE}>Era (opcional)</label>
              <select value={form.eraId} onChange={(e) => setField("eraId", e.target.value)} style={{ ...FIELD_STYLE, cursor: "pointer" }}>
                <option value="">— nenhuma —</option>
                {eras.map((era) => (
                  <option key={era.id} value={era.id}>{era.emoji} {era.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "20px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={form.isSecret}
                onChange={(e) => setField("isSecret", e.target.checked)}
                style={{ accentColor: "var(--color-gold)" }}
              />
              <span style={{ color: "var(--color-cream)", fontSize: "13px" }}>Badge secreto</span>
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label style={{ ...LABEL_STYLE, margin: 0 }}>Ordem:</label>
              <input
                type="number"
                value={form.displayOrder}
                onChange={(e) => setField("displayOrder", e.target.value)}
                style={{ ...FIELD_STYLE, width: "70px" }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "10px 24px",
              borderRadius: "8px",
              background: "var(--color-cherry)",
              border: "none",
              color: "var(--color-cherry-fg)",
              fontSize: "14px",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (editingId ? "Salvando…" : "Criando…") : (editingId ? "Salvar alterações" : "Criar badge")}
          </button>
        </form>
      )}

      {/* Badges list */}
      {badges.length === 0 ? (
        <div
          style={{
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "12px",
            padding: "40px",
            textAlign: "center",
          }}
        >
          <p style={{ color: "var(--color-muted-foreground)", fontSize: "14px" }}>
            Nenhum badge cadastrado
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
          {badges.map((badge) => (
            <div
              key={badge.id}
              style={{
                background: editingId === badge.id ? "var(--color-bg-elevated)" : "var(--color-bg-card)",
                border: editingId === badge.id ? "1px solid var(--color-gold)" : "1px solid var(--color-border)",
                borderRadius: "12px",
                padding: "16px",
                transition: "border-color 0.15s",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    background: "var(--color-bg-elevated)",
                    border: "1px solid var(--color-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "22px",
                    flexShrink: 0,
                  }}
                >
                  {badge.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginBottom: "2px" }}>
                    <p style={{ color: "var(--color-cream)", fontSize: "13px", fontWeight: 600 }}>
                      {badge.name}
                    </p>
                    {badge.isSecret && (
                      <span style={{ fontSize: "10px", color: "var(--color-gold)", background: "rgba(200,164,92,0.1)", padding: "1px 5px", borderRadius: "4px", border: "1px solid rgba(200,164,92,0.2)" }}>
                        secreto
                      </span>
                    )}
                  </div>
                  <p style={{ color: "var(--color-muted-foreground)", fontSize: "12px", marginBottom: "6px" }}>
                    {badge.description}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "10px", color: "var(--color-muted-foreground)", background: "var(--color-bg-elevated)", padding: "1px 6px", borderRadius: "4px", border: "1px solid var(--color-border)" }}>
                      {CATEGORY_LABELS[badge.category] ?? badge.category}
                    </span>
                    <span style={{ fontSize: "10px", color: "var(--color-muted-foreground)", background: "var(--color-bg-elevated)", padding: "1px 6px", borderRadius: "4px", border: "1px solid var(--color-border)" }}>
                      {badge.criteriaType === "manual" ? "manual" : "automático"}
                    </span>
                    {badge.eraName && (
                      <span style={{ fontSize: "10px", color: "var(--color-gold)", background: "rgba(200,164,92,0.08)", padding: "1px 6px", borderRadius: "4px", border: "1px solid rgba(200,164,92,0.15)" }}>
                        {badge.eraName}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* footer */}
              <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px dashed var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <p style={{ fontSize: "11px", color: "var(--color-muted-foreground)" }}>
                  conquistada por{" "}
                  <strong style={{ color: "var(--color-cream)", fontWeight: 600 }}>
                    {badge.earnedCount}
                  </strong>{" "}
                  {badge.earnedCount === 1 ? "fã" : "fãs"}
                </p>
                <button
                  onClick={() => editingId === badge.id ? cancelForm() : openEdit(badge)}
                  style={{
                    fontSize: "12px",
                    color: editingId === badge.id ? "var(--color-gold)" : "var(--color-cream)",
                    background: editingId === badge.id ? "rgba(200,164,92,0.1)" : "var(--color-bg-elevated)",
                    border: `1px solid ${editingId === badge.id ? "rgba(200,164,92,0.3)" : "var(--color-border)"}`,
                    cursor: "pointer",
                    padding: "4px 12px",
                    borderRadius: "6px",
                    fontFamily: "inherit",
                    fontWeight: 600,
                  }}
                >
                  {editingId === badge.id ? "Cancelar" : "Editar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
