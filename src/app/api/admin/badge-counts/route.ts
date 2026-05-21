import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/config";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { missionSubmissions } from "@/db/schema/missions";
import { prizeAwards } from "@/db/schema/prizes";
import { scrobbles } from "@/db/schema/scrobbles";
import { eras } from "@/db/schema/eras";
import { eq, and, sql, inArray, isNull } from "drizzle-orm";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const [admin] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!admin || admin.role !== "admin")
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const [pendingMissions, pendingShipments, suspiciousUsersRows, unannouncedEras] =
    await Promise.all([
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

  return NextResponse.json({
    pendingMissions,
    pendingShipments,
    suspiciousUsers: suspiciousUsersRows,
    unannouncedEras,
  });
}
