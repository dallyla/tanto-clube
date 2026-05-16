"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export type MissionForCard = {
  id: string;
  title: string;
  description: string;
  pointsReward: number;
  requiresScreenshot: boolean;
  maxCompletionsPerUser: number;
};

export type SubmissionForCard = {
  id: string;
  missionId: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason: string | null;
  notes: string | null;
} | null;

interface Props {
  mission: MissionForCard;
  submission: SubmissionForCard;
}

export default function MissionCard({ mission, submission }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const status = submission?.status;
  const canSubmit = !submission || status === "rejected";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const data = new FormData(e.currentTarget);

    try {
      const res = await fetch(`/api/missions/${mission.id}/submit`, {
        method: "POST",
        body: data,
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError((json as { error?: string }).error ?? "Erro ao enviar. Tente novamente.");
        setIsSubmitting(false);
        return;
      }

      setIsOpen(false);
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setIsSubmitting(false);
    }
  }

  const borderColor =
    status === "approved"
      ? "rgb(126 184 136 / 0.4)"
      : status === "rejected"
      ? "rgb(196 49 75 / 0.35)"
      : "var(--color-border)";

  const bg =
    status === "approved"
      ? "linear-gradient(135deg, rgb(126 184 136 / 0.07), var(--color-bg-card))"
      : "var(--color-bg-card)";

  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: bg, border: `1px solid ${borderColor}` }}
    >
      {/* Header */}
      <div className="flex justify-between items-start gap-3 mb-1">
        <p className="text-sm font-medium text-cream flex-1 leading-snug">{mission.title}</p>
        <span
          className="font-display italic font-semibold text-base flex-shrink-0"
          style={{ color: "var(--color-gold)" }}
        >
          +{mission.pointsReward}
        </span>
      </div>

      {mission.description && (
        <p className="text-xs mb-3 leading-relaxed" style={{ color: "var(--color-muted-foreground)" }}>
          {mission.description}
        </p>
      )}

      {/* Status badges */}
      {status === "pending" && (
        <p className="text-xs font-medium mt-1" style={{ color: "#7eb888" }}>
          ⏳ pendente · aguardando validação
        </p>
      )}

      {status === "approved" && (
        <p className="text-xs font-medium mt-1" style={{ color: "#7eb888" }}>
          ✓ aprovada · +{mission.pointsReward} pts adicionados
        </p>
      )}

      {status === "rejected" && (
        <div className="mt-1 mb-3">
          <p className="text-xs font-medium mb-0.5" style={{ color: "var(--color-cherry)" }}>
            ✗ rejeitada
          </p>
          {submission?.rejectionReason && (
            <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
              {submission.rejectionReason}
            </p>
          )}
        </div>
      )}

      {/* Submit button — only shown when can submit and form is closed */}
      {canSubmit && !isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="mt-3 w-full text-sm font-medium py-2 px-4 rounded-xl transition-colors"
          style={{
            background: "transparent",
            border: "1px solid var(--color-gold)",
            color: "var(--color-gold)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgb(200 164 92 / 0.1)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          }}
        >
          {status === "rejected"
            ? "Enviar de novo"
            : mission.requiresScreenshot
            ? "Enviar print"
            : "Confirmar missão"}
        </button>
      )}

      {/* Inline form */}
      {isOpen && (
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          {mission.requiresScreenshot && (
            <div>
              <label
                className="text-xs mb-1.5 block"
                style={{ color: "var(--color-muted-foreground)" }}
              >
                Screenshot{" "}
                <span style={{ color: "var(--color-cherry)" }}>*</span>
              </label>
              <input
                ref={fileRef}
                name="screenshot"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                required
                className="w-full text-xs rounded-xl py-2 px-3 cursor-pointer"
                style={{
                  background: "var(--color-bg-elevated)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-cream)",
                }}
              />
              <p className="text-xs mt-1" style={{ color: "var(--color-muted-foreground)" }}>
                JPG, PNG ou WEBP · máx. 5 MB
              </p>
            </div>
          )}

          <div>
            <label
              className="text-xs mb-1.5 block"
              style={{ color: "var(--color-muted-foreground)" }}
            >
              Observações{" "}
              <span style={{ color: "var(--color-muted-foreground)", opacity: 0.6 }}>
                (opcional)
              </span>
            </label>
            <textarea
              name="notes"
              rows={2}
              placeholder="Adicione um comentário ou link..."
              className="w-full text-sm rounded-xl py-2.5 px-3 resize-none leading-relaxed"
              style={{
                background: "var(--color-bg-elevated)",
                border: "1px solid var(--color-border)",
                color: "var(--color-cream)",
              }}
            />
          </div>

          {error && (
            <p className="text-xs" style={{ color: "var(--color-cherry)" }}>
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setError(null);
              }}
              className="flex-1 text-sm font-medium py-2 rounded-xl"
              style={{
                background: "transparent",
                border: "1px solid var(--color-border)",
                color: "var(--color-muted-foreground)",
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 text-sm font-medium py-2 rounded-xl transition-opacity"
              style={{
                background: isSubmitting
                  ? "var(--color-bg-elevated)"
                  : "linear-gradient(135deg, var(--color-cherry-deep), var(--color-cherry))",
                color: "var(--color-cream)",
                opacity: isSubmitting ? 0.6 : 1,
                border: "none",
                cursor: isSubmitting ? "not-allowed" : "pointer",
              }}
            >
              {isSubmitting ? "Enviando…" : "Enviar"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
