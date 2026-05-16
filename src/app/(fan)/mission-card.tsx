"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export type MissionCardData = {
  id: string;
  title: string;
  emoji: string;
  description: string;
  pointsReward: number;
  requiresScreenshot: boolean;
  endsAt: Date | null;
  eraName: string | null;
  initialStatus: "pending" | "approved" | "rejected" | null;
  rejectionReason: string | null;
};

function daysLeft(endsAt: Date | null): number | null {
  if (!endsAt) return null;
  return Math.ceil((endsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function MissionCard({ m }: { m: MissionCardData }) {
  const router = useRouter();
  const [status, setStatus] = useState(m.initialStatus);
  const [open, setOpen] = useState(false);
  const [showReason, setShowReason] = useState(false);
  const [reasonPos, setReasonPos] = useState<{ top: number; left: number } | null>(null);
  const infoRef = useRef<HTMLButtonElement>(null);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const left = daysLeft(m.endsAt);
  const urgent = left !== null && left <= 3;

  function openModal() {
    setFile(null);
    setPreview(null);
    setNotes("");
    setError(null);
    setOpen(true);
  }

  function handleFile(f: File | null) {
    setFile(f);
    setError(null);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }

  async function submit() {
    setError(null);
    if (m.requiresScreenshot && !file) {
      setError("Selecione um screenshot antes de enviar.");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      if (file) fd.append("screenshot", file);
      if (notes.trim()) fd.append("notes", notes.trim());

      const res = await fetch(`/api/missions/${m.id}/submit`, { method: "POST", body: fd });
      const data = await res.json() as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Erro ao enviar");
        return;
      }
      setStatus("pending");
      setOpen(false);
      router.refresh();
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  const canAct = status === null || status === "rejected";

  return (
    <>
      <div className="flex items-start gap-3 px-4 py-3">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
          style={{
            background: status === "approved"
              ? "rgb(200 164 92 / 0.15)"
              : "var(--color-bg-elevated)",
            border: status === "approved"
              ? "1px solid rgb(200 164 92 / 0.4)"
              : "1px solid var(--color-border)",
          }}
        >
          {m.emoji}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-medium truncate"
            style={{
              color: status === "approved" ? "var(--color-muted-foreground)" : "var(--color-cream)",
              textDecoration: status === "approved" ? "line-through" : undefined,
            }}
          >
            {m.title}
          </p>

          {/* Subtitle line */}
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className="text-xs truncate" style={{ color: "var(--color-muted-foreground)" }}>
              {status === "approved" && "concluída"}
              {status === "pending" && "aguardando validação"}
              {status === "rejected" && "rejeitada — tente novamente"}
              {status === null && (
                urgent
                  ? <span style={{ color: "#d97706", fontWeight: 600 }}>encerra em {left} {left === 1 ? "dia" : "dias"}</span>
                  : m.description
              )}
            </p>
            {status === "rejected" && m.rejectionReason && (
              <div style={{ position: "relative", flexShrink: 0 }}>
                <button
                  ref={infoRef}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (showReason) {
                      setShowReason(false);
                      setReasonPos(null);
                    } else {
                      const rect = infoRef.current?.getBoundingClientRect();
                      if (rect) setReasonPos({ top: rect.top - 8, left: rect.left + rect.width / 2 });
                      setShowReason(true);
                    }
                  }}
                  style={{
                    width: "15px", height: "15px", borderRadius: "50%",
                    background: "rgb(196 49 75 / 0.2)", border: "1px solid rgb(196 49 75 / 0.4)",
                    color: "var(--color-cherry)", fontSize: "9px", fontWeight: 700,
                    cursor: "pointer", display: "flex", alignItems: "center",
                    justifyContent: "center", fontFamily: "inherit", lineHeight: 1,
                  }}
                >
                  i
                </button>
              </div>
            )}
          </div>

          {/* Era badge */}
          <div className="mt-1.5">
            {m.eraName ? (
              <span
                style={{
                  display: "inline-block",
                  fontSize: "10px",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  padding: "2px 7px",
                  borderRadius: "99px",
                  background: "rgb(200 164 92 / 0.12)",
                  border: "1px solid rgb(200 164 92 / 0.35)",
                  color: "var(--color-gold)",
                }}
              >
                🎭 {m.eraName}
              </span>
            ) : (
              <span
                style={{
                  display: "inline-block",
                  fontSize: "10px",
                  fontWeight: 500,
                  letterSpacing: "0.06em",
                  padding: "2px 7px",
                  borderRadius: "99px",
                  background: "var(--color-bg-elevated)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-muted-foreground)",
                }}
              >
                🌐 sem era
              </span>
            )}
          </div>
        </div>

        {/* Right side: pts + action */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span
            className="font-display italic text-sm"
            style={{ color: status === "approved" ? "var(--color-muted-foreground)" : "var(--color-gold)" }}
          >
            +{m.pointsReward}
          </span>

          {status === "pending" && (
            <span
              style={{
                fontSize: "10px",
                fontWeight: 600,
                padding: "3px 8px",
                borderRadius: "6px",
                background: "rgb(217 119 6 / 0.12)",
                border: "1px solid rgb(217 119 6 / 0.3)",
                color: "#d97706",
              }}
            >
              pendente
            </span>
          )}

          {status === "approved" && (
            <span
              style={{
                fontSize: "10px",
                fontWeight: 600,
                padding: "3px 8px",
                borderRadius: "6px",
                background: "rgb(200 164 92 / 0.12)",
                border: "1px solid rgb(200 164 92 / 0.3)",
                color: "var(--color-gold)",
              }}
            >
              ✓ feita
            </span>
          )}

          {canAct && (
            <button
              onClick={openModal}
              style={{
                fontSize: "11px",
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: "7px",
                background: "var(--color-cherry)",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {m.requiresScreenshot ? "Enviar print" : "Participar"}
            </button>
          )}
        </div>
      </div>

      {/* Rejection reason tooltip */}
      {showReason && reasonPos && m.rejectionReason && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 30 }}
            onClick={() => { setShowReason(false); setReasonPos(null); }}
          />
          <div
            style={{
              position: "fixed",
              bottom: `calc(100vh - ${reasonPos.top}px + 6px)`,
              left: `${reasonPos.left}px`,
              transform: "translateX(-50%)",
              background: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border)",
              borderRadius: "8px",
              padding: "8px 10px",
              fontSize: "12px",
              color: "var(--color-cream)",
              width: "200px",
              zIndex: 31,
              boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
              lineHeight: 1.4,
              pointerEvents: "none",
            }}
          >
            <span style={{ display: "block", color: "var(--color-muted-foreground)", fontSize: "10px", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>motivo</span>
            {m.rejectionReason}
          </div>
        </>
      )}

      {/* Modal */}
      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div
            style={{
              background: "var(--color-bg-card)",
              borderRadius: "20px",
              padding: "24px 20px 28px",
              width: "100%",
              maxWidth: "440px",
              border: "1px solid var(--color-border)",
            }}
          >
            {/* Close */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
              <button
                onClick={() => setOpen(false)}
                style={{
                  width: "28px", height: "28px", borderRadius: "50%",
                  background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)",
                  color: "var(--color-muted-foreground)", fontSize: "14px",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "inherit",
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
              <span style={{ fontSize: "22px" }}>{m.emoji}</span>
              <p style={{ color: "var(--color-cream)", fontSize: "15px", fontWeight: 700, lineHeight: 1.2 }}>
                {m.title}
              </p>
            </div>
            <p style={{ color: "var(--color-muted-foreground)", fontSize: "13px", marginBottom: "20px" }}>
              {m.description}
            </p>

            {m.requiresScreenshot && (
              <>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: "none" }}
                  onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                />

                {preview ? (
                  <div style={{ position: "relative", marginBottom: "14px" }}>
                    <img
                      src={preview}
                      alt="preview"
                      style={{
                        width: "100%",
                        maxHeight: "220px",
                        objectFit: "contain",
                        borderRadius: "12px",
                        border: "1px solid var(--color-border)",
                        background: "var(--color-bg-elevated)",
                        display: "block",
                      }}
                    />
                    <button
                      onClick={() => { setFile(null); setPreview(null); }}
                      style={{
                        position: "absolute",
                        top: "8px",
                        right: "8px",
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: "rgba(0,0,0,0.6)",
                        border: "none",
                        color: "#fff",
                        fontSize: "14px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "inherit",
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => inputRef.current?.click()}
                    style={{
                      width: "100%",
                      padding: "28px 0",
                      borderRadius: "12px",
                      border: "2px dashed var(--color-border)",
                      background: "var(--color-bg-elevated)",
                      color: "var(--color-muted-foreground)",
                      fontSize: "13px",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      marginBottom: "14px",
                      display: "block",
                    }}
                  >
                    📎 Toque para selecionar o print
                  </button>
                )}

                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observação (opcional)"
                  rows={2}
                  style={{
                    width: "100%",
                    background: "var(--color-bg-elevated)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "10px",
                    padding: "10px 12px",
                    color: "var(--color-cream)",
                    fontSize: "13px",
                    resize: "none",
                    fontFamily: "inherit",
                    marginBottom: "14px",
                  }}
                />
              </>
            )}

            {!m.requiresScreenshot && (
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: "10px",
                  background: "var(--color-bg-elevated)",
                  border: "1px solid var(--color-border)",
                  marginBottom: "16px",
                  fontSize: "13px",
                  color: "var(--color-muted-foreground)",
                }}
              >
                Participação automática — sem print necessário.
              </div>
            )}

            {error && (
              <p style={{ color: "var(--color-cherry)", fontSize: "13px", marginBottom: "12px" }}>
                {error}
              </p>
            )}

            <button
              disabled={loading || (m.requiresScreenshot && !file)}
              onClick={submit}
              style={{
                width: "100%",
                padding: "14px 0",
                borderRadius: "12px",
                background: "var(--color-cherry)",
                border: "none",
                color: "#fff",
                fontSize: "15px",
                fontWeight: 700,
                cursor: loading || (m.requiresScreenshot && !file) ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                opacity: loading || (m.requiresScreenshot && !file) ? 0.4 : 1,
                transition: "opacity 0.2s",
              }}
            >
              {loading ? "Enviando…" : m.requiresScreenshot ? "Enviar print" : "Confirmar participação"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
