"use client";

import { useState } from "react";

type Props = {
  prizeAwardId: string;
  prizeName: string;
  onSuccess: () => void;
  onBack: () => void;
};

export function AddressForm({ prizeAwardId, prizeName, onSuccess, onBack }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    recipientName: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
  });

  function set(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/user/prize-address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prizeAwardId,
          recipientName: form.recipientName,
          address: {
            street: form.street,
            number: form.number,
            complement: form.complement || undefined,
            neighborhood: form.neighborhood,
            city: form.city,
            state: form.state.toUpperCase(),
            zipCode: form.zipCode,
          },
        }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setError(data.error ?? "Erro ao salvar endereço");
        return;
      }
      onSuccess();
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    background: "var(--color-bg-elevated)",
    border: "1px solid var(--color-border)",
    color: "var(--color-cream)",
    padding: "9px 12px",
    borderRadius: "8px",
    fontSize: "14px",
    width: "100%",
    outline: "none",
    fontFamily: "inherit",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "12px",
    color: "var(--color-muted-foreground)",
    fontWeight: 500,
    marginBottom: "4px",
    display: "block",
    textAlign: "left",
  };

  return (
    <form onSubmit={submit} style={{ textAlign: "left" }}>
      <p
        style={{
          fontFamily: "var(--font-display, serif)",
          fontSize: "11px",
          fontStyle: "italic",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "var(--color-gold)",
          marginBottom: "4px",
          textAlign: "center",
        }}
      >
        📦 entrega do prêmio
      </p>
      <h3
        style={{
          fontFamily: "var(--font-display, serif)",
          fontSize: "20px",
          fontStyle: "italic",
          color: "var(--color-cream)",
          marginBottom: "4px",
          textAlign: "center",
        }}
      >
        {prizeName}
      </h3>
      <p style={{ color: "var(--color-muted-foreground)", fontSize: "13px", marginBottom: "20px", textAlign: "center" }}>
        Preencha o endereço para recebermos seu prêmio.
      </p>

      <div style={{ marginBottom: "12px" }}>
        <label style={labelStyle}>Nome completo do destinatário</label>
        <input
          required
          value={form.recipientName}
          onChange={(e) => set("recipientName", e.target.value)}
          placeholder="Como aparecerá na etiqueta"
          style={inputStyle}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "8px", marginBottom: "12px" }}>
        <div>
          <label style={labelStyle}>Rua / Av.</label>
          <input required value={form.street} onChange={(e) => set("street", e.target.value)} placeholder="Rua das Flores" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Número</label>
          <input required value={form.number} onChange={(e) => set("number", e.target.value)} placeholder="123" style={{ ...inputStyle, width: "80px" }} />
        </div>
      </div>

      <div style={{ marginBottom: "12px" }}>
        <label style={labelStyle}>Complemento (opcional)</label>
        <input value={form.complement} onChange={(e) => set("complement", e.target.value)} placeholder="Apto 42, Bloco B…" style={inputStyle} />
      </div>

      <div style={{ marginBottom: "12px" }}>
        <label style={labelStyle}>Bairro</label>
        <input required value={form.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} style={inputStyle} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 60px", gap: "8px", marginBottom: "12px" }}>
        <div>
          <label style={labelStyle}>Cidade</label>
          <input required value={form.city} onChange={(e) => set("city", e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>UF</label>
          <input required maxLength={2} value={form.state} onChange={(e) => set("state", e.target.value)} placeholder="PE" style={{ ...inputStyle, textTransform: "uppercase" }} />
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label style={labelStyle}>CEP</label>
        <input
          required
          value={form.zipCode}
          onChange={(e) => set("zipCode", e.target.value)}
          placeholder="00000-000"
          style={inputStyle}
        />
      </div>

      {error && (
        <p style={{ color: "var(--color-cherry)", fontSize: "13px", marginBottom: "12px" }}>
          {error}
        </p>
      )}

      <div style={{ display: "flex", gap: "8px" }}>
        <button
          type="submit"
          disabled={loading}
          style={{
            flex: 1,
            padding: "11px",
            borderRadius: "10px",
            background: "var(--color-gold)",
            border: "none",
            color: "var(--color-bg-primary)",
            fontSize: "14px",
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Salvando…" : "Confirmar endereço"}
        </button>
        <button
          type="button"
          onClick={onBack}
          style={{
            padding: "11px 14px",
            borderRadius: "10px",
            background: "transparent",
            border: "1px solid var(--color-border)",
            color: "var(--color-muted-foreground)",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          Voltar
        </button>
      </div>
    </form>
  );
}
