"use client";

import { useState } from "react";

export type ReviewSubmission = {
  id: string;
  fanName: string;
  avatarEmoji: string;
  avatarUrl: string | null;
  missionId: string;
  missionTitle: string;
  pointsReward: number;
  screenshotUrl: string | null;
  notes: string | null;
  submittedAt: Date;
};

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "agora mesmo";
  if (mins < 60) return `há ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  return `há ${Math.floor(hours / 24)}d`;
}

const BTN_BASE: React.CSSProperties = {
  flex: 1,
  padding: "10px 0",
  borderRadius: "8px",
  fontSize: "13px",
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
  transition: "opacity 0.15s",
};

export function MissionsReviewPanel({ submissions }: { submissions: ReviewSubmission[] }) {
  const [items, setItems] = useState(submissions);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");

  const total = items.length;
  const current = items[index] ?? null;

  function goTo(i: number) {
    setIndex(Math.max(0, Math.min(i, total - 1)));
    setShowReject(false);
    setReason("");
  }

  async function review(action: "approve" | "reject") {
    if (!current) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/missions/${current.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: action === "reject" ? reason : undefined }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        alert(data.error ?? "Erro ao processar");
        return;
      }
      const next = items.filter((s) => s.id !== current.id);
      setItems(next);
      setIndex((prev) => Math.min(prev, next.length - 1));
      setShowReject(false);
      setReason("");
    } catch {
      alert("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
        borderRadius: "16px",
        overflow: "hidden",
      }}
    >
      {/* Panel header */}
      <div
        style={{
          padding: "14px 18px",
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
        }}
      >
        <p
          className="font-display"
          style={{
            color: "var(--color-gold)",
            fontSize: "11px",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontStyle: "italic",
            flexShrink: 0,
          }}
        >
          Validar Prints
        </p>
        {total > 0 && current && (
          <>
            <p
              style={{
                color: "var(--color-muted-foreground)",
                fontSize: "12px",
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              <strong style={{ color: "var(--color-cream)" }}>
                {index + 1} de {total}
              </strong>
              {" · "}
              {current.missionTitle}
            </p>
            <div style={{ display: "flex", gap: "2px", flexShrink: 0 }}>
              {(["←", "→", "↑"] as const).map((arrow, i) => {
                const disabled =
                  loading ||
                  (arrow === "←" && index === 0) ||
                  (arrow === "→" && index === total - 1);
                return (
                  <button
                    key={arrow}
                    disabled={disabled}
                    onClick={() => {
                      if (arrow === "←") goTo(index - 1);
                      else if (arrow === "→") goTo(index + 1);
                      else goTo(0);
                    }}
                    style={{
                      width: "26px",
                      height: "26px",
                      borderRadius: "6px",
                      background: "var(--color-bg-elevated)",
                      border: "1px solid var(--color-border)",
                      color: disabled ? "var(--color-border)" : "var(--color-muted-foreground)",
                      fontSize: "12px",
                      cursor: disabled ? "default" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                      fontFamily: "inherit",
                    }}
                  >
                    {arrow}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Body */}
      {total === 0 || !current ? (
        <div style={{ padding: "48px 24px", textAlign: "center" }}>
          <p style={{ fontSize: "32px", marginBottom: "12px" }}>🎉</p>
          <p style={{ color: "var(--color-cream)", fontWeight: 600, marginBottom: "4px" }}>
            Tudo em dia!
          </p>
          <p style={{ color: "var(--color-muted-foreground)", fontSize: "13px" }}>
            Nenhum print aguardando revisão
          </p>
        </div>
      ) : (
        <div style={{ padding: "18px" }}>
          {/* Fan info */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "var(--color-bg-elevated)",
                border: "1px solid var(--color-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                flexShrink: 0,
                overflow: "hidden",
              }}
            >
              {current.avatarUrl ? (
                <img
                  src={current.avatarUrl}
                  alt={current.fanName}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                current.avatarEmoji
              )}
            </div>
            <div>
              <p style={{ color: "var(--color-cream)", fontSize: "14px", fontWeight: 600 }}>
                @{current.fanName}
              </p>
              <p style={{ color: "var(--color-muted-foreground)", fontSize: "12px" }}>
                enviado {timeAgo(current.submittedAt)}
              </p>
            </div>
          </div>

          {/* Screenshot */}
          {current.screenshotUrl ? (
            <a href={current.screenshotUrl} target="_blank" rel="noreferrer" style={{ display: "block", marginBottom: "14px" }}>
              <img
                src={current.screenshotUrl}
                alt="Screenshot da missão"
                style={{
                  width: "100%",
                  maxHeight: "260px",
                  borderRadius: "10px",
                  border: "1px solid var(--color-border)",
                  objectFit: "contain",
                  background: "var(--color-bg-elevated)",
                  display: "block",
                }}
              />
            </a>
          ) : (
            <div
              style={{
                width: "100%",
                height: "160px",
                borderRadius: "10px",
                border: "1px dashed var(--color-border)",
                background: "var(--color-bg-elevated)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "14px",
              }}
            >
              <p style={{ color: "var(--color-muted-foreground)", fontSize: "13px" }}>
                Sem screenshot
              </p>
            </div>
          )}

          {/* Notes */}
          {current.notes && (
            <p
              style={{
                color: "var(--color-muted-foreground)",
                fontSize: "13px",
                fontStyle: "italic",
                textAlign: "center",
                marginBottom: "16px",
                padding: "0 4px",
              }}
            >
              "{current.notes}"
            </p>
          )}

          {/* Reject reason */}
          {showReject && (
            <div style={{ marginBottom: "12px" }}>
              <label
                style={{
                  display: "block",
                  color: "var(--color-muted-foreground)",
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "6px",
                  fontWeight: 600,
                }}
              >
                Motivo (opcional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Screenshot inválido ou fora de contexto"
                rows={2}
                style={{
                  width: "100%",
                  background: "var(--color-bg-elevated)",
                  border: "1px solid rgba(196,49,75,0.4)",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  color: "var(--color-cream)",
                  fontSize: "13px",
                  resize: "none",
                  fontFamily: "inherit",
                }}
              />
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: "flex", gap: "8px" }}>
            {!showReject ? (
              <>
                <button
                  disabled={loading}
                  onClick={() => review("approve")}
                  style={{
                    ...BTN_BASE,
                    background: "var(--color-gold)",
                    border: "none",
                    color: "var(--color-bg-primary)",
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  ✓ Aprovar
                </button>
                <button
                  disabled={loading}
                  onClick={() => setShowReject(true)}
                  style={{
                    ...BTN_BASE,
                    background: "transparent",
                    border: "1px solid var(--color-cherry)",
                    color: "var(--color-cherry)",
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  ✗ Rejeitar
                </button>
                <button
                  disabled={loading || index === total - 1}
                  onClick={() => goTo(index + 1)}
                  style={{
                    ...BTN_BASE,
                    flex: "0 0 auto",
                    padding: "10px 14px",
                    background: "transparent",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-muted-foreground)",
                    opacity: loading || index === total - 1 ? 0.4 : 1,
                  }}
                >
                  ⏭ Pular
                </button>
              </>
            ) : (
              <>
                <button
                  disabled={loading}
                  onClick={() => review("reject")}
                  style={{
                    ...BTN_BASE,
                    background: "var(--color-cherry)",
                    border: "none",
                    color: "#fff",
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  Confirmar rejeição
                </button>
                <button
                  disabled={loading}
                  onClick={() => { setShowReject(false); setReason(""); }}
                  style={{
                    ...BTN_BASE,
                    flex: "0 0 auto",
                    padding: "10px 14px",
                    background: "transparent",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-muted-foreground)",
                  }}
                >
                  Cancelar
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
