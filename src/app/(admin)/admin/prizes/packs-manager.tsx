"use client";

import { useState } from "react";

type PrizeType = "sticker" | "mug" | "poster" | "other" | "digital" | "badge";

type AvailablePrize = {
  id: string;
  name: string;
  prizeType: PrizeType;
  stockQuantity: number;
  isActive: number;
};

type PackItem = {
  id: string;
  packId: string;
  prizeId: string;
  prizeName: string;
  prizeType: PrizeType;
  quantity: number;
};

type Pack = {
  id: string;
  name: string;
  emoji: string;
  description: string | null;
  isActive: number;
  createdAt: string | Date;
  items: PackItem[];
};

const PRIZE_TYPE_EMOJI: Record<PrizeType, string> = {
  badge: "🏅",
  sticker: "🏷️",
  mug: "☕",
  poster: "🖼️",
  other: "🎁",
  digital: "✨",
};

export function PacksManager({
  initialPacks,
  availablePrizes,
}: {
  initialPacks: Pack[];
  availablePrizes: AvailablePrize[];
}) {
  const [packs, setPacks] = useState<Pack[]>(initialPacks);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("📦");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingPack, setEditingPack] = useState<Pack | null>(null);
  const [editItems, setEditItems] = useState<{ prizeId: string; quantity: number }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/prizes/packs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), emoji: newEmoji.trim(), description: newDesc.trim() }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const created: Pack = await res.json();
      setPacks((prev) => [created, ...prev]);
      setNewName("");
      setNewEmoji("📦");
      setNewDesc("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar pack");
    } finally {
      setCreating(false);
    }
  }

  function startEdit(pack: Pack) {
    setEditingPack({ ...pack });
    setEditItems(pack.items.map((i) => ({ prizeId: i.prizeId, quantity: i.quantity })));
    setExpandedId(pack.id);
  }

  function addItem() {
    const firstAvailable = availablePrizes.find(
      (p) => p.isActive && !editItems.find((i) => i.prizeId === p.id)
    );
    if (!firstAvailable) return;
    setEditItems((prev) => [...prev, { prizeId: firstAvailable.id, quantity: 1 }]);
  }

  function updateItem(idx: number, field: "prizeId" | "quantity", value: string | number) {
    setEditItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  }

  function removeItem(idx: number) {
    setEditItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    if (!editingPack) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/prizes/packs/${editingPack.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingPack.name,
          emoji: editingPack.emoji,
          description: editingPack.description,
          items: editItems,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const updated: Pack = await res.json();
      setPacks((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setEditingPack(null);
      setExpandedId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(pack: Pack) {
    const res = await fetch(`/api/admin/prizes/packs/${pack.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: pack.isActive ? 0 : 1 }),
    });
    if (res.ok) {
      const updated: Pack = await res.json();
      setPacks((prev) => prev.map((p) => (p.id === pack.id ? updated : p)));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este pack?")) return;
    const res = await fetch(`/api/admin/prizes/packs/${id}`, { method: "DELETE" });
    if (res.ok) setPacks((prev) => prev.filter((p) => p.id !== id));
  }

  const inputStyle: React.CSSProperties = {
    padding: "9px 12px",
    borderRadius: "8px",
    border: "1px solid var(--color-border-strong)",
    background: "var(--color-bg-elevated)",
    color: "var(--color-cream)",
    fontSize: "13px",
    fontFamily: "inherit",
    width: "100%",
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
    flexShrink: 0,
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
    flexShrink: 0,
  };

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
        <p className="font-display" style={{ color: "var(--color-cream)", fontSize: "16px", fontStyle: "italic", marginBottom: "16px" }}>
          Novo pack
        </p>
        <form onSubmit={handleCreate}>
          <div style={{ display: "grid", gridTemplateColumns: "64px 1fr 1fr", gap: "12px", marginBottom: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", color: "var(--color-muted-foreground)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Emoji
              </label>
              <input
                style={{ ...inputStyle, textAlign: "center", fontSize: "22px", padding: "6px" }}
                value={newEmoji}
                onChange={(e) => setNewEmoji(e.target.value)}
                maxLength={4}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", color: "var(--color-muted-foreground)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Nome *
              </label>
              <input
                style={inputStyle}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="ex: Pack Top 1"
                required
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", color: "var(--color-muted-foreground)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Descrição
              </label>
              <input
                style={inputStyle}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Opcional"
              />
            </div>
          </div>
          {error && <p style={{ color: "var(--color-cherry)", fontSize: "13px", marginBottom: "12px" }}>{error}</p>}
          <p style={{ fontSize: "12px", color: "var(--color-muted-foreground)", marginBottom: "12px" }}>
            Crie o pack e depois adicione os prêmios que ele contém.
          </p>
          <button style={btnPrimary} type="submit" disabled={creating}>
            {creating ? "Criando…" : "Criar pack"}
          </button>
        </form>
      </div>

      {/* List */}
      {packs.length === 0 ? (
        <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "40px", textAlign: "center" }}>
          <p style={{ color: "var(--color-muted-foreground)", fontSize: "14px" }}>Nenhum pack criado ainda.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {packs.map((pack) => {
            const isExpanded = expandedId === pack.id;
            const isEditing = editingPack?.id === pack.id;

            return (
              <div
                key={pack.id}
                style={{
                  background: "var(--color-bg-card)",
                  border: `1px solid ${pack.isActive ? "var(--color-border-strong)" : "var(--color-border)"}`,
                  borderRadius: "12px",
                  overflow: "hidden",
                  opacity: pack.isActive ? 1 : 0.6,
                }}
              >
                {/* Header */}
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px 20px", cursor: "pointer" }}
                  onClick={() => setExpandedId(isExpanded ? null : pack.id)}
                >
                  <span style={{ fontSize: "20px" }}>{pack.emoji || "📦"}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: "var(--color-cream)", fontSize: "14px", fontWeight: 600 }}>{pack.name}</p>
                    <p style={{ color: "var(--color-muted-foreground)", fontSize: "12px" }}>
                      {pack.description ? `${pack.description} · ` : ""}
                      {pack.items.length === 0 ? "sem itens" : `${pack.items.length} ${pack.items.length === 1 ? "item" : "itens"}`}
                      {!pack.isActive && " · inativo"}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                    <button style={btnSecondary} onClick={() => startEdit(pack)}>Editar</button>
                    <button
                      style={{ ...btnSecondary, color: pack.isActive ? "var(--color-cherry)" : "var(--color-gold)", borderColor: pack.isActive ? "rgba(196,49,75,0.4)" : "rgba(200,164,92,0.4)" }}
                      onClick={() => handleToggle(pack)}
                    >
                      {pack.isActive ? "Desativar" : "Ativar"}
                    </button>
                    <button
                      style={{ ...btnSecondary, color: "var(--color-cherry)", borderColor: "rgba(196,49,75,0.3)" }}
                      onClick={() => handleDelete(pack.id)}
                    >
                      Excluir
                    </button>
                  </div>
                  <span style={{ color: "var(--color-muted-foreground)", fontSize: "12px", marginLeft: "4px" }}>
                    {isExpanded ? "▲" : "▼"}
                  </span>
                </div>

                {/* Expanded — edit or view */}
                {isExpanded && (
                  <div style={{ borderTop: "1px solid var(--color-border)", padding: "20px" }}>
                    {isEditing ? (
                      <div>
                        {/* Pack name/desc fields */}
                        <div style={{ display: "grid", gridTemplateColumns: "64px 1fr 1fr", gap: "10px", marginBottom: "20px" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "11px", color: "var(--color-muted-foreground)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Emoji</label>
                            <input
                              style={{ ...inputStyle, textAlign: "center", fontSize: "22px", padding: "6px" }}
                              value={editingPack?.emoji ?? "📦"}
                              onChange={(e) => setEditingPack((p) => p ? { ...p, emoji: e.target.value } : p)}
                              maxLength={4}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "11px", color: "var(--color-muted-foreground)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Nome</label>
                            <input
                              style={inputStyle}
                              value={editingPack?.name ?? ""}
                              onChange={(e) => setEditingPack((p) => p ? { ...p, name: e.target.value } : p)}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "11px", color: "var(--color-muted-foreground)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Descrição</label>
                            <input
                              style={inputStyle}
                              value={editingPack?.description ?? ""}
                              onChange={(e) => setEditingPack((p) => p ? { ...p, description: e.target.value } : p)}
                            />
                          </div>
                        </div>

                        {/* Items */}
                        <p style={{ fontSize: "11px", color: "var(--color-muted-foreground)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
                          Itens do pack
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
                          {editItems.length === 0 && (
                            <p style={{ color: "var(--color-muted-foreground)", fontSize: "13px" }}>Nenhum item adicionado.</p>
                          )}
                          {editItems.map((item, idx) => (
                            <div key={idx} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                              <select
                                style={{ ...inputStyle, flex: 1 }}
                                value={item.prizeId}
                                onChange={(e) => updateItem(idx, "prizeId", e.target.value)}
                              >
                                {availablePrizes.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {PRIZE_TYPE_EMOJI[p.prizeType]} {p.name}
                                  </option>
                                ))}
                              </select>
                              <input
                                type="number"
                                min={1}
                                style={{ ...inputStyle, width: "80px" }}
                                value={item.quantity}
                                onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                              />
                              <button
                                style={{ ...btnSecondary, color: "var(--color-cherry)", borderColor: "rgba(196,49,75,0.3)", padding: "7px 10px" }}
                                onClick={() => removeItem(idx)}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>

                        <button
                          style={{ ...btnSecondary, marginBottom: "20px" }}
                          onClick={addItem}
                          disabled={availablePrizes.filter((p) => p.isActive).length === 0}
                        >
                          + Adicionar item
                        </button>

                        {error && <p style={{ color: "var(--color-cherry)", fontSize: "13px", marginBottom: "12px" }}>{error}</p>}

                        <div style={{ display: "flex", gap: "8px" }}>
                          <button style={btnPrimary} onClick={handleSave} disabled={saving}>
                            {saving ? "Salvando…" : "Salvar pack"}
                          </button>
                          <button style={btnSecondary} onClick={() => { setEditingPack(null); setExpandedId(null); }}>
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {pack.items.length === 0 ? (
                          <p style={{ color: "var(--color-muted-foreground)", fontSize: "13px" }}>
                            Nenhum item. Clique em "Editar" para adicionar prêmios.
                          </p>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {pack.items.map((item) => (
                              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <span style={{ fontSize: "18px" }}>{PRIZE_TYPE_EMOJI[item.prizeType]}</span>
                                <span style={{ color: "var(--color-cream)", fontSize: "13px", flex: 1 }}>{item.prizeName}</span>
                                <span style={{ color: "var(--color-muted-foreground)", fontSize: "12px" }}>× {item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
