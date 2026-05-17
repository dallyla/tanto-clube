import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/db";
import { eras } from "@/db/schema/eras";
import { pointsTransactions } from "@/db/schema/points";
import { eq, desc, countDistinct, and, isNotNull, inArray } from "drizzle-orm";

export const metadata: Metadata = { title: "Histórico de resultados" };
export const revalidate = 60;

export default async function ResultadosPage() {
  const announcedEras = await db
    .select({
      id: eras.id,
      name: eras.name,
      emoji: eras.emoji,
      tagline: eras.tagline,
      endsAt: eras.endsAt,
      announcedAt: eras.announcedAt,
    })
    .from(eras)
    .where(and(eq(eras.status, "ended"), isNotNull(eras.announcedAt)))
    .orderBy(desc(eras.announcedAt));

  const eraIds = announcedEras.map((e) => e.id);

  const participantCounts =
    eraIds.length > 0
      ? await db
          .select({
            eraId: pointsTransactions.eraId,
            total: countDistinct(pointsTransactions.userId),
          })
          .from(pointsTransactions)
          .where(inArray(pointsTransactions.eraId, eraIds))
          .groupBy(pointsTransactions.eraId)
      : [];

  const countMap = new Map(participantCounts.map((r) => [r.eraId, r.total]));

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div>
        <p
          className="font-display italic text-xs tracking-widest uppercase mb-1"
          style={{ color: "var(--color-gold)", letterSpacing: "0.15em" }}
        >
          🏆 histórico
        </p>
        <h1 className="font-display text-cream font-medium" style={{ fontSize: "1.75rem" }}>
          Todos os resultados
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
          {announcedEras.length} {announcedEras.length === 1 ? "era encerrada" : "eras encerradas"}
        </p>
      </div>

      {announcedEras.length === 0 ? (
        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
        >
          <p className="text-3xl mb-3">🎵</p>
          <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
            Nenhum resultado anunciado ainda.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {announcedEras.map((era, idx) => {
            const participants = countMap.get(era.id) ?? 0;
            const announcedDate = era.announcedAt!.toLocaleDateString("pt-BR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            });

            return (
              <Link
                key={era.id}
                href={`/resultado/${era.id}`}
                className="block rounded-2xl p-5 no-underline"
                style={{
                  background: idx === 0
                    ? "linear-gradient(135deg, rgb(200 164 92 / 0.10), rgb(200 164 92 / 0.03)), var(--color-bg-card)"
                    : "var(--color-bg-card)",
                  border: idx === 0
                    ? "1px solid rgba(200,164,92,0.3)"
                    : "1px solid var(--color-border)",
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{
                      background: idx === 0
                        ? "rgba(200,164,92,0.12)"
                        : "var(--color-bg-elevated)",
                      border: idx === 0
                        ? "1px solid rgba(200,164,92,0.25)"
                        : "1px solid var(--color-border)",
                    }}
                  >
                    {era.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {idx === 0 && (
                        <span
                          className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(200,164,92,0.15)", color: "var(--color-gold)" }}
                        >
                          mais recente
                        </span>
                      )}
                    </div>
                    <p className="font-display text-cream font-medium" style={{ fontSize: "1.1rem" }}>
                      {era.name}
                    </p>
                    {era.tagline && (
                      <p className="font-script text-sm" style={{ color: "var(--color-gold)", opacity: 0.85 }}>
                        {era.tagline}
                      </p>
                    )}
                    <p className="text-xs mt-1" style={{ color: "var(--color-muted-foreground)" }}>
                      Anunciado em {announcedDate} · {participants} participantes
                    </p>
                  </div>
                  <span style={{ color: "var(--color-muted-foreground)", fontSize: "1.1rem", flexShrink: 0 }}>→</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <Link
        href="/"
        className="text-center text-sm py-3"
        style={{ color: "var(--color-muted-foreground)" }}
      >
        ← voltar para a home
      </Link>
    </div>
  );
}
