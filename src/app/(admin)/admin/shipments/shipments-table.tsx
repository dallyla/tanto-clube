"use client";

import { Fragment, useState } from "react";

export type ShippingAddress = {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
};

type Award = {
  id: string;
  fanName: string;
  fanEmail: string;
  avatarEmoji: string | null;
  avatarUrl: string | null;
  prizeName: string;
  prizeType: string;
  awardedReason: string;
  status: string;
  awardedAt: Date;
  eraName: string | null;
  recipientName: string | null;
  shippingAddress: ShippingAddress | null;
  trackingCode: string | null;
};

type Props = {
  awards: Award[];
  statusLabels: Record<string, string>;
};

const PHYSICAL_TYPES = new Set(["sticker", "mug", "poster", "other"]);

function getNextStatus(prizeType: string, currentStatus: string): string | null {
  if (prizeType === "badge") return null;

  if (prizeType === "digital") {
    return currentStatus === "pending_review" ? "delivered" : null;
  }

  // Physical: address_pending = waiting for user; approved = address received, ready to ship
  const map: Record<string, string | null> = {
    pending_review: "approved",
    approved: "shipped",
    address_pending: null,
    shipped: "delivered",
    delivered: null,
    cancelled: null,
  };
  return map[currentStatus] ?? null;
}

function getButtonLabel(prizeType: string, nextStatus: string, statusLabels: Record<string, string>): string {
  if (prizeType === "digital") return "Marcar como entregue";
  return `→ ${statusLabels[nextStatus] ?? nextStatus}`;
}

const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  pending_review: { bg: "rgba(200,164,92,0.1)", color: "var(--color-gold)", border: "rgba(200,164,92,0.25)" },
  approved: { bg: "rgba(34,197,94,0.08)", color: "#4ade80", border: "rgba(34,197,94,0.2)" },
  address_pending: { bg: "rgba(96,165,250,0.1)", color: "#60a5fa", border: "rgba(96,165,250,0.2)" },
  shipped: { bg: "rgba(167,139,250,0.1)", color: "#a78bfa", border: "rgba(167,139,250,0.2)" },
  delivered: { bg: "rgba(34,197,94,0.12)", color: "#4ade80", border: "rgba(34,197,94,0.25)" },
  cancelled: { bg: "rgba(196,49,75,0.08)", color: "var(--color-cherry)", border: "rgba(196,49,75,0.2)" },
};

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "2-digit" });
}

function formatAddress(addr: ShippingAddress, recipientName: string): string {
  const parts = [
    `${addr.street}, ${addr.number}${addr.complement ? ` - ${addr.complement}` : ""}`,
    addr.neighborhood,
    `${addr.city} - ${addr.state}`,
    addr.zipCode,
  ];
  return `${recipientName}\n${parts.join("\n")}`;
}

