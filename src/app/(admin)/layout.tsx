import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/auth/admin";
import { AdminSidebar } from "./admin-sidebar";
import { db } from "@/db";
import { missionSubmissions } from "@/db/schema/missions";
import { prizeAwards } from "@/db/schema/prizes";
import { users } from "@/db/schema/users";
import { scrobbles } from "@/db/schema/scrobbles";
import { eras } from "@/db/schema/eras";
import { eq, and, sql, inArray, isNull } from "drizzle-orm";

export const metadata = { title: { template: "%s | Admin TANTO", default: "Admin TANTO" } };

async function fetchBadgeCounts() {
  const [pendingMissions, pendingShipments, suspiciousUsers, unannouncedEras] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(missionSubmissions)
      .where(eq(missionSubmissions.status, "pending"))
      .then((r) => r[0]?.count ?? 0),

    db
      .select({ count: sql<number>`count(*)::int` })
      .from(prizeAwards)
      .where(inArray(prizeAwards.status, ["pending_review", "address_pending"]))
      .then((r) => r[0]?.count ?? 0),

    db
      .select({ userId: scrobbles.userId })
      .from(scrobbles)
      .innerJoin(users, eq(scrobbles.userId, users.id))
      .where(
        and(
          eq(scrobbles.isCounted, false),
          eq(users.isBanned, false),
          eq(users.isOnboarded, true),
          sql`(${users.suspicionDismissedAt} is null or ${scrobbles.scrobbledAt} > ${users.suspicionDismissedAt})`,
        )
      )
      .groupBy(scrobbles.userId)
      .then((r) => r.length),

    db
      .select({ count: sql<number>`count(*)::int` })
      .from(eras)
      .where(and(eq(eras.status, "ended"), isNull(eras.announcedAt)))
      .then((r) => r[0]?.count ?? 0),
  ]);

  return { pendingMissions, pendingShipments, suspiciousUsers, unannouncedEras };
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const [session, badges] = await Promise.all([requireAdmin(), fetchBadgeCounts()]);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--color-bg-primary)",
      }}
    >
      <AdminSidebar displayName={session.user.name ?? session.user.email} badges={badges} />

      <main
        style={{
          flex: 1,
          minWidth: 0,
          padding: "32px",
          overflowY: "auto",
        }}
      >
        {children}
      </main>
    </div>
  );
}
