"use client";

import { useEffect } from "react";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = false,
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onConfirm, onCancel]);

  if (!open) return null;

  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        padding: "16px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "400px",
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border)",
          borderRadius: "20px",
          padding: "32px 28px 24px",
          boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {/* Icon */}
        <div style={{ marginBottom: "4px", fontSize: "32px", lineHeight: 1 }}>
          {danger ? "⚠️" : "❓"}
        </div>

        {/* Title */}
        <p
          className="font-display"
          style={{
            color: "var(--color-cream)",
            fontSize: "20px",
            fontWeight: 600,
            fontStyle: "italic",
            lineHeight: 1.2,
          }}
        >
          {title}
        </p>

        {/* Description */}
        {description && (
          <p style={{ color: "var(--color-muted-foreground)", fontSize: "14px", lineHeight: 1.5 }}>
            {description}
          </p>
        )}

        {/* Buttons */}
        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <button
            autoFocus
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "11px 0",
              borderRadius: "10px",
              background: "transparent",
              border: "1px solid var(--color-border)",
              color: "var(--color-muted-foreground)",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: "11px 0",
              borderRadius: "10px",
              background: danger
                ? "var(--color-cherry)"
                : "linear-gradient(135deg, rgba(126,184,136,0.9), rgba(100,160,110,0.9))",
              border: "none",
              color: "#fff",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