export function ShipmentsTable({ awards: initial, statusLabels }: Props) {
  const [awards, setAwards] = useState(initial);
  const [updating, setUpdating] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function advanceStatus(id: string, prizeType: string, currentStatus: string) {
    const nextStatus = getNextStatus(prizeType, currentStatus);
    if (!nextStatus) return;

    setUpdating(id);
    try {
      const res = await fetch(`/api/admin/shipments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        alert(data.error ?? "Erro ao atualizar");
        return;
      }
      setAwards((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: nextStatus } : a))
      );
    } catch {
      alert("Erro de conexão");
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {["Fã", "Prêmio", "Era", "Motivo", "Data", "Status", "Ação"].map((h) => (
              <th
                key={h}
                style={{
                  padding: "10px 12px",
                  textAlign: "left",
                  color: "var(--color-muted-foreground)",
                  fontSize: "11px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  borderBottom: "1px solid var(--color-border)",
                  whiteSpace: "nowrap",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {awards.map((a, idx) => {
            const sc = STATUS_COLORS[a.status] ?? STATUS_COLORS.pending_review;
            const nextStatus = getNextStatus(a.prizeType, a.status);
            const isPhysical = PHYSICAL_TYPES.has(a.prizeType);
            const hasAddress = isPhysical && !!a.shippingAddress && !!a.recipientName;
            const isExpanded = expandedId === a.id;
            const rowBg = idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)";

            return (
              <Fragment key={a.id}>
                <tr
                  style={{
                    background: rowBg,
                    borderBottom: isExpanded ? "none" : "1px solid var(--color-border)",
                  }}
                >
                  <td style={{ padding: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {a.avatarUrl ? (
                        <img
                          src={a.avatarUrl}
                          alt={a.fanName}
                          width={28}
                          height={28}
                          style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                        />
                      ) : (
                        <span style={{ fontSize: "18px" }}>{a.avatarEmoji ?? "🎵"}</span>
                      )}
                      <div>
                        <p style={{ color: "var(--color-cream)", fontSize: "13px", fontWeight: 500 }}>
                          {a.fanName}
                        </p>
                        <p style={{ color: "var(--color-muted-foreground)", fontSize: "11px" }}>
                          {a.fanEmail}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "12px" }}>
                    <p style={{ color: "var(--color-cream)", fontSize: "13px" }}>{a.prizeName}</p>
                    <p style={{ color: "var(--color-muted-foreground)", fontSize: "11px" }}>{a.prizeType}</p>
                  </td>
                  <td style={{ padding: "12px" }}>
                    <p style={{ color: "var(--color-muted-foreground)", fontSize: "12px" }}>
                      {a.eraName ?? "—"}
                    </p>
                  </td>
                  <td style={{ padding: "12px", maxWidth: "160px" }}>
                    <p style={{ color: "var(--color-muted-foreground)", fontSize: "12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {a.awardedReason}
                    </p>
                  </td>
                  <td style={{ padding: "12px", whiteSpace: "nowrap" }}>
                    <p style={{ color: "var(--color-muted-foreground)", fontSize: "12px" }}>
                      {formatDate(a.awardedAt)}
                    </p>
                  </td>
                  <td style={{ padding: "12px" }}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "4px",
                        background: sc.bg,
                        color: sc.color,
                        border: `1px solid ${sc.border}`,
                        fontSize: "11px",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {statusLabels[a.status] ?? a.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {nextStatus && (
                        <button
                          disabled={updating === a.id}
                          onClick={() => advanceStatus(a.id, a.prizeType, a.status)}
                          style={{
                            padding: "5px 10px",
                            borderRadius: "6px",
                            background: "var(--color-bg-elevated)",
                            border: "1px solid var(--color-border)",
                            color: "var(--color-cream)",
                            fontSize: "11px",
                            cursor: updating === a.id ? "not-allowed" : "pointer",
                            opacity: updating === a.id ? 0.6 : 1,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {getButtonLabel(a.prizeType, nextStatus, statusLabels)}
                        </button>
                      )}
                      {hasAddress && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : a.id)}
                          title="Ver endereço"
                          style={{
                            padding: "5px 8px",
                            borderRadius: "6px",
                            background: isExpanded ? "rgba(96,165,250,0.1)" : "var(--color-bg-elevated)",
                            border: `1px solid ${isExpanded ? "rgba(96,165,250,0.3)" : "var(--color-border)"}`,
                            color: isExpanded ? "#60a5fa" : "var(--color-muted-foreground)",
                            fontSize: "13px",
                            cursor: "pointer",
                            lineHeight: 1,
                          }}
                        >
                          📍
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                {isExpanded && hasAddress && (
                  <tr style={{ background: rowBg, borderBottom: "1px solid var(--color-border)" }}>
                    <td colSpan={7} style={{ padding: "0 12px 14px 52px" }}>
                      <div
                        style={{
                          background: "rgba(96,165,250,0.06)",
                          border: "1px solid rgba(96,165,250,0.2)",
                          borderRadius: "8px",
                          padding: "12px 16px",
                          display: "inline-block",
                        }}
                      >
                        <p style={{ color: "#60a5fa", fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" }}>
                          Endereço de entrega
                        </p>
                        <pre
                          style={{
                            color: "var(--color-cream)",
                            fontSize: "12px",
                            lineHeight: "1.6",
                            margin: 0,
                            fontFamily: "inherit",
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {formatAddress(a.shippingAddress!, a.recipientName!)}
                        </pre>
                        {a.trackingCode && (
                          <p style={{ color: "var(--color-muted-foreground)", fontSize: "11px", marginTop: "8px" }}>
                            Rastreio: <span style={{ color: "var(--color-cream)" }}>{a.trackingCode}</span>
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
