"use server";

import { db } from "@/db";
import { users } from "@/db/schema/users";
import { scrobbles } from "@/db/schema/scrobbles";
import { pointsTransactions } from "@/db/schema/points";
import { rankingsSnapshots } from "@/db/schema/rankings";
import { eras } from "@/db/schema/eras";
import { and, desc, eq, gte, sum } from "drizzle-orm";
import type { Tab, RankedFan, Trend } from "./types";
import { PAGE_SIZE } from "./types";

const TAB_TO_RANKING_TYPE: Record<Tab, "era" | "monthly" | "all_time" | "album_operation"> = {
  era: "era",
  mes: "monthly",
  geral: "all_time",
  album: "album_operation",
};

export async function fetchRankingPage(
  tab: Tab,
  offset: number,
): Promise<{ fans: RankedFan[]; hasMore: boolean }> {
  const base = {
    id: users.id,
    displayName: users.displayName,
    avatarEmoji: users.avatarEmoji,
    avatarUrl: users.avatarUrl,
    anonymousMode: users.anonymousMode,
  };

  type FanBase = Omit<RankedFan, "trend">;
  let fans: FanBase[] = [];

  if (tab === "geral") {
    fans = await db
      .select({ ...base, points: users.totalPoints })
      .from(users)
      .where(eq(users.isOnboarded, true))
      .orderBy(desc(users.totalPoints))
      .limit(PAGE_SIZE + 1)
      .offset(offset);
  } else if (tab === "era") {
    const [activeEra] = await db
      .select({ id: eras.id })
      .from(eras)
      .where(eq(eras.status, "active"))
      .limit(1);

    if (activeEra) {
      const rows = await db
        .select({ ...base, points: sum(pointsTransactions.amount).mapWith(Number) })
        .from(pointsTransactions)
        .innerJoin(users, eq(pointsTransactions.userId, users.id))
        .where(and(eq(pointsTransactions.eraId, activeEra.id), eq(users.isOnboarded, true)))
        .groupBy(users.id)
        .orderBy(desc(sum(pointsTransactions.amount)))
        .limit(PAGE_SIZE + 1)
        .offset(offset);
      fans = rows.map((r) => ({ ...r, points: r.points ?? 0 }));
    }
  } else if (tab === "mes") {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const rows = await db
      .select({ ...base, points: sum(pointsTransactions.amount).mapWith(Number) })
      .from(pointsTransactions)
      .innerJoin(users, eq(pointsTransactions.userId, users.id))
      .where(and(gte(pointsTransactions.createdAt, startOfMonth), eq(users.isOnboarded, true)))
      .groupBy(users.id)
      .orderBy(desc(sum(pointsTransactions.amount)))
      .limit(PAGE_SIZE + 1)
      .offset(offset);
    fans = rows.map((r) => ({ ...r, points: r.points ?? 0 }));
  } else {
    const rows = await db
      .select({ ...base, points: sum(scrobbles.pointsEarned).mapWith(Number) })
      .from(scrobbles)
      .innerJoin(users, eq(scrobbles.userId, users.id))
      .where(
        and(
          eq(scrobbles.isFocusAlbum, true),
          eq(scrobbles.isCounted, true),
          eq(users.isOnboarded, true),
        ),
      )
      .groupBy(users.id)
      .orderBy(desc(sum(scrobbles.pointsEarned)))
      .limit(PAGE_SIZE + 1)
      .offset(offset);
    fans = rows.map((r) => ({ ...r, points: r.points ?? 0 }));
  }

  const [snapshot] = await db
    .select({ data: rankingsSnapshots.data })
    .from(rankingsSnapshots)
    .where(eq(rankingsSnapshots.rankingType, TAB_TO_RANKING_TYPE[tab]))
    .orderBy(desc(rankingsSnapshots.computedAt))
    .limit(1);

  type SnapshotEntry = { rank: number; userId: string };
  const prevRankMap = new Map<string, number>();
  if (snapshot) {
    for (const entry of snapshot.data as SnapshotEntry[]) {
      prevRankMap.set(entry.userId, entry.rank);
    }
  }

  const hasMore = fans.length > PAGE_SIZE;
  const result: RankedFan[] = fans.slice(0, PAGE_SIZE).map((fan, idx) => {
    const currentRank = offset + idx + 1;
    const prevRank = prevRankMap.get(fan.id);
    let trend: Trend = "stable";
    if (prevRank !== undefined) {
      if (currentRank < prevRank) trend = "up";
      else if (currentRank > prevRank) trend = "down";
    }
    return { ...fan, trend };
  });

  return { fans: result, hasMore };
}
