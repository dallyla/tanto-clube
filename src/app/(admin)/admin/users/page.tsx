import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { scrobbles } from "@/db/schema/scrobbles";
import { eq, desc, and, gte, sql } from "drizzle-orm";
import { UsersTable } from "./users-table";

export const metadata: Metadata = { title: "Fãs" };
export const revalidate = 0;

export default async function AdminUsersPage() {
  await requireAdmin();

  const now = new Date();
  const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const since48h = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  const [allUsers, ativos24h, novos24h, novos48h, suspiciousUsers] = await Promise.all([
    db
      .select({
        id: users.id,
        displayName: users.displayName,
        email: users.email,
        avatarUrl: users.avatarUrl,
        avatarEmoji: users.avatarEmoji,
        lastfmUsername: users.lastfmUsername,
        totalPoints: users.totalPoints,
        currentStreak: users.currentStreak,
        isBanned: users.isBanned,
        banReason: users.banReason,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.isOnboarded, true))
      .orderBy(desc(users.totalPoints)),

    db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(and(eq(users.isOnboarded, true), gte(users.lastListenedAt, since24h)))
      .then((r) => r[0]?.count ?? 0),

    db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(and(eq(users.isOnboarded, true), gte(users.createdAt, since24h)))
      .then((r) => r[0]?.count ?? 0),

    db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(and(eq(users.isOnboarded, true), gte(users.createdAt, since48h)))
      .then((r) => r[0]?.count ?? 0),

    // Suspicious: non-banned users with flagged scrobbles after their last dismissal (or never dismissed)
    db
      .select({
        id: users.id,
        displayName: users.displayName,
        lastfmUsername: users.lastfmUsername,
        avatarEmoji: users.avatarEmoji,
        avatarUrl: users.avatarUrl,
        createdAt: users.createdAt,
        isBanned: users.isBanned,
        banReason: users.banReason,
        flaggedCount: sql<number>`count(${scrobbles.id})::int`,
        capReason: sql<string | null>`min(${scrobbles.capReason})`,
      })
      .from(scrobbles)
      .innerJoin(users, eq(scrobbles.userId, users.id))
      .where(
        and(
          eq(scrobbles.isCounted, false),
          eq(users.isBanned, false),
          eq(users.isOnboarded, true),
          // Only include scrobbles after the last dismissal (or all if never dismissed)
          sql`(${users.suspicionDismissedAt} is null or ${scrobbles.scrobbledAt} > ${users.suspicionDismissedAt})`,
        ),
      )
      .groupBy(
        users.id,
        users.displayName,
        users.lastfmUsername,
        users.avatarEmoji,
        users.avatarUrl,
        users.createdAt,
        users.isBanned,
        users.banReason,
      )
      .orderBy(desc(sql`count(${scrobbles.id})`))
      .limit(10),
  ]);

  const novosOntem = novos48h - novos24h;
  const novosVsOntem = novos24h - novosOntem;

  const stats = [
    { label: "TOTAL CADASTRADOS", value: allUsers.length, sub: null, cherry: false },
    { label: "ATIVOS (24H)", value: ativos24h, sub: null, cherry: false },
    {
      label: "NOVOS (24H)",
      value: novos24h,
      cherry: false,
      sub: novosVsOntem !== 0
        ? { text: `${novosVsOntem > 0 ? "+" : ""}${novosVsOntem} vs ontem`, positive: novosVsOntem > 0 }
        : null,
    },
    {
      label: "SUSPEITOS",
      value: suspiciousUsers.length,
      cherry: suspiciousUsers.length > 0,
      sub: suspiciousUsers.length > 0 ? { text: "requer revisão manual", positive: false } : null,
    },
  ];

  return (
    <div style={{ maxWidth: "1100px" }}>
      <div style={{ marginBottom: "24px" }}>
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
          Fãs
        </h1>
        <p style={{ color: "var(--color-muted-foreground)", fontSize: "14px" }}>
          {allUsers.length} {allUsers.length === 1 ? "fã cadastrado" : "fãs cadastrados"}
        </p>
      </div>

      {/* Stats cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              background: "var(--color-bg-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "12px",
              padding: "20px 24px",
            }}
          >
            <p
              style={{
                color: "var(--color-muted-foreground)",
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}
            >
              {s.label}
            </p>
            <p
              className="font-display"
              style={{
                color: s.cherry ? "var(--color-cherry)" : "var(--color-cream)",
                fontSize: "36px",
                fontStyle: "italic",
                lineHeight: 1,
                marginBottom: s.sub ? "6px" : 0,
              }}
            >
              {s.value}
            </p>
            {s.sub && (
              <p style={{ fontSize: "12px", color: s.sub.positive ? "#4ade80" : "var(--color-muted-foreground)" }}>
                {s.sub.text}
              </p>
            )}
          </div>
        ))}
      </div>

      <div
        style={{
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border)",
          borderRadius: "12px",
          padding: "20px",
        }}
      >
        <UsersTable initialUsers={allUsers} initialSuspiciousUsers={suspiciousUsers} />
      </div>
    </div>
  );
}
