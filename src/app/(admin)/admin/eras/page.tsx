import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/db";
import { eras } from "@/db/schema/eras";
import { desc } from "drizzle-orm";
import { EraActions } from "./era-actions";

export const metadata: Metadata = { title: "Eras" };
export const revalidate = 0;

const SECTION: Record<string, { label: string; color: string; borderColor: string }> = {
  active:    { label: "Em andamento",  color: "#7eb888",                    borderColor: "rgba(126,184,136,0.3)" },
  scheduled: { label: "Programadas",   color: "var(--color-gold)",          borderColor: "rgba(200,164,92,0.25)" },
  draft:     { label: "Rascunhos",     color: "var(--color-muted-foreground)", borderColor: "var(--color-border)" },
  ended:     { label: "Encerradas",    color: "var(--color-muted-foreground)", borderColor: "var(--color-border)" },
};

const STATUS_ORDER = ["active", "scheduled", "draft", "ended"] as const;

function formatRange(a: Date, b: Date) {
  const fmt = (d: Date) =>
    new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  return `${fmt(a)} → ${fmt(b)} · ${new Date(b).getFullYear()}`;
}

function countdown(endsAt: Date) {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return "encerrada";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return days > 0 ? `termina em ${days}d ${hours}h` : `termina em ${hours}h`;
}

export default async function AdminErasPage() {
  await requireAdmin();

  const allEras = await db.select().from(eras).orderBy(desc(eras.startsAt));

  const grouped = STATUS_ORDER.reduce(
    (acc, s) => { acc[s] = allEras.filter((e) => e.status === s); return acc; },
    {} as Record<string, typeof allEras>
  );

  return (
    <div style={{ maxWidth: "860px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "32px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h1
            className="font-display"
            style={{ color: "var(--color-cream)", fontSize: "28px", fontWeight: 500, fontStyle: "italic", marginBottom: "4px" }}
          >
            Eras & Desafios
          </h1>
          <p style={{ color: "var(--color-muted-foreground)", fontSize: "14px" }}>
            {allEras.length} {allEras.length === 1 ? "era cadastrada" : "eras cadastradas"}
          </p>
        </div>
        <Link
          href="/admin/eras/new"
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            background: "var(--color-cherry)",
            color: "var(--color-cream)",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          + Nova Era
        </Link>
      </div>

      {/* Grouped sections */}
      {STATUS_ORDER.map((status) => {
        const group = grouped[status];
        if (!group || group.length === 0) return null;
        const sec = SECTION[status];

        return (
          <section key={status} style={{ marginBottom: "36px" }}>
            {/* Section heading */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "14px",
              }}
            >
              <span
                className="font-display"
                style={{
                  fontSize: "11px",
                  fontStyle: "italic",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: sec.color,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                {sec.label}
              </span>
              <div style={{ flex: 1, height: "1px", background: "var(--color-border)" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {group.map((era) => (
                <div
                  key={era.id}
                  style={{
                    background: status === "active"
                      ? "linear-gradient(90deg, rgba(126,184,136,0.06), var(--color-bg-card))"
                      : "var(--color-bg-card)",
                    border: `1px solid ${status === "active" ? "rgba(126,184,136,0.35)" : "var(--color-border)"}`,
                    borderRadius: "14px",
                    padding: "18px 20px",
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto",
                    gap: "18px",
                    alignItems: "center",
                    opacity: status === "ended" ? 0.65 : 1,
                  }}
                >
                  {/* Emoji */}
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "14px",
                      background: status === "active" ? "rgba(126,184,136,0.1)" : "var(--color-bg-elevated)",
                      border: `1px solid ${status === "active" ? "rgba(126,184,136,0.3)" : "var(--color-border)"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "26px",
                      flexShrink: 0,
                    }}
                  >
                    {era.emoji}
                  </div>

                  {/* Info */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "2px" }}>
                      <p
                        className="font-display"
                        style={{ color: "var(--color-cream)", fontSize: "17px", fontWeight: 600, fontStyle: "italic" }}
                      >
                        {era.name}
                      </p>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: "99px",
                          fontSize: "10px",
                          fontWeight: 700,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          background: sec.color === "#7eb888" ? "rgba(126,184,136,0.15)" : `rgba(0,0,0,0.08)`,
                          color: sec.color,
                          border: `1px solid ${sec.borderColor}`,
                        }}
                      >
                        {SECTION[status].label.replace("Em andamento", "ativa").replace("Programadas", "agendada").replace("Rascunhos", "rascunho").replace("Encerradas", "encerrada")}
                      </span>
                    </div>
                    {era.tagline && (
                      <p
                        className="font-script"
                        style={{ color: "var(--color-gold)", fontSize: "14px", marginBottom: "4px" }}
                      >
                        {era.tagline}
                      </p>
                    )}
                    <p style={{ color: "var(--color-muted-foreground)", fontSize: "12px" }}>
                      {formatRange(era.startsAt, era.endsAt)}
                      {status === "active" && (
                        <span style={{ color: "#7eb888", marginLeft: "8px" }}>
                          · {countdown(era.endsAt)}
                        </span>
                      )}
                    </p>
                    {era.focusAlbum && (
                      <p style={{ color: "var(--color-muted-foreground)", fontSize: "11px", marginTop: "2px" }}>
                        álbum foco: {era.focusAlbum} · ×{era.focusAlbumMultiplier} · faixas: ×{era.focusTrackMultiplier}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <EraActions eraId={era.id} status={era.status} announcedAt={era.announcedAt} />
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {allEras.length === 0 && (
        <div
          style={{
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "12px",
            padding: "48px",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "32px", marginBottom: "12px" }}>🎯</p>
          <p style={{ color: "var(--color-cream)", fontWeight: 600, marginBottom: "8px" }}>
            Nenhuma era cadastrada
          </p>
          <Link
            href="/admin/eras/new"
            style={{
              display: "inline-block",
              marginTop: "8px",
              padding: "10px 24px",
              borderRadius: "8px",
              background: "var(--color-cherry)",
              color: "var(--color-cream)",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            Criar primeira era
          </Link>
        </div>
      )}
    </div>
  );
}
