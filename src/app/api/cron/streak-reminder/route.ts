import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { notifications } from "@/db/schema/notifications";
import { and, eq, gt, gte } from "drizzle-orm";

function validateCronSecret(req: NextRequest): boolean {
  const secret = req.headers.get("x-cron-secret");
  return secret === process.env.CRON_SECRET;
}

export async function GET(req: NextRequest) {
  if (!validateCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Guard against double-sends: skip if already ran in the last 20 hours
  const twentyHoursAgo = new Date(Date.now() - 20 * 60 * 60 * 1000);
  const [recentRun] = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(
      and(
        eq(notifications.type, "streak_reminder"),
        gte(notifications.createdAt, twentyHoursAgo)
      )
    )
    .limit(1);

  if (recentRun) {
    return NextResponse.json({ skipped: true, reason: "already_sent_today" });
  }

  const streakUsers = await db
    .select({ id: users.id, currentStreak: users.currentStreak })
    .from(users)
    .where(
      and(
        eq(users.isOnboarded, true),
        eq(users.isBanned, false),
        gt(users.currentStreak, 0)
      )
    );

  if (streakUsers.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  await db.insert(notifications).values(
    streakUsers.map((u) => ({
      userId: u.id,
      type: "streak_reminder" as const,
      title: `🔥 Mantenha sua sequência de ${u.currentStreak} ${u.currentStreak === 1 ? "dia" : "dias"}!`,
      body: "Ouça uma música hoje para não perder seu strike.",
      link: "/",
    }))
  );

  return NextResponse.json({ sent: streakUsers.length });
}
