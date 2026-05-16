import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/db";
import { eras } from "@/db/schema/eras";
import { users } from "@/db/schema/users";
import { pointsTransactions } from "@/db/schema/points";
import { eq, desc, sum } from "drizzle-orm";
import { RankingsControls } from "./rankings-controls";

export const metadata: Metadata = { title: "Apuração" };
export const revalidate = 0;

export default async function AdminRankingsPage() {
  await requireAdmin();

  const [activeEra] = await db
    .select()
    .from(eras)
    .where(eq(eras.status, "active"))
    .limit(1);

  let leaderboard: Array<{
    userId: string;
    displayName: string;
    avatarEmoji: string | null;
    eraPoints: number;
    totalPoints: number;
  }> = [];

  if (activeEra) {
    const rows = await db
      .select({
        userId: pointsTransactions.userId,
        eraPoints: sum(pointsTransactions.amount).mapWith(Number),
        displayName: users.displayName,
        avatarEmoji: users.avatarEmoji,
        totalPoints: users.totalPoints,
      })
      .from(pointsTransactions)
      .innerJoin(users, eq(pointsTransactions.userId, users.id))
      .where(eq(pointsTransactions.eraId, activeEra.id))
      .groupBy(pointsTransactions.userId, users.displayName, users.avatarEmoji, users.totalPoints)
      .orderBy(desc(sum(pointsTransactions.amount)))
      .limit(30);

    leaderboard = rows.map((r) => ({
      userId: r.userId,
      displayName: r.displayName,
      avatarEmoji: r.avatarEmoji,
      eraPoints: r.eraPoints ?? 0,
      totalPoints: r.totalPoints,
    }));
  }

  return (
    <div style={{ maxWidth: "800px" }}>
      <div style={{ marginBottom: "32px" }}>
        <h1
          className="font-display"
          style={{
            color: "var(--color-cream)",
            fontSize: "28px",
            fontWeight: 500,
            fontStyle: "italic",
            marginBottom: "4px",
          }}
        >
          Apuração
        </h1>
        <p style={{ color: "var(--color-muted-foreground)", fontSize: "14px" }}>
          Leaderboard da era ativa · top 30
        </p>
      </div>

      {!activeEra ? (
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
            Nenhuma era ativa no momento.
          </p>
        </div>
      ) : (
        <>
          {/* Era Info */}
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
              <p
                className="font-display"
                style={{ color: "var(--color-cream)", fontSize: "18px", fontStyle: "italic" }}
              >
                {activeEra.emoji} {activeEra.name}
              </p>
              <p style={{ color: "var(--color-muted-foreground)", fontSize: "13px" }}>
                {leaderboard.length} participantes no top 30
              </p>
            </div>
            <RankingsControls eraId={activeEra.id} eraName={activeEra.name} />
          </div>

          {/* Leaderboard */}
          <div
            style={{
              background: "var(--color-bg-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            {leaderboard.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center" }}>
                <p style={{ color: "var(--color-muted-foreground)", fontSize: "14px" }}>
                  Nenhum ponto registrado nesta era ainda.
                </p>
              </div>
            ) : (
              leaderboard.map((fan, idx) => {
                const MEDALS = ["🥇", "🥈", "🥉"];
                const medal = MEDALS[idx] ?? null;
                return (
                  <div
                    key={fan.userId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "14px 20px",
                      borderBottom: idx < leaderboard.length - 1 ? "1px solid var(--color-border)" : "none",
                      background: idx < 3 ? "rgba(200,164,92,0.04)" : "transparent",
                    }}
                  >
                    <span style={{ width: "32px", textAlign: "center", fontSize: medal ? "20px" : "14px", color: "var(--color-muted-foreground)", flexShrink: 0 }}>
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
                      }}
                    >
                      {fan.avatarEmoji ?? "🎵"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: "var(--color-cream)", fontSize: "14px", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
