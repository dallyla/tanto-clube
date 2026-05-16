"use client";

import { useState } from "react";

type Award = {
  id: string;
  fanName: string;
  fanEmail: string;
  avatarEmoji: string | null;
  prizeName: string;
  prizeType: string;
  awardedReason: string;
  status: string;
  awardedAt: Date;
  eraName: string | null;
};

type Props = {
  awards: Award[];
  statusLabels: Record<string, string>;
};

const STATUS_NEXT: Record<string, string | null> = {
  pending_review: "approved",
  approved: "address_pending",
  address_pending: "shipped",
  shipped: "delivered",
  delivered: null,
  cancelled: null,
};

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

export function ShipmentsTable({ awards: initial, statusLabels }: Props) {
  const [awards, setAwards] = useState(initial);
  const [updating, setUpdating] = useState<string | null>(null);

  async function advanceStatus(id: string, currentStatus: string) {
    const nextStatus = STATUS_NEXT[currentStatus];
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
            const nextStatus = STATUS_NEXT[a.status];
            return (
              <tr
                key={a.id}
                style={{
                  background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <td style={{ padding: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "18px" }}>{a.avatarEmoji ?? "🎵"}</span>
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
                  {nextStatus && (
                    <button
                      disabled={updating === a.id}
                      onClick={() => advanceStatus(a.id, a.status)}
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
                      → {statusLabels[nextStatus]}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
