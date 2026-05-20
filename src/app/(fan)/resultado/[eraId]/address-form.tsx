"use client";

import { useState, useEffect } from "react";

const ESTADOS = [
  { uf: "AC", nome: "Acre" },
  { uf: "AL", nome: "Alagoas" },
  { uf: "AP", nome: "Amapá" },
  { uf: "AM", nome: "Amazonas" },
  { uf: "BA", nome: "Bahia" },
  { uf: "CE", nome: "Ceará" },
  { uf: "DF", nome: "Distrito Federal" },
  { uf: "ES", nome: "Espírito Santo" },
  { uf: "GO", nome: "Goiás" },
  { uf: "MA", nome: "Maranhão" },
  { uf: "MT", nome: "Mato Grosso" },
  { uf: "MS", nome: "Mato Grosso do Sul" },
  { uf: "MG", nome: "Minas Gerais" },
  { uf: "PA", nome: "Pará" },
  { uf: "PB", nome: "Paraíba" },
  { uf: "PR", nome: "Paraná" },
  { uf: "PE", nome: "Pernambuco" },
  { uf: "PI", nome: "Piauí" },
  { uf: "RJ", nome: "Rio de Janeiro" },
  { uf: "RN", nome: "Rio Grande do Norte" },
  { uf: "RS", nome: "Rio Grande do Sul" },
  { uf: "RO", nome: "Rondônia" },
  { uf: "RR", nome: "Roraima" },
  { uf: "SC", nome: "Santa Catarina" },
  { uf: "SP", nome: "São Paulo" },
  { uf: "SE", nome: "Sergipe" },
  { uf: "TO", nome: "Tocantins" },
];

type Props = {
  prizeAwardId: string;
  prizeName: string;
  onSuccess: () => void;
  onBack: () => void;
};

export function AddressForm({ prizeAwardId, prizeName, onSuccess, onBack }: Props) {
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cities, setCities] = useState<string[]>([]);
  const [form, setForm] = useState({
    recipientName: "",
    phone: "",
    zipCode: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    state: "",
    city: "",
  });

  function set(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  useEffect(() => {
    if (!form.state) {
      setCities([]);
      return;
    }
    setCitiesLoading(true);
    fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${form.state}/municipios?orderBy=nome`
    )
      .then((r) => r.json())
      .then((data: Array<{ nome: string }>) => setCities(data.map((m) => m.nome)))
      .catch(() => setCities([]))
      .finally(() => setCitiesLoading(false));
  }, [form.state]);

  function formatCep(value: string) {
    const d = value.replace(/\D/g, "").slice(0, 8);
    return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
  }

  function formatPhone(value: string) {
    const d = value.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }

  async function handleCepBlur() {
    const cep = form.zipCode.replace(/\D/g, "");
    if (cep.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json() as {
        erro?: boolean;
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
      };
      if (data.erro) return;
      setForm((prev) => ({
        ...prev,
        street: data.logradouro || prev.street,
        neighborhood: data.bairro || prev.neighborhood,
        state: data.uf || prev.state,
        city: data.localidade || prev.city,
      }));
    } catch {
      // ignore network errors
    } finally {
      setCepLoading(false);
    }
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
          phone: form.phone,
          address: {
            street: form.street,
            number: form.number,
            complement: form.complement || undefined,
            neighborhood: form.neighborhood,
            city: form.city,
            state: form.state,
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
    boxSizing: "border-box",
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: "pointer",
    appearance: "none" as const,
    WebkitAppearance: "none" as const,
    paddingRight: "28px",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "12px",
    color: "var(--color-muted-foreground)",
    fontWeight: 500,
    marginBottom: "4px",
    display: "block",
    textAlign: "left",
  };

  const selectWrap: React.CSSProperties = { position: "relative" };
  const chevron: React.CSSProperties = {
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none",
    fontSize: "10px",
    color: "var(--color-muted-foreground)",
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

      {/* Nome */}
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

      {/* WhatsApp */}
      <div style={{ marginBottom: "16px" }}>
        <label style={labelStyle}>WhatsApp para contato</label>
        <input
          required
          type="tel"
          value={form.phone}
          onChange={(e) => set("phone", formatPhone(e.target.value))}
          placeholder="(11) 99999-9999"
          style={inputStyle}
        />
      </div>

      <p style={{ fontSize: "11px", color: "var(--color-muted-foreground)", marginBottom: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        Endereço de entrega
      </p>

      {/* CEP */}
      <div style={{ marginBottom: "12px" }}>
        <label style={labelStyle}>
          CEP{cepLoading ? " — buscando…" : ""}
        </label>
        <input
          required
          value={form.zipCode}
          onChange={(e) => set("zipCode", formatCep(e.target.value))}
          onBlur={handleCepBlur}
          placeholder="00000-000"
          style={inputStyle}
        />
      </div>

      {/* Rua + Número */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 80px", gap: "8px", marginBottom: "12px" }}>
        <div>
          <label style={labelStyle}>Rua / Av.</label>
          <input
            required
            value={form.street}
            onChange={(e) => set("street", e.target.value)}
            placeholder="Rua das Flores"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Número</label>
          <input
            required
            value={form.number}
            onChange={(e) => set("number", e.target.value)}
            placeholder="123"
            style={inputStyle}
          />
        </div>
      </div>

      {/* Complemento */}
      <div style={{ marginBottom: "12px" }}>
        <label style={labelStyle}>Complemento (opcional)</label>
        <input
          value={form.complement}
          onChange={(e) => set("complement", e.target.value)}
          placeholder="Apto 42, Bloco B…"
          style={inputStyle}
        />
      </div>

      {/* Bairro */}
      <div style={{ marginBottom: "12px" }}>
        <label style={labelStyle}>Bairro</label>
        <input
          required
          value={form.neighborhood}
          onChange={(e) => set("neighborhood", e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* Estado + Cidade */}
      <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: "8px", marginBottom: "20px" }}>
        <div>
          <label style={labelStyle}>Estado</label>
          <div style={selectWrap}>
            <select
              required
              value={form.state}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, state: e.target.value, city: "" }))
              }
              style={selectStyle}
            >
              <option value="">Estado</option>
              {ESTADOS.map((s) => (
                <option key={s.uf} value={s.uf}>
                  {s.uf} – {s.nome}
                </option>
              ))}
            </select>
            <span style={chevron}>▾</span>
          </div>
        </div>
        <div>
          <label style={labelStyle}>
            Cidade{citiesLoading ? " — carregando…" : ""}
          </label>
          <div style={selectWrap}>
            <select
              required
              value={form.city}
              disabled={!form.state || citiesLoading}
              onChange={(e) => set("city", e.target.value)}
              style={{
                ...selectStyle,
                opacity: !form.state || citiesLoading ? 0.5 : 1,
                cursor: !form.state || citiesLoading ? "not-allowed" : "pointer",
              }}
            >
              <option value="">
                {!form.state
                  ? "Selecione o estado"
                  : citiesLoading
                  ? "Carregando…"
                  : "Selecione a cidade"}
              </option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <span style={chevron}>▾</span>
          </div>
        </div>
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
