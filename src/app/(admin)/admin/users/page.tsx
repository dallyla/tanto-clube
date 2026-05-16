import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { eq, desc } from "drizzle-orm";
import { UsersTable } from "./users-table";

export const metadata: Metadata = { title: "Fãs" };
export const revalidate = 0;

export default async function AdminUsersPage() {
  await requireAdmin();

  const allUsers = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      email: users.email,
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
    .orderBy(desc(users.totalPoints));

  return (
    <div style={{ maxWidth: "1100px" }}>
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
          Fãs
        </h1>
        <p style={{ color: "var(--color-muted-foreground)", fontSize: "14px" }}>
          {allUsers.length} {allUsers.length === 1 ? "fã cadastrado" : "fãs cadastrados"}
        </p>
      </div>

      <div
        style={{
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border)",
          borderRadius: "12px",
          padding: "20px",
        }}
      >
        <UsersTable initialUsers={allUsers} />
      </div>
    </div>
  );
}
