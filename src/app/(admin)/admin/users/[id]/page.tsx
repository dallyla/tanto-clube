import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { badges, userBadges } from "@/db/schema/badges";
import { prizes, prizeAwards } from "@/db/schema/prizes";
import { scrobbles } from "@/db/schema/scrobbles";
import { eq, and, sql } from "drizzle-orm";
import { getFanLevel } from "@/lib/fan-level";
import { UserActions } from "../user-actions";
import { DismissSuspicionButton } from "./dismiss-suspicion-button";

export const metadata: Metadata = { title: "Perfil do Fã" };
export const revalidate = 0;

const PRIZE_STATUS_LABEL: Record<string, string> = {
  pending_review: "aguardando revisão",
  approved: "aprovado",
  address_pending: "aguardando endereço",
  shipped: "enviado",
  delivered: "entregue",
  cancelled: "cancelado",
};

const PRIZE_TYPE_EMOJI: Record<string, string> = {
  sticker: "📦",
  mug: "☕",
  poster: "🖼️",
  digital: "🏅",
  other: "🎁",
};

function formatDate(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
      <span
        className="font-display"
        style={{
          color: "var(--color-gold)",
          fontSize: "11px",
          fontStyle: "italic",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}
      >
        {children}
      </span>
      <div style={{ flex: 1, borderTop: "1px solid var(--color-border)" }} />
    </div>
  );
}

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const [user, earnedBadgesRaw, userPrizes, flaggedByDay] = await Promise.all([
    db.select().from(users).where(eq(users.id, id)).limit(1).then((r) => r[0]),

    db
      .select({
        badgeId: userBadges.badgeId,
        earnedAt: userBadges.earnedAt,
        name: badges.name,
        emoji: badges.emoji,
        description: badges.description,
        category: badges.category,
      })
      .from(userBadges)
      .innerJoin(badges, eq(userBadges.badgeId, badges.id))
      .where(eq(userBadges.userId, id))
      .orderBy(userBadges.earnedAt),

    db
      .select({
        id: prizeAwards.id,
        status: prizeAwards.status,
        awardedReason: prizeAwards.awardedReason,
        awardedAt: prizeAwards.awardedAt,
        prizeName: prizes.name,
        prizeDescription: prizes.description,
        prizeType: prizes.prizeType,
      })
      .from(prizeAwards)
      .innerJoin(prizes, eq(prizeAwards.prizeId, prizes.id))
      .where(eq(prizeAwards.userId, id))
      .orderBy(prizeAwards.awardedAt),

    // Flagged scrobbles grouped by day + capReason for the suspicion detail panel
    db
      .select({
        day: sql<string>`date_trunc('day', ${scrobbles.scrobbledAt})::date::text`,
        capReason: scrobbles.capReason,
        count: sql<number>`count(*)::int`,
      })
      .from(scrobbles)
      .where(and(eq(scrobbles.userId, id), eq(scrobbles.isCounted, false)))
      .groupBy(
        sql`date_trunc('day', ${scrobbles.scrobbledAt})`,
        scrobbles.capReason,
      )
      .orderBy(sql`date_trunc('day', ${scrobbles.scrobbledAt}) desc`)
      .limit(14),
  ]);

  if (!user) notFound();

  // Determine if this user is currently flagged as suspicious
  // (has flagged scrobbles after last dismissal, or never dismissed)
  const totalFlagged = flaggedByDay.reduce((sum, r) => sum + r.count, 0);
  const dismissedAt = user.suspicionDismissedAt;
  const isSuspicious = totalFlagged > 0 && (
    !dismissedAt ||
    flaggedByDay.some((r) => new Date(r.day) > dismissedAt)
  );

  const CAP_REASON_LABEL: Record<string, string> = {
    hourly_cap: "limite horário (25/h)",
    daily_focus_cap: "limite diário foco (150/dia)",
    daily_total_cap: "limite diário total (200/dia)",
  };

  // user_badges has no unique constraint on (userId, badgeId), deduplicate keeping earliest
  const seenBadgeIds = new Set<string>();
  const earnedBadges = earnedBadgesRaw.filter((b) => {
    if (seenBadgeIds.has(b.badgeId)) return false;
    seenBadgeIds.add(b.badgeId);
    return true;
  });

  const { level, progress, pointsToNext } = getFanLevel(user.totalPoints);

  const infoRows: { label: string; value: string }[] = [
    { label: "E-mail", value: user.email },
    { label: "Last.fm", value: user.lastfmUsername ?? "—" },
    { label: "Cadastro", value: formatDate(user.createdAt) },
    { label: "Último listen", value: formatDate(user.lastListenedAt ?? null) },
    { label: "Streak atual", value: `${user.currentStreak} dias 🔥` },
    { label: "Melhor streak", value: `${user.longestStreak} dias` },
    { label: "Pontos totais", value: user.totalPoints.toLocaleString("pt-BR") },
    { label: "Nível", value: `${level.emoji} ${level.name}` },
    { label: "Status", value: user.isBanned ? "Banido" : user.isOnboarded ? "Ativo" : "Não finalizado" },
  ];

  if (user.isBanned && user.banReason) {
    infoRows.push({ label: "Motivo do ban", value: user.banReason });
  }

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto" }}>
      <div style={{ marginBottom: "24px" }}>
        <Link
          href="/admin/users"
          style={{
            color: "var(--color-muted-foreground)",
            fontSize: "13px",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            marginBottom: "16px",
          }}
        >
          ← Fãs
        </Link>
        <h1
          className="font-display"
          style={{
            color: "var(--color-cream)",
            fontSize: "28px",
            fontWeight: 500,
            fontStyle: "italic",
          }}
        >
          Perfil do fã
        </h1>
      </div>

      {/* Avatar + nome */}
      <div
        style={{
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border)",
          borderRadius: "12px",
          padding: "28px",
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          gap: "20px",
        }}
      >
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            overflow: "hidden",
            flexShrink: 0,
            background: "var(--color-bg-elevated)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "36px",
          }}
        >
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            user.avatarEmoji ?? "🎵"
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: "var(--color-cream)", fontSize: "20px", fontWeight: 600, marginBottom: "4px" }}>
            {user.displayName}
          </p>
          <p style={{ color: "var(--color-muted-foreground)", fontSize: "13px" }}>
            {level.emoji} {level.name}
          </p>
        </div>
        <UserActions
          user={{ id: user.id, displayName: user.displayName, isBanned: user.isBanned, banReason: user.banReason }}
        />
      </div>

      {/* Barra de nível */}
      <div
        style={{
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border)",
          borderRadius: "12px",
          padding: "20px 24px",
          marginBottom: "16px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
          <span style={{ color: "var(--color-muted-foreground)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
            Nível
          </span>
          <span className="font-display" style={{ color: "var(--color-gold)", fontSize: "14px", fontStyle: "italic" }}>
            {user.totalPoints.toLocaleString("pt-BR")} pts
          </span>
        </div>
        <div style={{ height: "6px", background: "var(--color-bg-elevated)", borderRadius: "3px", overflow: "hidden", marginBottom: "6px" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: "var(--color-gold)", borderRadius: "3px" }} />
        </div>
        <p style={{ color: "var(--color-muted-foreground)", fontSize: "12px" }}>
          {pointsToNext !== null
            ? `Faltam ${pointsToNext.toLocaleString("pt-BR")} pts para o próximo nível`
            : "Nível máximo atingido"}
        </p>
      </div>

      {/* Info rows */}
      <div
        style={{
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border)",
          borderRadius: "12px",
          overflow: "hidden",
          marginBottom: "28px",
        }}
      >
        {infoRows.map((row, i) => (
          <div
            key={row.label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 24px",
              borderBottom: i < infoRows.length - 1 ? "1px solid var(--color-border)" : "none",
            }}
          >
            <span style={{ color: "var(--color-muted-foreground)", fontSize: "13px", fontWeight: 500 }}>
              {row.label}
            </span>
            <span
              style={{
                color: row.label === "Status" && user.isBanned ? "var(--color-cherry)" : "var(--color-cream)",
                fontSize: "13px",
                textAlign: "right",
              }}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {/* Suspeita */}
      {isSuspicious && (
        <div style={{ marginBottom: "28px" }}>
          <SectionLabel>suspeita</SectionLabel>
          <div
            style={{
              background: "rgba(196,49,75,0.04)",
              border: "1px solid rgba(196,49,75,0.3)",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid rgba(196,49,75,0.15)",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "16px",
              }}
            >
              <div>
                <p style={{ color: "var(--color-cream)", fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>
                  ⚠️ {totalFlagged.toLocaleString("pt-BR")} scrobbles bloqueados detectados
                </p>
                <p style={{ color: "var(--color-muted-foreground)", fontSize: "12px" }}>
                  Scrobbles além dos limites do sistema — pode indicar uso anormal ou ouvinte muito ativo.
                </p>
                {dismissedAt && (
                  <p style={{ color: "var(--color-muted-foreground)", fontSize: "11px", marginTop: "4px" }}>
                    Última desconsideração: {formatDate(dismissedAt)} — nova atividade detectada desde então.
                  </p>
                )}
              </div>
              <DismissSuspicionButton userId={user.id} />
            </div>

            {/* Breakdown por dia */}
            <div style={{ padding: "4px 0" }}>
              {flaggedByDay
                .filter((r) => !dismissedAt || new Date(r.day) > dismissedAt)
                .map((r) => (
                  <div
                    key={`${r.day}-${r.capReason}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 20px",
                      borderBottom: "1px solid rgba(196,49,75,0.08)",
                    }}
                  >
                    <div>
                      <span style={{ color: "var(--color-cream)", fontSize: "13px" }}>
                        {new Date(r.day).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                      <span
                        style={{
                          marginLeft: "8px",
                          padding: "2px 7px",
                          borderRadius: "4px",
                          background: "rgba(196,49,75,0.1)",
                          border: "1px solid rgba(196,49,75,0.2)",
                          color: "var(--color-cherry)",
                          fontSize: "11px",
                          fontWeight: 600,
                        }}
                      >
                        {CAP_REASON_LABEL[r.capReason ?? ""] ?? r.capReason ?? "desconhecido"}
                      </span>
                    </div>
                    <span style={{ color: "var(--color-cherry)", fontSize: "13px", fontWeight: 600 }}>
                      {r.count} bloqueados
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Badges */}
      <div style={{ marginBottom: "28px" }}>
        <SectionLabel>
          {earnedBadges.length > 0 ? `badges (${earnedBadges.length})` : "badges"}
        </SectionLabel>

        {earnedBadges.length === 0 ? (
          <div
            style={{
              background: "var(--color-bg-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "12px",
              padding: "24px",
              textAlign: "center",
            }}
          >
            <p style={{ color: "var(--color-muted-foreground)", fontSize: "13px" }}>
              Nenhuma badge conquistada ainda.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: "10px",
            }}
          >
            {earnedBadges.map((b) => (
              <div
                key={b.badgeId}
                style={{
                  background: "var(--color-bg-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "12px",
                  padding: "14px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  gap: "6px",
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, rgba(200,164,92,0.25), rgba(200,164,92,0.08))",
                    border: "1px solid rgba(200,164,92,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "22px",
                  }}
                >
                  {b.emoji}
                </div>
                <p
                  className="font-display"
                  style={{ color: "var(--color-cream)", fontSize: "13px", fontStyle: "italic", fontWeight: 500 }}
                >
                  {b.name}
                </p>
                <p style={{ color: "var(--color-muted-foreground)", fontSize: "11px" }}>
                  {formatDate(b.earnedAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Prêmios */}
      <div>
        <SectionLabel>
          {userPrizes.length > 0 ? `prêmios (${userPrizes.length})` : "prêmios"}
        </SectionLabel>

        {userPrizes.length === 0 ? (
          <div
            style={{
              background: "var(--color-bg-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "12px",
              padding: "24px",
              textAlign: "center",
            }}
          >
            <p style={{ color: "var(--color-muted-foreground)", fontSize: "13px" }}>
              Nenhum prêmio conquistado ainda.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {userPrizes.map((award) => (
              <div
                key={award.id}
                style={{
                  background: "var(--color-bg-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "12px",
                  padding: "14px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                }}
              >
                <span style={{ fontSize: "28px", flexShrink: 0 }}>
                  {PRIZE_TYPE_EMOJI[award.prizeType] ?? "🎁"}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    className="font-display"
                    style={{ color: "var(--color-cream)", fontSize: "14px", fontStyle: "italic", fontWeight: 500 }}
                  >
                    {award.prizeName}
                  </p>
                  {award.awardedReason && (
                    <p style={{ color: "var(--color-muted-foreground)", fontSize: "12px", marginTop: "2px" }}>
                      {award.awardedReason}
                    </p>
                  )}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "3px 8px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: 600,
                      background: award.status === "delivered"
                        ? "rgba(34,197,94,0.1)"
                        : award.status === "cancelled"
                          ? "rgba(196,49,75,0.12)"
                          : "rgba(200,164,92,0.1)",
                      border: `1px solid ${award.status === "delivered"
                        ? "rgba(34,197,94,0.25)"
                        : award.status === "cancelled"
                          ? "rgba(196,49,75,0.25)"
                          : "rgba(200,164,92,0.25)"}`,
                      color: award.status === "delivered"
                        ? "#4ade80"
                        : award.status === "cancelled"
                          ? "var(--color-cherry)"
                          : "var(--color-gold)",
                    }}
                  >
                    {PRIZE_STATUS_LABEL[award.status] ?? award.status}
                  </span>
                  <p style={{ color: "var(--color-muted-foreground)", fontSize: "11px", marginTop: "4px" }}>
                    {formatDate(award.awardedAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
