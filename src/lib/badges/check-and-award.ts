import { db } from "@/db";
import { users, scrobbles, badges, userBadges } from "@/db/schema";
import { and, count, countDistinct, eq } from "drizzle-orm";

type CriteriaConfig = {
  type: "total_scrobbles" | "artist_scrobbles" | "streak_days" | "unique_tracks";
  threshold: number;
};

export async function checkAndAwardBadges(userId: string) {
  const [userRow] = await db
    .select({ longestStreak: users.longestStreak })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!userRow) return;

  const [countedRow] = await db
    .select({ count: count() })
    .from(scrobbles)
    .where(and(eq(scrobbles.userId, userId), eq(scrobbles.isCounted, true)));

  const [uniqueRow] = await db
    .select({ count: countDistinct(scrobbles.lastfmTrackKey) })
    .from(scrobbles)
    .where(eq(scrobbles.userId, userId));

  const totalCounted = countedRow?.count ?? 0;
  const uniqueTracks = uniqueRow?.count ?? 0;
  const longestStreak = userRow.longestStreak;

  const alreadyEarned = await db
    .select({ badgeId: userBadges.badgeId })
    .from(userBadges)
    .where(eq(userBadges.userId, userId));

  const earnedIds = new Set(alreadyEarned.map((r) => r.badgeId));

  const autoBadges = await db
    .select()
    .from(badges)
    .where(eq(badges.criteriaType, "automatic"));

  const toAward: string[] = [];

  for (const badge of autoBadges) {
    if (earnedIds.has(badge.id)) continue;
    const cfg = badge.criteriaConfig as CriteriaConfig | null;
    if (!cfg?.threshold) continue;

    let qualifies = false;
    switch (cfg.type) {
      case "total_scrobbles":
      case "artist_scrobbles":
        qualifies = totalCounted >= cfg.threshold;
        break;
      case "unique_tracks":
        qualifies = uniqueTracks >= cfg.threshold;
        break;
      case "streak_days":
        qualifies = longestStreak >= cfg.threshold;
        break;
    }

    if (qualifies) toAward.push(badge.id);
  }

  if (toAward.length > 0) {
    await db.insert(userBadges).values(
      toAward.map((badgeId) => ({ userId, badgeId, notifiedAt: null })),
    );
  }

  return toAward.length;
}
