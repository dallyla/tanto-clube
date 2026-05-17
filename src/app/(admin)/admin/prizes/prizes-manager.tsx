"use client";

import { useState } from "react";

type PrizeType = "sticker" | "mug" | "poster" | "other" | "digital" | "badge";

type Badge = {
  id: string;
  name: string;
  emoji: string;
  slug: string;
};

type Prize = {
  id: string;
  name: string;
  description: string | null;
  prizeType: PrizeType;
  stockQuantity: number;
  isActive: number;
  badgeId: string | null;
};

const PRIZE_TYPE_LABELS: Record<PrizeType, string> = {
  sticker: "Adesivo",
  mug: "Caneca",
  poster: "Poster",
  other: "Outro",
  digital: "Digital",
  badge: "Badge",
};

const PRIZE_TYPE_EMOJI: Record<PrizeType, string> = {
  sticker: "🏷️",
  mug: "☕",
  poster: "🖼️",
  other: "🎁",
  digital: "✨",
  badge: "🏅",
};

const EMPTY_FORM = {
  name: "",
  description: "",
  prizeType: "other" as PrizeType,
  stockQuantity: 1,
  badgeId: "",
};

export function PrizesManager({
  initialPrizes,
  badges,
}: {
  initialPrizes: Prize[];
  badges: Badge[];
}) {
  const [prizes, setPrizes] = useState<Prize[]>(initialPrizes);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Prize>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...form,
        badgeId: form.prizeType === "badge" ? form.badgeId || null : null,
        stockQuantity: form.prizeType === "badge" ? 0 : form.stockQuantity,
      };
      const res = await fetch("/api/admin/prizes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const created: Prize = await res.json();
      setPrizes((prev) => [created, ...prev]);
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar prêmio");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveEdit(id: string) {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...editForm,
        badgeId: editForm.prizeType === "badge" ? editForm.badgeId || null : null,
        stockQuantity: editForm.prizeType === "badge" ? 0 : editForm.stockQuantity,
      };
      const res = await fetch(`/api/admin/prizes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const updated: Prize = await res.json();
      setPrizes((prev) => prev.map((p) => (p.id === id ? updated : p)));
      setEditId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive(prize: Prize) {
    const res = await fetch(`/api/admin/prizes/${prize.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: prize.isActive ? 0 : 1 }),
    });
    if (res.ok) {
      const updated: Prize = await res.json();
      setPrizes((prev) => prev.map((p) => (p.id === prize.id ? updated : p)));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este prêmio? Esta ação não pode ser desfeita.")) return;
    const res = await fetch(`/api/admin/prizes/${id}`, { method: "DELETE" });
    if (res.ok) setPrizes((prev) => prev.filter((p) => p.id !== id));
  }

  function startEdit(prize: Prize) {
    setEditId(prize.id);
    setEditForm({
      name: prize.name,
      description: prize.description ?? "",
      prizeType: prize.prizeType,
      stockQuantity: prize.stockQuantity,
      badgeId: prize.badgeId ?? "",
    });
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "9px 12px",
    borderRadius: "8px",
    border: "1px solid var(--color-border-strong)",
    background: "var(--color-bg-elevated)",
    color: "var(--color-cream)",
    fontSize: "13px",
    fontFamily: "inherit",
    boxSizing: "border-box",
  };

  const btnPrimary: React.CSSProperties = {
    padding: "9px 20px",
    borderRadius: "8px",
    background: "var(--color-gold)",
    border: "none",
    color: "var(--color-bg-primary)",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  };

  const btnSecondary: React.CSSProperties = {
    padding: "7px 14px",
    borderRadius: "8px",
    background: "transparent",
    border: "1px solid var(--color-border-strong)",
    color: "var(--color-muted-foreground)",
    fontSize: "12px",
    cursor: "pointer",
    fontFamily: "inherit",
  };

  function badgeName(badgeId: string | null) {
    if (!badgeId) return null;
    const b = badges.find((b) => b.id === badgeId);
    return b ? `${b.emoji} ${b.name}` : null;
  }

  function BadgeSelector({
    value,
    onChange,
  }: {
    value: string;
    onChange: (v: string) => void;
  }) {
    return (
      <div>
        <label
          style={{
            display: "block",
            fontSize: "11px",
            color: "var(--color-muted-foreground)",
            marginBottom: "4px",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Badge *
        </label>
        <select
          style={inputStyle}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
        >
          <option value="">Selecione um badge…</option>
          {badges.map((b) => (
            <option key={b.id} value={b.id}>
              {b.emoji} {b.name}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div>
      {/* Create form */}
      <div
        style={{
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border-strong)",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "32px",
        }}
      >
        <p
          className="font-display"
          style={{
            color: "var(--color-cream)",
            fontSize: "16px",
            fontStyle: "italic",
            marginBottom: "16px",
          }}
        >
          Novo prêmio
        </p>
        <form onSubmit={handleCreate}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              marginBottom: "12px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  color: "var(--color-muted-foreground)",
                  marginBottom: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Nome *
              </label>
              <input
                style={inputStyle}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="ex: Adesivo exclusivo"
                required
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  color: "var(--color-muted-foreground)",
                  marginBottom: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Tipo *
              </label>
              <select
                style={inputStyle}
                value={form.prizeType}
                onChange={(e) =>
                  setForm((f) => ({ ...f, prizeType: e.target.value as PrizeType, badgeId: "" }))
                }
              >
                {(Object.keys(PRIZE_TYPE_LABELS) as PrizeType[]).map((t) => (
                  <option key={t} value={t}>
                    {PRIZE_TYPE_EMOJI[t]} {PRIZE_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {form.prizeType === "badge" ? (
            <div style={{ marginBottom: "16px" }}>
              <BadgeSelector
                value={form.badgeId}
                onChange={(v) => setForm((f) => ({ ...f, badgeId: v }))}
              />
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr",
                gap: "12px",
                marginBottom: "16px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "11px",
                    color: "var(--color-muted-foreground)",
                    marginBottom: "4px",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Descrição
                </label>
                <input
                  style={inputStyle}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Opcional"
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "11px",
                    color: "var(--color-muted-foreground)",
                    marginBottom: "4px",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Estoque
                </label>
                <input
                  style={inputStyle}
                  type="number"
                  min={0}
                  value={form.stockQuantity}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, stockQuantity: Number(e.target.value) }))
                  }
                />
              </div>
            </div>
          )}

          {error && (
            <p style={{ color: "var(--color-cherry)", fontSize: "13px", marginBottom: "12px" }}>
              {error}
            </p>
          )}
          <button style={btnPrimary} type="submit" disabled={loading}>
            {loading ? "Criando…" : "Criar prêmio"}
          </button>
        </form>
      </div>

      {/* List */}
      {prizes.length === 0 ? (
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
            Nenhum prêmio cadastrado ainda.
          </p>
        </div>
      ) : (
        <div
          style={{
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          {prizes.map((prize, idx) => (
            <div
              key={prize.id}
              style={{
                borderBottom: idx < prizes.length - 1 ? "1px solid var(--color-border)" : "none",
                padding: "16px 20px",
                opacity: prize.isActive ? 1 : 0.5,
              }}
            >
              {editId === prize.id ? (
                <div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "10px",
                      marginBottom: "10px",
                    }}
                  >
                    <input
                      style={inputStyle}
                      value={editForm.name ?? ""}
                      onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Nome"
                    />
                    <select
                      style={inputStyle}
                      value={editForm.prizeType ?? "other"}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          prizeType: e.target.value as PrizeType,
                          badgeId: "",
                        }))
                      }
                    >
                      {(Object.keys(PRIZE_TYPE_LABELS) as PrizeType[]).map((t) => (
                        <option key={t} value={t}>
                          {PRIZE_TYPE_EMOJI[t]} {PRIZE_TYPE_LABELS[t]}
                        </option>
                      ))}
                    </select>
                  </div>

                  {editForm.prizeType === "badge" ? (
                    <div style={{ marginBottom: "12px" }}>
                      <BadgeSelector
                        value={editForm.badgeId ?? ""}
                        onChange={(v) => setEditForm((f) => ({ ...f, badgeId: v }))}
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "2fr 1fr",
                        gap: "10px",
                        marginBottom: "12px",
                      }}
                    >
                      <input
                        style={inputStyle}
                        value={editForm.description ?? ""}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, description: e.target.value }))
                        }
                        placeholder="Descrição"
                      />
                      <input
                        style={inputStyle}
                        type="number"
                        min={0}
                        value={editForm.stockQuantity ?? 0}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, stockQuantity: Number(e.target.value) }))
                        }
                      />
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      style={btnPrimary}
                      onClick={() => handleSaveEdit(prize.id)}
                      disabled={loading}
                    >
                      Salvar
                    </button>
                    <button style={btnSecondary} onClick={() => setEditId(null)}>
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <span style={{ fontSize: "22px", flexShrink: 0 }}>
                    {prize.prizeType === "badge" && prize.badgeId
                      ? badges.find((b) => b.id === prize.badgeId)?.emoji ?? "🏅"
                      : PRIZE_TYPE_EMOJI[prize.prizeType]}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: "var(--color-cream)", fontSize: "14px", fontWeight: 500 }}>
                      {prize.name}
                    </p>
                    <p style={{ color: "var(--color-muted-foreground)", fontSize: "12px" }}>
                      {PRIZE_TYPE_LABELS[prize.prizeType]}
                      {prize.prizeType === "badge" && prize.badgeId
                        ? ` · ${badgeName(prize.badgeId)}`
                        : prize.description
                        ? ` · ${prize.description}`
                        : ""}
                    </p>
                  </div>
                  {prize.prizeType !== "badge" && (
                    <div style={{ textAlign: "right", flexShrink: 0, marginRight: "16px" }}>
                      <p
                        style={{ color: "var(--color-cream)", fontSize: "16px", fontWeight: 600 }}
                      >
                        {prize.stockQuantity}
                      </p>
                      <p style={{ color: "var(--color-muted-foreground)", fontSize: "11px" }}>
                        estoque
                      </p>
                    </div>
                  )}
                  <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                    <button style={btnSecondary} onClick={() => startEdit(prize)}>
                      Editar
                    </button>
                    <button
                      style={{
                        ...btnSecondary,
                        color: prize.isActive ? "var(--color-cherry)" : "var(--color-gold)",
                        borderColor: prize.isActive
                          ? "rgba(196,49,75,0.4)"
                          : "rgba(200,164,92,0.4)",
                      }}
                      onClick={() => handleToggleActive(prize)}
                    >
                      {prize.isActive ? "Desativar" : "Ativar"}
                    </button>
                    <button
                      style={{
                        ...btnSecondary,
                        color: "var(--color-cherry)",
                        borderColor: "rgba(196,49,75,0.3)",
                      }}
                      onClick={() => handleDelete(prize.id)}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
