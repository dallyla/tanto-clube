import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/db";
import { eras } from "@/db/schema/eras";
import { users } from "@/db/schema/users";
import { pointsTransactions } from "@/db/schema/points";
import { eq, desc, sum, or, isNull } from "drizzle-orm";
import { RankingsControls } from "./rankings-controls";

export const metadata: Metadata = { title: "Apuração" };
export const revalidate = 0;

async function getLeaderboard(eraId: string) {
  const rows = await db
    .select({
      userId: pointsTransactions.userId,
      eraPoints: sum(pointsTransactions.amount).mapWith(Number),
      displayName: users.displayName,
      avatarEmoji: users.avatarEmoji,
      avatarUrl: users.avatarUrl,
      totalPoints: users.totalPoints,
      anonymousMode: users.anonymousMode,
    })
    .from(pointsTransactions)
    .innerJoin(users, eq(pointsTransactions.userId, users.id))
    .where(eq(pointsTransactions.eraId, eraId))
    .groupBy(
      pointsTransactions.userId,
      users.displayName,
      users.avatarEmoji,
      users.avatarUrl,
      users.totalPoints,
      users.anonymousMode,
    )
    .orderBy(desc(sum(pointsTransactions.amount)))
    .limit(30);

  return rows.map((r) => ({
    userId: r.userId,
    displayName: r.anonymousMode ? "Anônimo" : r.displayName,
    avatarEmoji: r.anonymousMode ? "🎭" : (r.avatarEmoji ?? "🎵"),
    avatarUrl: r.anonymousMode ? null : r.avatarUrl,
    eraPoints: r.eraPoints ?? 0,
    totalPoints: r.totalPoints,
  }));
}

export default async function AdminRankingsPage() {
  await requireAdmin();

  const [activeEra] = await db
    .select()
    .from(eras)
    .where(eq(eras.status, "active"))
    .limit(1);

  // Era encerrada ainda não anunciada
  const [pendingEra] = await db
    .select()
    .from(eras)
    .where(eq(eras.status, "ended"))
    .orderBy(desc(eras.endsAt))
    .limit(1);

  const endedUnannounced = pendingEra && !pendingEra.announcedAt ? pendingEra : null;

  const activeLeaderboard = activeEra ? await getLeaderboard(activeEra.id) : [];
  const endedLeaderboard = endedUnannounced ? await getLeaderboard(endedUnannounced.id) : [];

  return (
    <div style={{ maxWidth: "800px" }}>
      <div style={{ marginBottom: "32px" }}>
        <h1
          className="font-display"
          style={{ color: "var(--color-cream)", fontSize: "28px", fontWeight: 500, fontStyle: "italic", marginBottom: "4px" }}
        >
          Apuração
        </h1>
        <p style={{ color: "var(--color-muted-foreground)", fontSize: "14px" }}>
          Confirme o ranking, anuncie resultados e atribua prêmios
        </p>
      </div>

      {/* Era encerrada aguardando anúncio */}
      {endedUnannounced && (
        <section style={{ marginBottom: "40px" }}>
          <div
            style={{
              background: "rgba(212,165,116,0.08)",
              border: "1px solid rgba(212,165,116,0.35)",
              borderRadius: "12px",
              padding: "20px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <p
                style={{ color: "var(--color-warning)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}
              >
                ⏳ Aguardando anúncio
              </p>
              <p className="font-display" style={{ color: "var(--color-cream)", fontSize: "20px", fontStyle: "italic" }}>
                {endedUnannounced.emoji} {endedUnannounced.name}
              </p>
              <p style={{ color: "var(--color-muted-foreground)", fontSize: "13px" }}>
                Encerrada · {endedLeaderboard.length} participantes no top 30
              </p>
            </div>
            <RankingsControls
              eraId={endedUnannounced.id}
              eraName={endedUnannounced.name}
              mode="announce"
            />
          </div>

          <p
            style={{ fontSize: "13px", color: "var(--color-muted-foreground)", marginBottom: "16px" }}
          >
            Revise o ranking final antes de confirmar. A ação de anunciar é irreversível.
          </p>

          <Leaderboard rows={endedLeaderboard} />
        </section>
      )}

      {/* Era ativa */}
      {activeEra ? (
        <section>
          <div
            style={{
              background: "var(--color-bg-card)",
              border: "1px solid var(--color-border-strong)",
              borderRadius: "12px",
              padding: "20px",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <p className="font-display" style={{ color: "var(--color-cream)", fontSize: "18px", fontStyle: "italic" }}>
                {activeEra.emoji} {activeEra.name}
              </p>
              <p style={{ color: "var(--color-muted-foreground)", fontSize: "13px" }}>
                Era ativa · {activeLeaderboard.length} participantes no top 30
              </p>
            </div>
            <RankingsControls eraId={activeEra.id} eraName={activeEra.name} mode="end" />
          </div>

          <Leaderboard rows={activeLeaderboard} />
        </section>
      ) : !endedUnannounced ? (
        <div
          style={{
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "12px",
            padding: "40px",
            textAlign: "center",
          }}
        >
          <p style={{ color: "var(--color-muted-foreground)", fontSize: "14px" }}>
            Nenhuma era ativa ou pendente no momento.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function Leaderboard({
  rows,
}: {
  rows: Array<{ userId: string; displayName: string; avatarEmoji: string; avatarUrl: string | null; eraPoints: number; totalPoints: number }>;
}) {
  const MEDALS = ["🥇", "🥈", "🥉"];

  if (rows.length === 0) {
    return (
      <div
        style={{
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border)",
          borderRadius: "12px",
          padding: "40px",
          textAlign: "center",
        }}
      >
        <p style={{ color: "var(--color-muted-foreground)", fontSize: "14px" }}>
          Nenhum ponto registrado ainda.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      {rows.map((fan, idx) => {
        const medal = MEDALS[idx] ?? null;
        return (
          <div
            key={fan.userId}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "14px 20px",
              borderBottom: idx < rows.length - 1 ? "1px solid var(--color-border)" : "none",
              background: idx < 3 ? "rgba(200,164,92,0.04)" : "transparent",
            }}
          >
            <span
              style={{
                width: "32px",
                textAlign: "center",
                fontSize: medal ? "20px" : "14px",
                color: "var(--color-muted-foreground)",
                flexShrink: 0,
              }}
            >
              {medal ?? `#${idx + 1}`}
            </span>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "var(--color-bg-elevated)",
                border: "1px solid var(--color-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                flexShrink: 0,
                overflow: "hidden",
              }}
            >
              {fan.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fan.avatarUrl} alt={fan.displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : fan.avatarEmoji}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  color: "var(--color-cream)",
                  fontSize: "14px",
                  fontWeight: 500,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {fan.displayName}
              </p>
              <p style={{ color: "var(--color-muted-foreground)", fontSize: "11px" }}>
                total geral: {fan.totalPoints.toLocaleString("pt-BR")} pts
              </p>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <p className="font-display" style={{ color: "var(--color-gold)", fontSize: "18px", fontStyle: "italic" }}>
                {fan.eraPoints.toLocaleString("pt-BR")}
              </p>
              <p style={{ color: "var(--color-muted-foreground)", fontSize: "11px" }}>pts era</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
